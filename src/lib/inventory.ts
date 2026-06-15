import 'server-only'

import type { Payload } from 'payload'

/**
 * Per-departure seat inventory.
 *
 * A "departure" is keyed by (routeSlug, serviceDate, departureTime) — exactly what a
 * Booking records and what a rider picks. `seatsBooked` includes pending holds.
 *
 * Oversell safety relies on a single atomic, conditional SQL UPDATE
 * (`... WHERE seats_booked + n <= seats_total`): concurrent requests can't both pass the
 * guard because Postgres serializes the row update. Rows are auto-provisioned at the
 * default capacity via an `INSERT … ON CONFLICT DO NOTHING` so admins needn't pre-create
 * every departure. We hit the raw pg pool (the Payload Local API has no conditional
 * UPDATE primitive); table/column identifiers match the generated Payload schema.
 */

export const DEFAULT_DEPARTURE_SEATS = 24

export interface DepartureKey {
  routeSlug: string
  serviceDateISO: string // "YYYY-MM-DD"
  departureTime: string // "7:00 AM"
}

export interface DepartureSeats {
  seatsTotal: number
  seatsBooked: number // includes pending holds
  seatsRemaining: number
}

// `service_date` is a timestamptz; we always store/compare at UTC midnight of the day so
// the unique index dedupes and equality matches are exact.
const toUTCMidnight = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

interface PgPool {
  query: (
    text: string,
    params?: unknown[],
  ) => Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>
}

const pool = (payload: Payload): PgPool =>
  (payload.db as unknown as { pool: PgPool }).pool

/**
 * Read seat availability for a departure WITHOUT mutating it. A missing row means a fresh
 * departure at default capacity (no row is created — reads stay side-effect free).
 * `seatsBooked` includes pending holds, so the figure is conservative (may surge slightly
 * early); call `releaseExpiredHolds` first when an exact count matters (the checkout does).
 */
export async function getDepartureSeats(
  payload: Payload,
  key: DepartureKey,
): Promise<DepartureSeats> {
  const res = await pool(payload).query(
    `SELECT seats_total, seats_booked FROM departure_inventory
       WHERE route_slug = $1 AND service_date = $2 AND departure_time = $3
     LIMIT 1`,
    [key.routeSlug, toUTCMidnight(key.serviceDateISO), key.departureTime],
  )
  if (!res.rows.length) {
    return { seatsTotal: DEFAULT_DEPARTURE_SEATS, seatsBooked: 0, seatsRemaining: DEFAULT_DEPARTURE_SEATS }
  }
  const seatsTotal = Number(res.rows[0].seats_total)
  const seatsBooked = Number(res.rows[0].seats_booked)
  return { seatsTotal, seatsBooked, seatsRemaining: Math.max(0, seatsTotal - seatsBooked) }
}

/**
 * Atomically reserve `seats` on a departure. Returns true if reserved, false if the
 * departure can't fit them (sold out). Auto-creates the inventory row at default capacity.
 * NOTE: this commits immediately — the caller must release seats if a later step
 * (booking creation, payment intent) fails (see the checkout endpoint's compensating path).
 */
export async function reserveDepartureSeats(
  payload: Payload,
  key: DepartureKey,
  seats: number,
): Promise<boolean> {
  const db = pool(payload)
  const serviceDate = toUTCMidnight(key.serviceDateISO)

  await db.query(
    `INSERT INTO departure_inventory
       (route_slug, service_date, departure_time, seats_total, seats_booked)
     VALUES ($1, $2, $3, $4, 0)
     ON CONFLICT (route_slug, service_date, departure_time) DO NOTHING`,
    [key.routeSlug, serviceDate, key.departureTime, DEFAULT_DEPARTURE_SEATS],
  )

  const res = await db.query(
    `UPDATE departure_inventory
       SET seats_booked = seats_booked + $1, updated_at = now()
     WHERE route_slug = $2 AND service_date = $3 AND departure_time = $4
       AND seats_booked + $1 <= seats_total`,
    [seats, key.routeSlug, serviceDate, key.departureTime],
  )

  return res.rowCount === 1
}

/** Release `seats` back to a departure (floor at 0). */
export async function releaseDepartureSeats(
  payload: Payload,
  key: DepartureKey,
  seats: number,
): Promise<void> {
  await pool(payload).query(
    `UPDATE departure_inventory
       SET seats_booked = GREATEST(0, seats_booked - $1), updated_at = now()
     WHERE route_slug = $2 AND service_date = $3 AND departure_time = $4`,
    [seats, key.routeSlug, toUTCMidnight(key.serviceDateISO), key.departureTime],
  )
}

/**
 * Expire PENDING_PAYMENT holds whose window has passed and release their seats.
 * Each booking is transitioned with a conditional update so a seat is released at most
 * once. Optionally scope to a single departure (cheap path called at checkout) — omit
 * `scope` for a global sweep (cron).
 */
export async function releaseExpiredHolds(
  payload: Payload,
  scope?: DepartureKey,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: {
      status: { equals: 'PENDING_PAYMENT' },
      holdExpiresAt: { less_than: new Date().toISOString() },
      ...(scope
        ? {
            routeSlug: { equals: scope.routeSlug },
            departureTime: { equals: scope.departureTime },
            serviceDate: { equals: toUTCMidnight(scope.serviceDateISO).toISOString() },
          }
        : {}),
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  let released = 0
  for (const b of docs) {
    // Conditional transition: only the request that flips PENDING_PAYMENT → EXPIRED
    // releases the seats, so concurrent sweeps can't double-release.
    const res = await pool(payload).query(
      `UPDATE bookings SET status = 'EXPIRED', updated_at = now()
       WHERE id = $1 AND status = 'PENDING_PAYMENT'`,
      [b.id],
    )
    if (res.rowCount === 1 && b.routeSlug && b.departureTime && b.serviceDate) {
      await releaseDepartureSeats(
        payload,
        {
          routeSlug: b.routeSlug as string,
          serviceDateISO: String(b.serviceDate).slice(0, 10),
          departureTime: b.departureTime as string,
        },
        (b.seats as number) ?? 1,
      )
      released += 1
    }
  }
  return released
}
