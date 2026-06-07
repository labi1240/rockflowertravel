import type { CollectionConfig } from 'payload'
import { isStaff } from '../access'

/**
 * Seat pool for one physical departure, keyed exactly by what a Booking records:
 * route + service date + displayed departure time. `seatsBooked` includes pending holds.
 * Rows are auto-provisioned at default capacity on first reservation; admins adjust
 * `seatsTotal` (guarded so it can't drop below `seatsBooked`).
 *
 * Oversell safety is enforced by an atomic conditional SQL UPDATE in lib/inventory.ts,
 * NOT by this collection's hooks.
 */
export const DepartureInventory: CollectionConfig = {
  slug: 'departure-inventory',
  admin: {
    useAsTitle: 'departureTime',
    defaultColumns: ['routeSlug', 'serviceDate', 'departureTime', 'seatsBooked', 'seatsTotal'],
    group: 'Operations',
  },
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isStaff },
  indexes: [
    { fields: ['routeSlug', 'serviceDate', 'departureTime'], unique: true },
    { fields: ['serviceDate'] },
  ],
  fields: [
    { name: 'routeSlug', type: 'text', required: true, index: true },
    {
      name: 'serviceDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'departureTime',
      type: 'text',
      required: true,
      admin: { description: 'Displayed time, e.g. "7:00 AM" — must match Booking.departureTime.' },
    },
    { name: 'seatsTotal', type: 'number', defaultValue: 25, required: true },
    { name: 'seatsBooked', type: 'number', defaultValue: 0, required: true },
  ],
}
