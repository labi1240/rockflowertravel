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
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Card/marketing photo for this fare. Falls back to the route image, then a gradient.' },
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
      name: 'addOns',
      type: 'array',
      label: 'Optional add-ons',
      admin: {
        description:
          'Optional extras a rider can toggle on at booking, e.g. "Add Moraine Lake stop". Priced per passenger, pre-GST. GST is applied to the add-on like the base fare.',
      },
      labels: { singular: 'Add-on', plural: 'Add-ons' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', type: 'text', required: true, admin: { width: '40%', description: 'Stable id, e.g. moraine-stop. Unique within this fare.' } },
            { name: 'label', type: 'text', required: true, admin: { width: '60%', description: 'Shown on the toggle, e.g. "Add Moraine Lake".' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'priceCents', type: 'number', required: true, admin: { width: '50%', description: 'Per-passenger add-on price, CAD cents, pre-GST.' } },
            { name: 'active', type: 'checkbox', defaultValue: true, admin: { width: '50%', description: 'Hide from the booking form + reject at checkout when off.' } },
          ],
        },
        { name: 'description', type: 'text', admin: { description: 'Optional sub-label shown under the add-on (e.g. "30 min scenic detour").' } },
      ],
    },
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
