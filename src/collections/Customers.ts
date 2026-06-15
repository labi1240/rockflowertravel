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
  auth: {
    // Reset/set-password emails (forgot-password flow) link to our own /set-password page
    // rather than the Payload admin, and match the marketing-site branding.
    forgotPassword: {
      generateEmailSubject: () => 'Set your RockFlower Travels password',
      generateEmailHTML: (args) => {
        const token = (args as { token?: string })?.token ?? ''
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://rockflowertravel.vercel.app'
        const url = `${base}/set-password?token=${encodeURIComponent(token)}`
        return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#211b16">
    <h1 style="font-size:20px;color:#114b3b;margin:0 0 4px">Set your password</h1>
    <p style="color:#6b5d50;margin:0 0 16px">Click below to choose a new password for your RockFlower Travels account. This link expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;background:#e8a13a;color:#0f2a20;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Set your password →</a>
    <p style="color:#8a7c6d;font-size:12px;margin-top:16px">If you didn't request this, you can ignore this email.</p>
  </div>`
      },
    },
  },
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
