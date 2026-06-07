import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'

export const runtime = 'nodejs'

/**
 * Staff-initiated refund. Verifies the caller is admin/operator, guards that the booking
 * is refundable, calls Stripe with a deterministic idempotency key, and writes the refund
 * audit fields. The REFUNDED status itself is written by the `charge.refunded` webhook
 * (single source of truth) — this endpoint only initiates + audits.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: req.headers })

    const isStaff =
      user?.collection === 'users' &&
      (user.roles?.includes('admin') || user.roles?.includes('operator'))
    if (!isStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as { bookingId?: number; reason?: string } | null
    if (!body?.bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
    }

    const booking = await payload.findByID({
      collection: 'bookings',
      id: body.bookingId,
      depth: 0,
      overrideAccess: true,
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only CONFIRMED bookings can be refunded.' }, { status: 409 })
    }

    const { docs: payments } = await payload.find({
      collection: 'payments',
      where: { booking: { equals: booking.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const payment = payments[0]
    if (!payment?.stripePaymentIntentId || payment.status !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'No succeeded payment to refund for this booking.' },
        { status: 409 },
      )
    }

    await stripe.refunds.create(
      { payment_intent: payment.stripePaymentIntentId },
      { idempotencyKey: `refund_${payment.stripePaymentIntentId}` },
    )

    await payload.update({
      collection: 'bookings',
      id: booking.id,
      overrideAccess: true,
      data: {
        refundedAt: new Date().toISOString(),
        refundedBy: user.email,
        refundReason: body.reason || undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[staff/refund] failed', err)
    const message = err instanceof Error ? err.message : 'Refund failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
