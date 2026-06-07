import type { CollectionConfig } from 'payload'
import { isStaff, publicRead } from '../access'

/** A pickup/dropoff point (BANFF, SAMSON, LL_LAKESHORE, MORAINE, …). */
export const Stops: CollectionConfig = {
  slug: 'stops',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name'],
    group: 'Catalog',
  },
  access: { read: publicRead, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable code, e.g. BANFF, SAMSON, LL_LAKESHORE, MORAINE.' },
    },
    { name: 'name', type: 'text', required: true },
    {
      name: 'location',
      type: 'point',
      admin: { description: 'Map coordinate [longitude, latitude].' },
    },
    { name: 'notes', type: 'textarea' },
  ],
}
