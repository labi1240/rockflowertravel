import type { Route } from '@/payload-types'
import type { BookingRouteId } from '@/store/booking-modal'
import {
  CtaSection,
  FaqSection,
  FeatureGridSection,
  GallerySection,
  HighlightsSection,
  InclusionsSection,
  ItinerarySection,
  RichTextSection,
  RouteMapSection,
  TestimonialsSection,
  ThingsToDoSection,
} from './sections'

type Block = NonNullable<Route['layout']>[number]

/**
 * Block types that read as "tour detail" text and render well in the narrow
 * content rail beside the sticky booking card. Everything else (immersive
 * full-bleed bands: feature grid, gallery, route map, things-to-do,
 * testimonials, CTA) stays full-width below. The landing page partitions
 * `layout` on this set; here it only decides which sections accept `bare`.
 */
export const RAIL_BLOCK_TYPES = new Set<Block['blockType']>([
  'highlights',
  'inclusions',
  'itinerary',
  'faq',
  'richText',
])

/**
 * Renders an admin-authored landing `layout` array to React, in order. Each
 * block's `blockType` selects its section component. `fareId` is the page's
 * default bookable fare, threaded to blocks with a booking CTA. When `bare` is
 * set the rail-eligible sections drop their full-width band so they sit inside
 * the content rail.
 */
export default function BlockRenderer({
  blocks,
  fareId,
  ratingValue,
  ratingCount,
  bare = false,
}: {
  blocks?: Block[] | null
  fareId: BookingRouteId | null
  ratingValue?: number | null
  ratingCount?: number | null
  bare?: boolean
}) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}`
        switch (block.blockType) {
          case 'highlights':
            return <HighlightsSection key={key} block={block} bare={bare} />
          case 'featureGrid':
            return <FeatureGridSection key={key} block={block} />
          case 'inclusions':
            return <InclusionsSection key={key} block={block} bare={bare} />
          case 'itinerary':
            return <ItinerarySection key={key} block={block} bare={bare} />
          case 'routeMap':
            return <RouteMapSection key={key} block={block} />
          case 'gallery':
            return <GallerySection key={key} block={block} />
          case 'thingsToDo':
            return <ThingsToDoSection key={key} block={block} />
          case 'testimonials':
            return <TestimonialsSection key={key} block={block} ratingValue={ratingValue} ratingCount={ratingCount} />
          case 'faq':
            return <FaqSection key={key} block={block} bare={bare} />
          case 'richText':
            return <RichTextSection key={key} block={block} bare={bare} />
          case 'cta':
            return <CtaSection key={key} block={block} fareId={fareId} />
          default:
            return null
        }
      })}
    </>
  )
}
