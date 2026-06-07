import type { CollectionConfig } from 'payload'
import { isStaff } from '../access'

/** Fleet vehicles (BUS-01..04). Reference data for capacity planning. */
export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'seatCapacity', 'active'],
    group: 'Catalog',
  },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true },
    { name: 'seatCapacity', type: 'number', defaultValue: 25, required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
