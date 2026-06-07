import type { CollectionConfig } from 'payload'
import { isStaff, publicRead } from '../access'

/**
 * One daily departure pattern for a route (e.g. "Circuit 1 (07:00)"). Legs are modeled
 * as an ordered array field — they're descriptive (live seat inventory is tracked
 * per-departure in `departure-inventory`, not per-leg), so an array beats a separate
 * collection. Times are minutes-from-midnight so the template is timezone-agnostic.
 */
export const ScheduleTemplates: CollectionConfig = {
  slug: 'schedule-templates',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'route', 'sortOrder'],
    group: 'Catalog',
  },
  access: { read: publicRead, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'route', type: 'relationship', relationTo: 'routes', required: true },
    { name: 'label', type: 'text', required: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0, required: true },
    { name: 'activeFrom', type: 'date' },
    { name: 'activeUntil', type: 'date' },
    {
      name: 'legs',
      type: 'array',
      labels: { singular: 'Leg', plural: 'Legs' },
      admin: { description: 'Ordered segments. Uncheck "bookable" for positioning/deadhead legs.' },
      fields: [
        { name: 'sequence', type: 'number', required: true },
        { name: 'fromStop', type: 'relationship', relationTo: 'stops', required: true },
        { name: 'toStop', type: 'relationship', relationTo: 'stops', required: true },
        {
          type: 'row',
          fields: [
            { name: 'departMin', type: 'number', required: true, admin: { width: '50%', description: 'Minutes from midnight' } },
            { name: 'arriveMin', type: 'number', required: true, admin: { width: '50%', description: 'Minutes from midnight' } },
          ],
        },
        { name: 'bookable', type: 'checkbox', defaultValue: true },
        { name: 'priceCents', type: 'number', defaultValue: 0, admin: { description: 'CAD cents, pre-GST (reference).' } },
      ],
    },
  ],
}
