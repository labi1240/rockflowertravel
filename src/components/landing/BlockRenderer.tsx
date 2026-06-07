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
 * Renders an admin-authored landing `layout` array to React, in order. Each
 * block's `blockType` selects its section component. `fareId` is the page's
 * default bookable fare, threaded to blocks with a booking CTA.
 */
export default function BlockRenderer({
  blocks,
  fareId,
  ratingValue,
  ratingCount,
}: {
  blocks?: Block[] | null
  fareId: BookingRouteId | null
  ratingValue?: number | null
  ratingCount?: number | null
}) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}`
        switch (block.blockType) {
          case 'highlights':
            return <HighlightsSection key={key} block={block} />
          case 'featureGrid':
            return <FeatureGridSection key={key} block={block} />
          case 'inclusions':
            return <InclusionsSection key={key} block={block} />
          case 'itinerary':
            return <ItinerarySection key={key} block={block} />
          case 'routeMap':
            return <RouteMapSection key={key} block={block} />
          case 'gallery':
            return <GallerySection key={key} block={block} />
          case 'thingsToDo':
            return <ThingsToDoSection key={key} block={block} />
          case 'testimonials':
            return <TestimonialsSection key={key} block={block} ratingValue={ratingValue} ratingCount={ratingCount} />
          case 'faq':
            return <FaqSection key={key} block={block} />
          case 'richText':
            return <RichTextSection key={key} block={block} />
          case 'cta':
            return <CtaSection key={key} block={block} fareId={fareId} />
          default:
            return null
        }
      })}
    </>
  )
}
