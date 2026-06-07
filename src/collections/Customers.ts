import type { CollectionConfig } from 'payload'
import { isStaff } from '../access'

/**
 * Public riders. A second auth collection — NOT the admin-panel user — so customers
 * authenticate on the marketing site but cannot reach /admin. Replaces the Clerk
 * `User` model; bookings relate here. Guests (no account) book without a row here and
 * are reclaimable by email match (see Bookings.guestEmail).
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'phone'],
    group: 'People',
  },
  auth: true,
  access: {
    // Staff manage customers from the dashboard; a customer can read/update only itself.
    create: () => true, // self sign-up
    read: ({ req: { user }, id }) => {
      if (user?.collection === 'users') return true
      return Boolean(user?.collection === 'customers' && user.id === id)
    },
    update: ({ req: { user }, id }) => {
      if (user?.collection === 'users' && user.roles?.includes('admin')) return true
      return Boolean(user?.collection === 'customers' && user.id === id)
    },
    delete: isStaff,
  },
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'phone', type: 'text' },
  ],
}
