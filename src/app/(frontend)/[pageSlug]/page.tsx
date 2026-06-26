import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingModal from '@/components/BookingModal'
import JsonLd from '@/components/JsonLd'
import BlockRenderer, { RAIL_BLOCK_TYPES } from '@/components/landing/BlockRenderer'
import HeroGallery from '@/components/landing/HeroGallery'
import BookingCard from '@/components/landing/BookingCard'
import StickyBookBar from '@/components/landing/StickyBookBar'
import RelatedRoutes from '@/components/landing/RelatedRoutes'
import ParkingNotice from '@/components/ParkingNotice'
import { Stars } from '@/components/landing/icons'
import { resolveMedia, type ResolvedImage } from '@/components/landing/media'
import { getPayloadClient } from '@/lib/payload'
import { getActiveFares, getLandingCards, type LandingCard } from '@/lib/fares-db'
import { formatCents, type FareDTO, effectiveUnitPrice } from '@/lib/fares'
import { SITE, absoluteUrl } from '@/lib/seo'
import { requestNowMs } from '@/lib/utils'
import type { Route } from '@/payload-types'

// Marketing pages are admin-authored and re-priced from live fares — render per
// request so admin edits and fare/sale changes surface immediately.
export const dynamic = 'force-dynamic'

// Top-level static segments under (frontend) take precedence over this dynamic
// segment, but guard anyway so stray paths fall through to 404 fast.
const RESERVED = new Set(['routes', 'staff', 'my-trips', 'sign-in', 'sign-up', 'privacy-policy', 'admin', 'api'])

async function loadLanding(
  seoSlug: string,
): Promise<{ route: Route; fares: FareDTO[]; related: LandingCard[] } | null> {
  if (RESERVED.has(seoSlug)) return null
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'routes',
    where: { seoSlug: { equals: seoSlug }, _status: { equals: 'published' } },
    depth: 2, // populate hero/og images + block uploads
    limit: 1,
    overrideAccess: true,
  })
  const route = docs[0]
  if (!route) return null
  const [allFares, related] = await Promise.all([
    getActiveFares(),
    getLandingCards(route.slug),
  ])
  const fares = allFares
    .filter((f) => f.routeSlug === route.slug)
    .sort((a, b) => {
      if (a.priceCents !== b.priceCents) return a.priceCents - b.priceCents
      return a.sortOrder - b.sortOrder
    })
  return { route, fares, related }
}

/** Hero images: route hero photo + any Gallery-block photos, deduped, max 5. */
function collectHeroImages(route: Route): ResolvedImage[] {
  const out: ResolvedImage[] = []
  const seen = new Set<string>()
  const push = (img: ResolvedImage | null) => {
    if (img && !seen.has(img.url)) {
      seen.add(img.url)
      out.push(img)
    }
  }
  push(resolveMedia(route.heroImage))
  for (const block of route.layout ?? []) {
    if (block.blockType === 'gallery') {
      for (const row of block.images ?? []) push(resolveMedia(row.image))
    }
  }
  return out.slice(0, 5)
}

export async function generateMetadata({ params }: { params: Promise<{ pageSlug: string }> }): Promise<Metadata> {
  const { pageSlug } = await params
  const data = await loadLanding(pageSlug)
  if (!data) return { title: 'Page not found' }
  const { route, fares } = data
  const title = route.seo?.metaTitle || `${route.displayName} | ${SITE.name}`
  const nowMs = requestNowMs()
  const minPrice = fares[0] ? effectiveUnitPrice(fares[0], nowMs) : null
  const description =
    route.seo?.metaDescription ||
    route.description ||
    `Book the ${route.displayName} with RockFlower Travels.${minPrice ? ` Seats from ${formatCents(minPrice)}.` : ''} Comfortable shuttle transit in the Canadian Rockies.`
  const og = resolveMedia(route.seo?.ogImage) ?? resolveMedia(route.heroImage)
  return {
    // Absolute so admin-authored titles (which may already include the brand)
    // aren't doubled by the root layout's "%s | RockFlower Travels" template.
    title: { absolute: title },
    description,
    alternates: { canonical: `/${pageSlug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${pageSlug}`),
      type: 'website',
      ...(og ? { images: [{ url: absoluteUrl(og.url) }] } : {}),
    },
  }
}

function buildSchema(route: Route, pageSlug: string, fares: FareDTO[], nowMs: number) {
  const url = absoluteUrl(`/${pageSlug}`)
  const img = resolveMedia(route.seo?.ogImage) ?? resolveMedia(route.heroImage)
  const offers = fares.map((f) => ({
    '@type': 'Offer',
    name: f.label,
    price: (effectiveUnitPrice(f, nowMs) / 100).toFixed(2),
    priceCurrency: 'CAD',
    availability: 'https://schema.org/InStock',
    url,
  }))
  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: route.seo?.metaTitle || route.displayName,
    description: route.seo?.metaDescription || route.description || `${route.displayName} shuttle service.`,
    ...(img ? { image: absoluteUrl(img.url) } : {}),
    brand: { '@type': 'Brand', name: SITE.name },
    ...(offers.length ? { offers } : {}),
    ...(route.hero?.ratingValue && route.hero?.ratingCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: route.hero.ratingValue,
            reviewCount: route.hero.ratingCount,
          },
        }
      : {}),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: route.displayName, item: url },
    ],
  }

  const schemas: Record<string, unknown>[] = [product, breadcrumb]

  const faqBlock = (route.layout ?? []).find((b) => b.blockType === 'faq')
  if (faqBlock && 'items' in faqBlock && faqBlock.items?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqBlock.items.map((it) => ({
        '@type': 'Question',
        name: it.question,
        acceptedAnswer: { '@type': 'Answer', text: it.answer },
      })),
    })
  }
  return schemas
}

