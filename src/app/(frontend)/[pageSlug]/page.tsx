import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingModal from '@/components/BookingModal'
import ServiceBookButton from '@/components/ServiceBookButton'
import JsonLd from '@/components/JsonLd'
import BlockRenderer from '@/components/landing/BlockRenderer'
import { Stars } from '@/components/landing/icons'
import { resolveMedia } from '@/components/landing/media'
import { getPayloadClient } from '@/lib/payload'
import { getFaresByRouteSlug } from '@/lib/fares-db'
import { quote, formatCents, type FareDTO } from '@/lib/fares'
import { SITE, absoluteUrl } from '@/lib/seo'
import type { Route } from '@/payload-types'

// Marketing pages are admin-authored and re-priced from live fares — render per
// request so admin edits and fare/sale changes surface immediately.
export const dynamic = 'force-dynamic'

// Top-level static segments under (frontend) take precedence over this dynamic
// segment, but guard anyway so stray paths fall through to 404 fast.
const RESERVED = new Set(['routes', 'staff', 'my-trips', 'sign-in', 'sign-up', 'privacy-policy', 'admin', 'api'])

async function loadLanding(seoSlug: string): Promise<{ route: Route; fares: FareDTO[] } | null> {
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
  const fares = await getFaresByRouteSlug(route.slug)
  return { route, fares }
}

export async function generateMetadata({ params }: { params: Promise<{ pageSlug: string }> }): Promise<Metadata> {
  const { pageSlug } = await params
  const data = await loadLanding(pageSlug)
  if (!data) return { title: 'Page not found' }
  const { route, fares } = data
  const title = route.seo?.metaTitle || `${route.displayName} | ${SITE.name}`
  const minPrice = fares[0]?.priceCents
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

function buildSchema(route: Route, pageSlug: string, fares: FareDTO[]) {
  const url = absoluteUrl(`/${pageSlug}`)
  const img = resolveMedia(route.seo?.ogImage) ?? resolveMedia(route.heroImage)
  const offers = fares.map((f) => ({
    '@type': 'Offer',
    name: f.label,
    price: (f.priceCents / 100).toFixed(2),
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

  const schemas: Record<string, unknown>[] = [product]

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
  const { route, fares } = data

  const hero = route.heroImage ? resolveMedia(route.heroImage) : null
  const defaultFare = fares[0] ?? null
  const minPrice = defaultFare?.priceCents
  const badge = route.hero?.badge || (route.isPremium ? 'Premium service' : 'Daily shuttle')
  const headline = route.hero?.headline || route.displayName
  const subheadline = route.hero?.subheadline || route.description || ''
  const rating = route.hero?.ratingValue ?? null

  return (
    <>
      <JsonLd schema={buildSchema(route, pageSlug, fares)} />
      <Navbar />

      <main className="main-content bg-mist-50">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[48vh] min-h-[360px] w-full bg-gradient-to-br from-evergreen-800 to-evergreen-950">
            {hero && <Image src={hero.url} alt={hero.alt || headline} fill priority sizes="100vw" className="object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-t from-evergreen-950/85 via-evergreen-950/40 to-transparent" />
          </div>
          <div className="mx-auto -mt-44 max-w-5xl px-4 sm:px-6">
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-elevated)] ring-1 ring-mist-200 sm:p-8">
              <nav className="mb-3 text-xs text-mist-500">
                <Link href="/" className="hover:text-evergreen-700">Home</Link> <span className="mx-1">/</span>
                <span className="text-mist-700">{route.displayName}</span>
              </nav>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sunrise-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sunrise-700">
                    {badge}
                  </p>
                  <h1 className="font-display text-3xl font-bold text-evergreen-800 sm:text-4xl">{headline}</h1>
                  {subheadline && <p className="mt-3 text-lg text-mist-700">{subheadline}</p>}
                  {rating != null && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <Stars value={rating} className="text-sunrise-500" />
                      <span className="font-bold text-mist-900">{rating.toFixed(1)}</span>
                      {route.hero?.ratingCount != null && <span className="text-mist-500">({route.hero.ratingCount} reviews)</span>}
                      {route.hero?.ratingSource && <span className="text-mist-400">· {route.hero.ratingSource}</span>}
                    </div>
                  )}
                </div>
                {defaultFare && (
                  <div className="shrink-0 text-right">
                    {minPrice != null && (
                      <>
                        <div className="text-xs uppercase tracking-wider text-mist-500">From</div>
                        <div className="font-display text-3xl font-bold text-evergreen-800">{formatCents(minPrice)}</div>
                        <div className="text-xs uppercase tracking-wider text-mist-500">per seat + 5% GST</div>
                      </>
                    )}
                    <div className="mt-3"><ServiceBookButton route={defaultFare.id} variant="gold">Book now</ServiceBookButton></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Fare options — bookable price variants for this experience */}
        {fares.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">Choose your trip</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {fares.map((f) => {
                const q = quote(f, 1, Date.now())
                return (
                  <div key={f.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
                    <h3 className="font-display text-base font-bold text-evergreen-800">{f.label}</h3>
                    <p className="mt-1 text-sm text-mist-500">{f.origin} → {f.destination}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-2xl font-bold text-mist-900">{formatCents(f.priceCents)}</span>
                      <span className="text-xs text-mist-500">/ seat</span>
                    </div>
                    <dl className="mt-2 space-y-1 text-xs text-mist-500">
                      <div className="flex justify-between"><dt>Departs</dt><dd className="tabular-nums text-mist-700">{f.defaultTime}</dd></div>
                      {f.tollCents > 0 && <div className="flex justify-between"><dt>Moraine toll</dt><dd className="tabular-nums text-mist-700">{formatCents(f.tollCents)}</dd></div>}
                      <div className="flex justify-between"><dt>Total / seat (incl. GST)</dt><dd className="tabular-nums font-semibold text-mist-900">{formatCents(q.totalCents)}</dd></div>
                    </dl>
                    <div className="mt-5"><ServiceBookButton route={f.id} variant="gold">Book this trip</ServiceBookButton></div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Admin-authored content blocks */}
        <BlockRenderer blocks={route.layout} fareId={defaultFare?.id ?? null} />
      </main>

      <Footer />
      <BookingModal />
    </>
  )
}
