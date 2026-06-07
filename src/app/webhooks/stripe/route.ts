import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { releaseDepartureSeats } from '@/lib/inventory'
import { sendBookingConfirmation } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const findPaymentByIntent = async (piId: string) => {
    const { docs } = await payload.find({
      collection: 'payments',
      where: { stripePaymentIntentId: { equals: piId } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return docs[0] ?? null
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.bookingId
        if (!bookingId) break
        const confirmed = await payload.update({
          collection: 'bookings',
          id: Number(bookingId),
          overrideAccess: true,
          data: { status: 'CONFIRMED', holdExpiresAt: null },
        })
        // Fire-and-forget confirmation email (never blocks the webhook ack).
        if (confirmed.guestEmail) {
          await sendBookingConfirmation({
            reference: confirmed.reference,
            email: confirmed.guestEmail,
            routeName: confirmed.routeName,
            serviceDate: confirmed.serviceDate,
            departureTime: confirmed.departureTime,
            seats: confirmed.seats,
            totalCents: confirmed.totalCents,
            currency: confirmed.currency,
          })
        }
        const payment = await findPaymentByIntent(pi.id)
        if (payment) {
          await payload.update({
            collection: 'payments',
            id: payment.id,
            overrideAccess: true,
            data: {
              status: 'SUCCEEDED',
              stripeCustomerId: typeof pi.customer === 'string' ? pi.customer : undefined,
            },
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const payment = await findPaymentByIntent(pi.id)
        if (payment) {
          await payload.update({
            collection: 'payments',
            id: payment.id,
            overrideAccess: true,
            data: { status: 'FAILED' },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (!piId) break
        const payment = await findPaymentByIntent(piId)
        if (!payment) break

        const bookingRef = payment.booking
        const bookingId = typeof bookingRef === 'object' && bookingRef ? bookingRef.id : (bookingRef as number)
        const booking =
          typeof bookingRef === 'object' && bookingRef
            ? bookingRef
            : (await payload.findByID({ collection: 'bookings', id: bookingId, overrideAccess: true, depth: 0 }))

        // Only release seats when we actually transition out of an active state.
        const shouldRelease = booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT'

        await payload.update({ collection: 'bookings', id: bookingId, overrideAccess: true, data: { status: 'REFUNDED' } })
        await payload.update({ collection: 'payments', id: payment.id, overrideAccess: true, data: { status: 'REFUNDED' } })

        const routeSlug = booking.routeSlug ?? booking.routeKind ?? null
        if (shouldRelease && booking.serviceDate && booking.departureTime && routeSlug) {
          await releaseDepartureSeats(
            payload,
            {
              routeSlug,
              serviceDateISO: String(booking.serviceDate).slice(0, 10),
              departureTime: booking.departureTime,
            },
            booking.seats ?? 1,
          )
        } else if (shouldRelease) {
          console.warn(
            `[stripe-webhook] booking ${bookingId} refunded without a resolvable route/departure — seats not released.`,
          )
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe-webhook] handler failed', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
