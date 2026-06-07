import type { Block } from 'payload'

/**
 * Landing-page content blocks. These power the admin-authored, reorderable
 * marketing sections rendered on the public SEO landing pages
 * (src/app/(frontend)/[pageSlug]/page.tsx).
 *
 * Each block sets `interfaceName` so Payload emits a named TypeScript interface
 * in payload-types.ts that the render components import. Add a block here, add a
 * matching case in src/components/landing/BlockRenderer.tsx, and it is live in
 * the admin layout builder.
 */

const heading: Block['fields'][number] = {
  name: 'heading',
  type: 'text',
  admin: { description: 'Section heading. Leave blank to hide the heading row.' },
}

const subheading: Block['fields'][number] = {
  name: 'subheading',
  type: 'textarea',
  admin: { description: 'Optional intro line under the heading.' },
}

/** Bullet highlights — the Viator-style "what makes this trip" list. */
export const HighlightsBlock: Block = {
  slug: 'highlights',
  interfaceName: 'HighlightsBlock',
  labels: { singular: 'Highlights', plural: 'Highlights' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Highlight', plural: 'Highlights' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}

/** What's included / not included, side by side. */
export const InclusionsBlock: Block = {
  slug: 'inclusions',
  interfaceName: 'InclusionsBlock',
  labels: { singular: 'Includes / Excludes', plural: 'Includes / Excludes' },
  fields: [
    heading,
    {
      type: 'row',
      fields: [
        {
          name: 'includes',
          type: 'array',
          admin: { width: '50%' },
          labels: { singular: 'Included item', plural: 'Included items' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'excludes',
          type: 'array',
          admin: { width: '50%' },
          labels: { singular: 'Excluded item', plural: 'Excluded items' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}

/** Ordered, stop-by-stop itinerary. */
export const ItineraryBlock: Block = {
  slug: 'itinerary',
  interfaceName: 'ItineraryBlock',
  labels: { singular: 'Itinerary', plural: 'Itineraries' },
  fields: [
    heading,
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Stop', plural: 'Stops' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
          name: 'duration',
          type: 'text',
          admin: { description: 'Optional, e.g. "1 hr 30 min" or "Stop: 45 min".' },
        },
      ],
    },
  ],
}

/** Renders the interactive Banff → Lake Louise → Moraine route map. */
export const RouteMapBlock: Block = {
  slug: 'routeMap',
  interfaceName: 'RouteMapBlock',
  labels: { singular: 'Route Map', plural: 'Route Maps' },
  fields: [heading, subheading],
}

/** Photo gallery grid. */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    heading,
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Photo', plural: 'Photos' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}

/** "Favourite things to do" — intro + bullet list + supporting photo. */
export const ThingsToDoBlock: Block = {
  slug: 'thingsToDo',
  interfaceName: 'ThingsToDoBlock',
  labels: { singular: 'Things To Do', plural: 'Things To Do' },
  fields: [
    heading,
    { name: 'intro', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Activity', plural: 'Activities' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}

/** Customer reviews / testimonials. */
export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    heading,
    {
      name: 'reviews',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Review', plural: 'Reviews' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'location', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          defaultValue: 5,
          admin: { description: 'Stars, 1–5.' },
        },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
  ],
}

/** Editable FAQ accordion (per-page; replaces the hard-coded Faq.tsx here). */
export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    heading,
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

/** Generic rich-text content block. */
export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [{ name: 'content', type: 'richText', required: true }],
}

/** "Why choose us" feature grid. */
export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    heading,
    subheading,
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'check',
          options: [
            { label: 'Checkmark', value: 'check' },
            { label: 'Clock', value: 'clock' },
            { label: 'Map pin', value: 'pin' },
            { label: 'Calendar', value: 'calendar' },
            { label: 'Shield', value: 'shield' },
            { label: 'Star', value: 'star' },
          ],
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
      ],
    },
  ],
}

/** Full-width call-to-action banner. */
export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'CTA Banner', plural: 'CTA Banners' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'buttonLabel',
      type: 'text',
      defaultValue: 'Book now',
      admin: { description: 'Opens the booking modal for this page’s default fare.' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional background image.' } },
  ],
}

/** Every landing block, in the order they appear in the admin "add block" menu. */
export const landingBlocks: Block[] = [
  HighlightsBlock,
  FeatureGridBlock,
  InclusionsBlock,
  ItineraryBlock,
  RouteMapBlock,
  GalleryBlock,
  ThingsToDoBlock,
  TestimonialsBlock,
  FaqBlock,
  RichTextBlock,
  CtaBlock,
]
