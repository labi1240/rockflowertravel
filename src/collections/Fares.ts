import type { CollectionConfig } from 'payload'
import { isStaff, publicRead } from '../access'

/**
 * Admin-editable sellable price. The checkout route prices server-authoritatively from
 * this collection. `slug` is the stable fare id (the old `Fare.id`, e.g. `banff-ll`) —
 * Payload auto-generates the numeric `id`, so we key lookups on `slug`.
 */
export const Fares: CollectionConfig = {
  slug: 'fares',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'slug', 'tier', 'priceCents', 'active'],
    group: 'Catalog',
  },
  access: { read: publicRead, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable fare id, e.g. banff-ll, sunrise-banff-moraine.' },
    },
    {
      name: 'tier',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Sunrise', value: 'sunrise' },
        { label: 'Daytime', value: 'daytime' },
        { label: 'Evening', value: 'evening' },
      ],
    },
    {
      name: 'route',
      type: 'relationship',
      relationTo: 'routes',
      admin: { description: 'The route this fare sells (drives inventory keying).' },
    },
    {
      name: 'routeKind',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Legacy inventory-bucket tag (RouteKind value as string). Optional for new fares.',
      },
    },
    { name: 'label', type: 'text', required: true },
    { name: 'short', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'origin', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'destination', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'priceCents', type: 'number', required: true, admin: { width: '50%', description: 'Base fare per seat, CAD cents, pre-GST.' } },
        { name: 'tollCents', type: 'number', defaultValue: 0, admin: { width: '50%', description: 'Moraine toll per passenger, CAD cents.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'roundTrip', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
        { name: 'premium', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
      ],
    },
    { name: 'defaultTime', type: 'text', required: true, admin: { description: 'Display default departure, e.g. "7:00 AM".' } },
    { name: 'note', type: 'textarea' },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Hide from selectors + reject at checkout when off.' },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, index: true },
    {
      name: 'sale',
      type: 'group',
      admin: { description: 'Optional temporary sale. Active when now ∈ [starts, ends].' },
      fields: [
        { name: 'salePriceCents', type: 'number', admin: { description: 'Effective per-seat price while the sale is active. Must be < base price.' } },
        {
          type: 'row',
          fields: [
            { name: 'saleStartsAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'saleEndsAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
          ],
        },
      ],
    },
  ],
}
