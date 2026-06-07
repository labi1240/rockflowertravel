import type { CollectionConfig } from 'payload'
import { isStaff, isStaffOrOwnCustomer } from '../access'

export const BOOKING_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'REFUNDED',
  'EXPIRED',
] as const

/**
 * A rider's booking. Created server-authoritatively by the checkout endpoint (status
 * PENDING_PAYMENT + 15-min hold), confirmed by the Stripe webhook. Trip/route details are
 * denormalized snapshots frozen at hold time so later schedule/price edits don't shift
 * what the rider sees. Created/updated mainly via the checkout + webhook + cron paths —
 * the admin view is for support, refunds, and audit.
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'status', 'routeName', 'serviceDate', 'departureTime', 'seats', 'totalCents'],
    group: 'Operations',
  },
  access: {
    read: isStaffOrOwnCustomer('customer'),
    create: isStaff, // public bookings are created via the checkout endpoint (overrideAccess)
    update: isStaff,
    delete: isStaff,
  },
  indexes: [
    { fields: ['status', 'holdExpiresAt'] },
    { fields: ['serviceDate'] },
    { fields: ['guestEmail'] },
  ],
  fields: [
    { name: 'reference', type: 'text', required: true, unique: true, index: true },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      admin: { description: 'Linked rider account (null for guest checkout).' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING_PAYMENT',
      options: BOOKING_STATUSES.map((s) => ({ label: s, value: s })),
    },
    // Guest / contact fields
    {
      type: 'collapsible',
      label: 'Contact',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'guestFirstName', type: 'text', admin: { width: '50%' } },
            { name: 'guestLastName', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'guestEmail', type: 'email', admin: { width: '50%' } },
            { name: 'guestPhone', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },
    // Trip snapshot
    {
      type: 'collapsible',
      label: 'Trip snapshot',
      fields: [
        { name: 'routeName', type: 'text', admin: { description: 'Display name snapshot.' } },
        { name: 'routeSlug', type: 'text', index: true },
        { name: 'routeKind', type: 'text', admin: { description: 'Legacy enum tag; null for admin-authored routes.' } },
        {
          name: 'serviceDate',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
        },
        { name: 'departureTime', type: 'text' },
        { name: 'seats', type: 'number', defaultValue: 1, required: true },
      ],
    },
    // Pricing snapshot (CAD cents)
    {
      type: 'collapsible',
      label: 'Pricing snapshot',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'subtotalCents', type: 'number', required: true, admin: { width: '33%' } },
            { name: 'gstCents', type: 'number', required: true, admin: { width: '33%' } },
            { name: 'totalCents', type: 'number', required: true, admin: { width: '33%' } },
          ],
        },
        { name: 'currency', type: 'text', defaultValue: 'CAD', required: true },
      ],
    },
    {
      name: 'holdExpiresAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: '15-min seat hold; cleared on CONFIRMED.' },
    },
    {
      name: 'refundAction',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/admin/RefundButton#RefundButton' },
      },
    },
    // Refund audit — REFUNDED status itself is written by the Stripe webhook.
    {
      type: 'collapsible',
      label: 'Refund audit',
      admin: { initCollapsed: true },
      fields: [
        { name: 'refundedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'refundedBy', type: 'text', admin: { description: 'Admin email that initiated the refund.' } },
        { name: 'refundReason', type: 'textarea' },
      ],
    },
  ],
}
