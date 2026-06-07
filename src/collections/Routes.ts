import type { CollectionConfig } from 'payload'
import { isStaff, publicRead } from '../access'

/**
 * A named shuttle service. `slug` is the stable identity (the old RouteKind enum is
 * gone — routes are pure data now, so admin-authored routes auto-surface on the site).
 * Drafts/versions on: edit a route safely, publish when ready.
 */
export const Routes: CollectionConfig = {
  slug: 'routes',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'slug', 'tier', 'isPremium'],
    group: 'Catalog',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.collection === 'users') return true
      // Public sees published routes only.
      return { _status: { equals: 'published' } }
    },
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stable identity, e.g. sunrise-express, daytime-circuit.' },
    },
    { name: 'displayName', type: 'text', required: true },
    {
      name: 'tier',
      type: 'text',
      required: true,
      admin: { description: "Grouping tag: 'sunrise' | 'daytime' | 'evening' | custom." },
    },
    { name: 'isPremium', type: 'checkbox', defaultValue: false },
    { name: 'description', type: 'textarea' },
    {
      name: 'kind',
      type: 'select',
      admin: {
        description: 'Legacy inventory tag for the 3 original routes. Leave empty for new routes.',
        position: 'sidebar',
      },
      options: [
        { label: 'Sunrise Express', value: 'SUNRISE_EXPRESS' },
        { label: 'Daytime Circuit', value: 'DAYTIME_CIRCUIT' },
        { label: 'Evening Return', value: 'EVENING_RETURN' },
      ],
    },
  ],
}
