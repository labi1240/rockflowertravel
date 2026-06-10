import type { CollectionConfig } from 'payload'
import { isStaff } from '../access'
import { landingBlocks } from './blocks/landing'

/**
 * A named shuttle service. `slug` is the stable identity (the old RouteKind enum is
 * gone — routes are pure data now, so admin-authored routes auto-surface on the site).
 * Drafts/versions on: edit a route safely, publish when ready.
 */
export const Routes: CollectionConfig = {
  slug: 'routes',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'slug', 'seoSlug', 'tier', 'isPremium'],
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
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Hero/banner photo shown on the route landing page and as a card fallback.' },
    },
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
    {
      name: 'seoSlug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Public SEO URL slug, e.g. moraine-lake-shuttle → /moraine-lake-shuttle. Leave blank to keep the route off the public landing-page URLs. Published routes only.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Landing Page',
          description: 'Marketing content for the public SEO landing page. Drafts/publish apply to the whole route.',
          fields: [
            {
              name: 'seo',
              type: 'group',
              admin: { description: 'Search + social metadata. Falls back to the route name/description when blank.' },
              fields: [
                { name: 'metaTitle', type: 'text', admin: { description: 'Defaults to "{displayName} | RockFlower Travels".' } },
                { name: 'metaDescription', type: 'textarea', admin: { description: 'Defaults to the route description. ~155 chars ideal.' } },
                { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Social share image. Defaults to the hero image.' } },
              ],
            },
            {
              name: 'hero',
              type: 'group',
              admin: { description: 'Top-of-page hero. The price + book button are generated from this route’s fares.' },
              fields: [
                { name: 'badge', type: 'text', admin: { description: 'Small pill above the headline, e.g. "Premium service".' } },
                { name: 'headline', type: 'text', admin: { description: 'Defaults to the route display name.' } },
                { name: 'subheadline', type: 'textarea', admin: { description: 'Defaults to the route description.' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'ratingValue', type: 'number', min: 0, max: 5, admin: { width: '33%', description: 'e.g. 4.9' } },
                    { name: 'ratingCount', type: 'number', min: 0, admin: { width: '33%', description: 'Number of reviews.' } },
                    { name: 'ratingSource', type: 'text', admin: { width: '34%', description: 'e.g. Google, Viator.' } },
                  ],
                },
              ],
            },
            {
              name: 'layout',
              type: 'blocks',
              admin: { description: 'Stack and reorder the page’s content sections. Renders in order, below the hero.' },
              blocks: landingBlocks,
            },
          ],
        },
      ],
    },
  ],
}
