import type { CollectionConfig } from 'payload'
import { isStaff } from '../access'

export const PAYMENT_STATUSES = [
  'REQUIRES_PAYMENT',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
] as const

/** Stripe payment record, one per booking. Written by checkout + webhook. */
export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    useAsTitle: 'stripePaymentIntentId',
    defaultColumns: ['booking', 'status', 'amountTotalCents', 'stripePaymentIntentId'],
    group: 'Operations',
  },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'booking', type: 'relationship', relationTo: 'bookings', required: true, unique: true, index: true },
    { name: 'stripePaymentIntentId', type: 'text', unique: true, index: true },
    { name: 'stripeCheckoutSessionId', type: 'text', unique: true },
    { name: 'stripeCustomerId', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'amountSubtotalCents', type: 'number', required: true, admin: { width: '33%' } },
        { name: 'gstCents', type: 'number', required: true, admin: { width: '33%' } },
        { name: 'amountTotalCents', type: 'number', required: true, admin: { width: '33%' } },
      ],
    },
    { name: 'currency', type: 'text', defaultValue: 'CAD', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'REQUIRES_PAYMENT',
      options: PAYMENT_STATUSES.map((s) => ({ label: s, value: s })),
    },
  ],
}
