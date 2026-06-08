import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isAdmin, isStaff, isStaffOrOwnCustomer } from '../access'

/**
 * Per-booking support thread between a rider (`customers`) and staff (`users`).
 * One row = one message. A "thread" is all messages for a given `booking`.
 *
 * Created through Payload's auto REST API (`POST /api/messages`) by both sides:
 *  - a signed-in customer (composer on /my-trips/[reference])
 *  - staff (inline thread on the Booking edit page, or a new row in this collection)
 * The `beforeValidate` hook stamps `customer`/`sender`/`staffUser` server-side so the
 * client can never spoof who sent a message or which account it belongs to.
 */
export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['customer', 'booking', 'sender', 'readByStaffAt', 'createdAt'],
    group: 'Operations',
    description: 'Customer ↔ support messages, grouped by booking.',
  },
  access: {
    read: isStaffOrOwnCustomer('customer'),
    // Staff (admin panel) or any signed-in customer may create; the hook locks down
    // the owner/sender fields so a customer can only post as themselves.
    create: ({ req: { user } }) =>
      user?.collection === 'users' || user?.collection === 'customers',
    update: isStaff,
    delete: isAdmin,
  },
  indexes: [{ fields: ['booking', 'createdAt'] }, { fields: ['customer', 'sender', 'readByCustomerAt'] }],
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
      admin: { description: 'Thread owner. Set automatically from the signed-in account.' },
    },
    {
      name: 'sender',
      type: 'select',
      required: true,
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Staff', value: 'staff' },
      ],
      admin: { description: 'Set automatically from who is signed in.' },
    },
    {
      name: 'staffUser',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Staff member who replied (audit). Empty for customer messages.' },
    },
    { name: 'body', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'readByCustomerAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'readByStaffAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data
        const { user, payload } = req

        if (user?.collection === 'customers') {
          // Customer posting: lock owner + sender to this account, verify booking ownership.
          const bookingId = typeof data.booking === 'object' ? data.booking?.id : data.booking
          if (!bookingId) throw new APIError('A booking is required.', 400)
          const booking = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0, overrideAccess: true }).catch(() => null)
          if (!booking) throw new APIError('Booking not found.', 404)
          const ownerId = typeof booking.customer === 'object' && booking.customer ? booking.customer.id : booking.customer
          const owns = ownerId === user.id || (booking.guestEmail && booking.guestEmail === user.email)
          if (!owns) throw new APIError('You do not have access to this booking.', 403)

          data.customer = user.id
          data.sender = 'customer'
          data.staffUser = null
          return data
        }

        if (user?.collection === 'users') {
          // Staff reply: stamp sender + audit; customer/booking must be supplied.
          data.sender = 'staff'
          data.staffUser = user.id
          if (!data.customer || !data.booking) {
            throw new APIError('Staff messages require a booking and customer.', 400)
          }
          return data
        }

        throw new APIError('Sign in to send a message.', 401)
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return
        try {
          // Deferred import: email.ts is `server-only`, which the Payload CLI
          // (generate:types / importmap) can't resolve at config-load time.
          const { notifyCustomerOfReply, notifyStaffOfMessage } = await import('../lib/email')
          const { payload } = req
          const bookingId = typeof doc.booking === 'object' ? doc.booking?.id : doc.booking
          const booking = bookingId
            ? await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0, overrideAccess: true }).catch(() => null)
            : null

          if (doc.sender === 'customer') {
            await notifyStaffOfMessage({ reference: booking?.reference ?? null, bookingId: bookingId ?? null, body: doc.body })
          } else {
            const customerId = typeof doc.customer === 'object' ? doc.customer?.id : doc.customer
            const customer = customerId
              ? await payload.findByID({ collection: 'customers', id: customerId, depth: 0, overrideAccess: true }).catch(() => null)
              : null
            if (customer?.email) {
              await notifyCustomerOfReply({ email: customer.email, reference: booking?.reference ?? null, body: doc.body })
            }
          }
        } catch (err) {
          console.error('[messages] notification failed', err)
        }
      },
    ],
  },
}
