import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Staff / operators. This is the admin-panel auth collection (`admin.user`).
 * Replaces the old Clerk + ADMIN_EMAILS allowlist gating with native roles.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles'],
    group: 'Staff',
  },
  auth: true,
  access: {
    // Only admins manage other staff accounts.
    create: isAdmin,
    delete: isAdmin,
    update: ({ req: { user }, id }) => {
      if (user?.collection === 'users' && user.roles?.includes('admin')) return true
      // A staff member may edit their own record (but not their roles — see field access).
      return Boolean(user?.collection === 'users' && user.id === id)
    },
    read: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Operator', value: 'operator' },
      ],
      defaultValue: ['operator'],
      required: true,
      saveToJWT: true,
      access: {
        // Only admins can grant/revoke roles.
        update: ({ req: { user } }) =>
          Boolean(user?.collection === 'users' && user.roles?.includes('admin')),
      },
    },
  ],
}
