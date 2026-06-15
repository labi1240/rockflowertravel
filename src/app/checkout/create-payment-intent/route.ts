import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { getFareBySlug } from '@/lib/fares-db'
import { quote } from '@/lib/fares'
import {
  reserveDepartureSeats,
  releaseDepartureSeats,
  releaseExpiredHolds,
  getDepartureSeats,
  type DepartureKey,
} from '@/lib/inventory'

export const runtime = 'nodejs'

// RouteKind enum members — only persist booking.routeKind when the fare's tag is one of
// these (admin-authored routes have no enum value → null).
const ROUTE_KINDS = new Set(['SUNRISE_EXPRESS', 'DAYTIME_CIRCUIT', 'EVENING_RETURN'])

const InputSchema = z.object({
  route: z.string().min(1), // fare slug
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1),
  passengers: z.number().int().min(1).max(8),
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  selectedAddOns: z.array(z.string().min(1)).max(20).optional().default([]),
})

function generateReference(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const a = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const n = Math.floor(1000 + Math.random() * 9000)
  return `RF-${a}-${n}`
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
    }
    const { route, date, time, passengers, name, email, phone, selectedAddOns } = parsed.data

    const payload = await getPayloadClient()

    // Server-authoritative pricing — read the fare from the DB and price here.
    const fare = await getFareBySlug(route)
    if (!fare || !fare.active) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 400 })
    }

    // Route snapshot (enum-independent).
    const routeKindValue = fare.routeKind && ROUTE_KINDS.has(fare.routeKind) ? fare.routeKind : null
    const routeSlug = fare.routeSlug ?? null
    let routeName = fare.short || fare.label
    if (routeSlug) {
      const { docs } = await payload.find({
        collection: 'routes',
        where: { slug: { equals: routeSlug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (docs[0]?.displayName) routeName = docs[0].displayName
    }

    const [firstName, ...rest] = name.split(/\s+/)
    const lastName = rest.join(' ') || undefined
    const reference = generateReference()
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Per-departure inventory key — routeSlug for catalog fares, else the legacy tag.
    const inventoryKey: DepartureKey = {
      routeSlug: routeSlug ?? fare.routeKind,
      serviceDateISO: date,
      departureTime: time,
    }

    // Reclaim seats from already-expired holds on this departure first.
    await releaseExpiredHolds(payload, inventoryKey)

    // Seats left BEFORE this booking drive the demand surge (≤4 left → +12% on the seat
    // fare), read post-hold-release so it's authoritative. quote() also drops any add-on
    // key not on the fare — q.selectedAddOns is what we charge and snapshot (client prices
    // are never trusted).
    const { seatsRemaining } = await getDepartureSeats(payload, inventoryKey)
    const q = quote(fare, passengers, Date.now(), selectedAddOns, seatsRemaining)
    const { subtotalCents, gstCents, totalCents } = q

    // Link to a signed-in customer if a session is present; otherwise guest checkout.
    let customerId: number | null = null
    try {
      const { user } = await payload.auth({ headers: req.headers })
      if (user?.collection === 'customers') customerId = user.id as number
    } catch {
      // no/invalid session — guest
    }

    // Atomic reservation (commits immediately). If booking creation fails afterwards,
    // we compensate by releasing the seats.
    const reserved = await reserveDepartureSeats(payload, inventoryKey, passengers)
    if (!reserved) {
      return NextResponse.json(
        { error: 'Sorry — not enough seats left on this departure.' },
        { status: 409 },
      )
    }

    let booking
    let paymentDoc
    try {
      booking = await payload.create({
        collection: 'bookings',
        overrideAccess: true,
        data: {
          reference,
          ...(customerId ? { customer: customerId } : {}),
          status: 'PENDING_PAYMENT',
          holdExpiresAt: holdExpiresAt.toISOString(),
          seats: passengers,
          routeKind: routeKindValue ?? undefined,
          routeName,
          routeSlug: routeSlug ?? undefined,
          serviceDate: new Date(`${date}T00:00:00.000Z`).toISOString(),
          departureTime: time,
          addOns: q.selectedAddOns.map((a) => ({ key: a.key, label: a.label, priceCents: a.priceCents })),
          guestEmail: email,
          guestFirstName: firstName,
          guestLastName: lastName,
          guestPhone: phone,
          subtotalCents,
          gstCents,
          totalCents,
          currency: 'CAD',
        },
      })

      paymentDoc = await payload.create({
        collection: 'payments',
        overrideAccess: true,
        data: {
          booking: booking.id,
          amountSubtotalCents: subtotalCents,
          gstCents,
          amountTotalCents: totalCents,
          currency: 'CAD',
          status: 'REQUIRES_PAYMENT',
        },
      })
    } catch (err) {
      // Compensating action: release the seats we reserved.
      await releaseDepartureSeats(payload, inventoryKey, passengers)
      if (booking) {
        await payload.delete({ collection: 'bookings', id: booking.id, overrideAccess: true }).catch(() => {})
      }
      throw err
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'cad',
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: `${fare.label} · ${date} · ${time}`,
      metadata: {
        bookingId: String(booking.id),
        reference,
        route,
        date,
        time,
        passengers: String(passengers),
        ...(q.selectedAddOns.length ? { addOns: q.selectedAddOns.map((a) => a.key).join(',') } : {}),
      },
    })

    await payload.update({
      collection: 'payments',
      id: paymentDoc.id,
      overrideAccess: true,
      data: { stripePaymentIntentId: paymentIntent.id, status: 'PROCESSING' },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      reference,
      holdExpiresAt: holdExpiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[create-payment-intent] failed', err)
    return NextResponse.json({ error: 'Could not initialize payment' }, { status: 500 })
  }
}
