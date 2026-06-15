import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { sendCancellationRequestToStaff } from '@/lib/email'

export const runtime = 'nodejs'

const InputSchema = z.object({
  reference: z.string().trim().min(1).max(40),
  reason: z.string().trim().max(2000).optional(),
})

// Customer-initiated cancellation REQUEST (not a self-service refund). Records the ask on
// the booking and emails support; staff review and refund via the admin. Auth required.
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadClient()

    const { user } = await payload.auth({ headers: req.headers })
    if (!user || user.collection !== 'customers') {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const parsed = InputSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { reference, reason } = parsed.data

    const { docs } = await payload.find({
      collection: 'bookings',
      where: { reference: { equals: reference } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const booking = docs[0]
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Ownership: linked customer, or a guest booking made with this customer's email.
    const ownerId = typeof booking.customer === 'object' && booking.customer ? booking.customer.id : booking.customer
    const owns = ownerId === user.id || (booking.guestEmail && booking.guestEmail === user.email)
    if (!owns) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
    }

    // Only active bookings can be cancelled; ignore already-terminal states.
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 409 })
    }
    if (booking.cancellationRequestedAt) {
      return NextResponse.json({ ok: true, alreadyRequested: true })
    }

    await payload.update({
      collection: 'bookings',
      id: booking.id,
      overrideAccess: true,
      data: {
        cancellationRequestedAt: new Date().toISOString(),
        cancellationReason: reason || undefined,
      },
    })

    await sendCancellationRequestToStaff({
      reference: booking.reference,
      bookingId: booking.id,
      customerEmail: user.email ?? booking.guestEmail ?? 'unknown',
      reason,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel-request] failed', err)
    return NextResponse.json({ error: 'Could not submit request' }, { status: 500 })
  }
}
