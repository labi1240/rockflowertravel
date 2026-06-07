/**
 * Legacy → Payload data migration.
 *
 * Reads the OLD Prisma Postgres (users, bookings, payments) and re-creates the records
 * as Payload `customers`, `bookings`, `payments`. Idempotent (find-or-create by
 * email / reference) and DRY-RUN by default — pass `--write` to actually persist.
 *
 * Usage:
 *   LEGACY_DATABASE_URL='postgres://…' pnpm migrate:legacy           # dry run (counts only)
 *   LEGACY_DATABASE_URL='postgres://…' pnpm migrate:legacy --write   # perform migration
 *
 * Notes:
 *  - Clerk password hashes can't transfer; each migrated customer gets a random password
 *    and must use "forgot password" on first login. Their bookings link by email.
 *  - serviceDate/holdExpiresAt are normalized to ISO; serviceDate to UTC-midnight.
 *  - Run AGAINST THE TARGET (production) Payload DB by setting DATABASE_URL accordingly.
 */

import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { getPayload } from 'payload'
import config from '../payload.config'

const WRITE = process.argv.includes('--write')

interface LegacyUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
}
interface LegacyBooking {
  id: string
  reference: string
  userId: string | null
  guestEmail: string | null
  guestFirstName: string | null
  guestLastName: string | null
  guestPhone: string | null
  routeKind: string | null
  routeName: string | null
  routeSlug: string | null
  serviceDate: Date | null
  departureTime: string | null
  status: string
  holdExpiresAt: Date | null
  seats: number
  subtotalCents: number
  gstCents: number
  totalCents: number
  currency: string
  refundedAt: Date | null
  refundedBy: string | null
  refundReason: string | null
}
interface LegacyPayment {
  bookingId: string
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  stripeCustomerId: string | null
  amountSubtotalCents: number
  gstCents: number
  amountTotalCents: number
  currency: string
  status: string
}

const isoOrNull = (d: Date | null) => (d ? new Date(d).toISOString() : undefined)
const utcMidnight = (d: Date | null) =>
  d ? new Date(`${new Date(d).toISOString().slice(0, 10)}T00:00:00.000Z`).toISOString() : undefined

async function run() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL
  if (!legacyUrl) throw new Error('LEGACY_DATABASE_URL is not set')

  console.log(`\n=== Legacy migration (${WRITE ? 'WRITE' : 'DRY RUN'}) ===\n`)

  const legacy = new Pool({ connectionString: legacyUrl })
  const payload = await getPayload({ config })

  const stats = { customers: 0, customersSkipped: 0, bookings: 0, bookingsSkipped: 0, payments: 0 }

  // ── Customers (from legacy User) ───────────────────────────────────────────
  const { rows: users } = await legacy.query<LegacyUser>(
    `SELECT id, email, "firstName", "lastName", phone FROM "User"`,
  )
  // legacy userId → email (for booking linkage)
  const emailByUserId = new Map<string, string>()
  for (const u of users) {
    if (u.email) emailByUserId.set(u.id, u.email)
    if (!u.email) continue
    const existing = await payload.find({
      collection: 'customers',
      where: { email: { equals: u.email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      stats.customersSkipped++
      continue
    }
    if (WRITE) {
      await payload.create({
        collection: 'customers',
        overrideAccess: true,
        data: {
          email: u.email,
          password: randomUUID(), // placeholder — user resets on first login
          firstName: u.firstName ?? undefined,
          lastName: u.lastName ?? undefined,
          phone: u.phone ?? undefined,
        },
      })
    }
    stats.customers++
  }

  // helper: resolve a Payload customer id by email
  async function customerIdByEmail(email: string | null): Promise<number | null> {
    if (!email) return null
    const { docs } = await payload.find({
      collection: 'customers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    return docs[0] ? (docs[0].id as number) : null
  }

  // ── Bookings + payments ─────────────────────────────────────────────────────
  const { rows: bookings } = await legacy.query<LegacyBooking>(`SELECT * FROM "Booking"`)
  const { rows: payments } = await legacy.query<LegacyPayment>(`SELECT * FROM "Payment"`)
  const paymentByBooking = new Map(payments.map((p) => [p.bookingId, p]))

  for (const b of bookings) {
    const existing = await payload.find({
      collection: 'bookings',
      where: { reference: { equals: b.reference } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      stats.bookingsSkipped++
      continue
    }

    const linkEmail = (b.userId && emailByUserId.get(b.userId)) || b.guestEmail || null
    const customerId = await customerIdByEmail(linkEmail)

    if (WRITE) {
      const created = await payload.create({
        collection: 'bookings',
        overrideAccess: true,
        data: {
          reference: b.reference,
          ...(customerId ? { customer: customerId } : {}),
          status: b.status as never,
          holdExpiresAt: isoOrNull(b.holdExpiresAt),
          seats: b.seats ?? 1,
          routeKind: b.routeKind ?? undefined,
          routeName: b.routeName ?? undefined,
          routeSlug: b.routeSlug ?? undefined,
          serviceDate: utcMidnight(b.serviceDate),
          departureTime: b.departureTime ?? undefined,
          guestEmail: b.guestEmail ?? undefined,
          guestFirstName: b.guestFirstName ?? undefined,
          guestLastName: b.guestLastName ?? undefined,
          guestPhone: b.guestPhone ?? undefined,
          subtotalCents: b.subtotalCents,
          gstCents: b.gstCents,
          totalCents: b.totalCents,
          currency: b.currency || 'CAD',
          refundedAt: isoOrNull(b.refundedAt),
          refundedBy: b.refundedBy ?? undefined,
          refundReason: b.refundReason ?? undefined,
        },
      })
      stats.bookings++

      const p = paymentByBooking.get(b.id)
      if (p) {
        await payload.create({
          collection: 'payments',
          overrideAccess: true,
          data: {
            booking: created.id,
            stripePaymentIntentId: p.stripePaymentIntentId ?? undefined,
            stripeCheckoutSessionId: p.stripeCheckoutSessionId ?? undefined,
            stripeCustomerId: p.stripeCustomerId ?? undefined,
            amountSubtotalCents: p.amountSubtotalCents,
            gstCents: p.gstCents,
            amountTotalCents: p.amountTotalCents,
            currency: p.currency || 'CAD',
            status: p.status as never,
          },
        })
        stats.payments++
      }
    } else {
      stats.bookings++
      if (paymentByBooking.has(b.id)) stats.payments++
    }
  }

  await legacy.end()

  console.log('Legacy rows read:', { users: users.length, bookings: bookings.length, payments: payments.length })
  console.log('Migration result:', stats)
  console.log(WRITE ? '\n✅ Write complete.\n' : '\nℹ️  Dry run — re-run with --write to persist.\n')
  process.exit(0)
}

run().catch((err) => {
  console.error('[migrate-legacy] failed:', err)
  process.exit(1)
})
