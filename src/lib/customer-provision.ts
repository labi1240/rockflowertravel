import 'server-only'

import { randomBytes } from 'crypto'
import type { Payload } from 'payload'
import { sendWelcomeSetPassword } from '@/lib/email'

interface ProvisionBooking {
  id: number
  reference: string
  customer?: number | { id: number } | null
  guestEmail?: string | null
  guestFirstName?: string | null
  guestLastName?: string | null
  guestPhone?: string | null
}

/**
 * After a guest checkout is paid, give the rider an account so the booking shows up in
 * My Trips. If an account with their email already exists we just link the booking
 * (claim it); otherwise we create one with a random password and email a set-password
 * link — never a plaintext password. Already-signed-in bookings are skipped.
 * Fault-tolerant: logs and swallows errors so it never breaks the webhook ack.
 */
export async function provisionCustomerForBooking(
  payload: Payload,
  booking: ProvisionBooking,
): Promise<void> {
  try {
    const linked = typeof booking.customer === 'object' ? booking.customer?.id : booking.customer
    if (linked) return // already a signed-in customer's booking

    const email = booking.guestEmail?.trim().toLowerCase()
    if (!email) return

    const { docs } = await payload.find({
      collection: 'customers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    let customerId: number
    let isNew = false
    if (docs[0]) {
      customerId = docs[0].id as number
    } else {
      const created = await payload.create({
        collection: 'customers',
        overrideAccess: true,
        data: {
          email,
          password: randomBytes(24).toString('base64url'),
          firstName: booking.guestFirstName ?? undefined,
          lastName: booking.guestLastName ?? undefined,
          phone: booking.guestPhone ?? undefined,
        },
      })
      customerId = created.id as number
      isNew = true
    }

    // Link the booking so it appears under this customer's My Trips.
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      overrideAccess: true,
      data: { customer: customerId },
    })

    if (isNew) {
      const token = await payload.forgotPassword({
        collection: 'customers',
        data: { email },
        disableEmail: true, // we send our own branded welcome email
      })
      await sendWelcomeSetPassword({
        email,
        firstName: booking.guestFirstName,
        token: typeof token === 'string' ? token : '',
        reference: booking.reference,
      })
    }
  } catch (err) {
    console.error('[provision] failed for booking', booking.id, err)
  }
}