export default async function LandingPage({ params }: { params: Promise<{ pageSlug: string }> }) {
  const { pageSlug } = await params
  const data = await loadLanding(pageSlug)
  if (!data) notFound()
  const { route, fares, related } = data

  const nowMs = requestNowMs()
  const heroImages = collectHeroImages(route)
  const defaultFare = fares[0] ?? null
  const minPrice = defaultFare ? effectiveUnitPrice(defaultFare, nowMs) : null
  const badge = route.hero?.badge || (route.isPremium ? 'Premium service' : 'Daily shuttle')
  const headline = route.hero?.headline || route.displayName
  const subheadline = route.hero?.subheadline || route.description || ''
  const rating = route.hero?.ratingValue ?? null

  const quickFacts = defaultFare
    ? [
        `Departs ${defaultFare.defaultTime}`,
        `${defaultFare.origin} → ${defaultFare.destination}`,
        defaultFare.roundTrip ? 'Round trip' : 'One way',
        'Free cancellation 24h',
      ]
    : []

  // Tour-detail blocks flow in the content rail beside the sticky booking card;
  // immersive full-bleed bands render full-width below. Order preserved within
  // each group.
  const layout = route.layout ?? []
  const railBlocks = layout.filter((b) => RAIL_BLOCK_TYPES.has(b.blockType))
  const wideBlocks = layout.filter((b) => !RAIL_BLOCK_TYPES.has(b.blockType))

  return (
    <>
      <JsonLd schema={buildSchema(route, pageSlug, fares, nowMs)} />
      <Navbar />

      <main className="main-content bg-mist-50">
        {/* Hero: title block + gallery, clear of the fixed navbar */}
        <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28">
          <nav className="mb-3 text-xs text-mist-500">
            <Link href="/" className="hover:text-evergreen-700">Home</Link> <span className="mx-1">/</span>
            <Link href="/#routes" className="hover:text-evergreen-700">Shuttles</Link> <span className="mx-1">/</span>
            <span className="text-mist-700">{route.displayName}</span>
          </nav>
          <div className="flex flex-col gap-3 pb-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sunrise-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sunrise-700">
              {badge}
            </span>
            <h1 className="font-display text-3xl font-bold leading-tight text-evergreen-800 sm:text-4xl lg:text-5xl">{headline}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {rating != null && (
                <span className="flex items-center gap-1.5">
                  <Stars value={rating} className="text-sunrise-500" />
                  <span className="font-bold text-mist-900">{rating.toFixed(1)}</span>
                  {route.hero?.ratingCount != null && <span className="text-mist-500">({route.hero.ratingCount.toLocaleString()} reviews)</span>}
                </span>
              )}
              {defaultFare && (
                <span className="text-mist-500">{defaultFare.origin} → {defaultFare.destination}</span>
              )}
            </div>
          </div>
          <HeroGallery images={heroImages} alt={headline} />
        </section>

        {/* Intro overview + tour-detail rail, paired with the sticky booking card */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold text-evergreen-800">Overview</h2>
              {subheadline && <p className="mt-3 text-mist-700">{subheadline}</p>}
              {quickFacts.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {quickFacts.map((f) => (
                    <li key={f} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-mist-700 ring-1 ring-mist-200">
                      <span className="text-evergreen-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              )}
              <ParkingNotice className="mt-8" />
              {railBlocks.length > 0 && (
                <div className="mt-12 space-y-12">
                  <BlockRenderer
                    blocks={railBlocks}
                    fareId={defaultFare?.id ?? null}
                    ratingValue={route.hero?.ratingValue}
                    ratingCount={route.hero?.ratingCount}
                    bare
                  />
                </div>
              )}
            </div>
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <BookingCard fares={fares} nowMs={nowMs} />
              </div>
            </aside>
          </div>
        </section>

        {/* Full-width immersive content blocks */}
        <BlockRenderer
          blocks={wideBlocks}
          fareId={defaultFare?.id ?? null}
          ratingValue={route.hero?.ratingValue}
          ratingCount={route.hero?.ratingCount}
        />

        {/* You might also like */}
        <RelatedRoutes cards={related} />
      </main>

      {defaultFare && minPrice != null && (
        <StickyBookBar fareId={defaultFare.id} priceLabel={formatCents(minPrice)} title={headline} />
      )}

      <Footer />
      <BookingModal />
    </>
  )
}
