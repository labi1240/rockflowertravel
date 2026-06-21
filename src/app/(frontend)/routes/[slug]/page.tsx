import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingModal from '@/components/BookingModal'
import ServiceBookButton from '@/components/ServiceBookButton'
import JsonLd from '@/components/JsonLd'
import { getPayloadClient } from '@/lib/payload'
import { getFareBySlug } from '@/lib/fares-db'
import { quote, formatCents, type FareDTO, isSaleActive } from '@/lib/fares'
import { SITE, absoluteUrl } from '@/lib/seo'
import { requestNowMs } from '@/lib/utils'
import type { Route, ScheduleTemplate, Stop } from '@/payload-types'

export const dynamic = 'force-dynamic'

const minToTime = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

const stopName = (s: number | Stop | null | undefined) =>
  s && typeof s === 'object' ? s.name : '—'

async function loadRouteData(slug: string) {
  const fare = await getFareBySlug(slug)
  if (!fare || !fare.active) return null
  const payload = await getPayloadClient()

  let route: Route | null = null
  let templates: ScheduleTemplate[] = []
  if (fare.routeSlug) {
    const r = await payload.find({ collection: 'routes', where: { slug: { equals: fare.routeSlug } }, limit: 1, depth: 1, overrideAccess: true })
    route = r.docs[0] ?? null
    if (route) {
      const t = await payload.find({ collection: 'schedule-templates', where: { route: { equals: route.id } }, sort: 'sortOrder', depth: 1, limit: 20, overrideAccess: true })
      templates = t.docs
    }
  }
  return { fare, route, templates }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await loadRouteData(slug)
  if (!data) return { title: 'Route not found' }
  const { fare } = data
  const title = `${fare.label} Shuttle`
  const description = `Book the ${fare.origin} → ${fare.destination} shuttle with RockFlower Travels. ${formatCents(fare.priceCents)} per seat${fare.tollCents > 0 ? ` + ${formatCents(fare.tollCents)} toll` : ''}, departs ${fare.defaultTime}. Comfortable mountain transit in the Canadian Rockies.`
  return {
    title,
    description,
    alternates: { canonical: `/routes/${slug}` },
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url: absoluteUrl(`/routes/${slug}`),
      type: 'website',
      ...(fare.imageUrl ? { images: [{ url: absoluteUrl(fare.imageUrl) }] } : {}),
    },
  }
}

function productSchema(fare: FareDTO, nowMs: number) {
  const price = fare.salePriceCents != null && isSaleActive(fare, nowMs) ? fare.salePriceCents : fare.priceCents
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${fare.label} Shuttle`,
    description: `${fare.origin} to ${fare.destination} shuttle service.`,
    ...(fare.imageUrl ? { image: absoluteUrl(fare.imageUrl) } : {}),
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      price: (price / 100).toFixed(2),
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/routes/${fare.id}`),
    },
  }
}

export default async function RouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await loadRouteData(slug)
  if (!data) notFound()
  const { fare, route, templates } = data

  // The rich, admin-authored landing page at /{seoSlug} is now the canonical
  // dedicated page — send legacy fare URLs there (301) when one is published.
  if (route?.seoSlug && route._status === 'published') {
    permanentRedirect(`/${route.seoSlug}`)
  }

  const q = quote(fare, 1, requestNowMs())
  const bookableLegs = templates.flatMap((t) =>
    (t.legs ?? []).filter((l) => l.bookable).map((l) => ({ template: t.label, ...l })),
  )

  const highlights = [
    `Departs ${fare.defaultTime} from ${fare.origin}`,
    fare.premium ? 'Premium, isolated service — runs apart from standard loops' : 'Comfortable, on-time mountain transit',
    fare.roundTrip ? 'Round trip — one ticket covers there and back' : `Direct to ${fare.destination}`,
    fare.tollCents > 0 ? `Includes Moraine Lake access (+${formatCents(fare.tollCents)} toll per guest)` : 'Reserved coach seating',
  ]

  return (
    <>
      <JsonLd schema={productSchema(fare, requestNowMs())} />
      <Navbar />

      <main className="main-content bg-mist-50">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[42vh] min-h-[320px] w-full bg-gradient-to-br from-evergreen-800 to-evergreen-950">
            {fare.imageUrl && (
              <Image src={fare.imageUrl} alt={fare.label} fill priority sizes="100vw" className="object-cover opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-evergreen-950/80 via-evergreen-950/30 to-transparent" />
          </div>
          <div className="mx-auto -mt-28 max-w-5xl px-4 sm:px-6">
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-elevated)] ring-1 ring-mist-200 sm:p-8">
              <nav className="mb-3 text-xs text-mist-500">
                <Link href="/" className="hover:text-evergreen-700">Home</Link> <span className="mx-1">/</span>
                <Link href="/#routes" className="hover:text-evergreen-700">Routes</Link> <span className="mx-1">/</span>
                <span className="text-mist-700">{fare.label}</span>
              </nav>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sunrise-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sunrise-700">
                    {fare.premium ? 'Premium service' : 'Daily shuttle'}
                  </p>
                  <h1 className="font-display text-3xl font-bold text-evergreen-800 sm:text-4xl">{fare.label}</h1>
                  <p className="mt-2 text-lg text-mist-700">{fare.origin} → {fare.destination}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="font-display text-3xl font-bold text-evergreen-800">{formatCents(q.unitPriceCents)}</span>
                    {q.onSale && (
                      <span className="text-sm text-mist-400 line-through tabular-nums">{formatCents(q.originalUnitPriceCents)}</span>
                    )}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-mist-500">per seat + 5% GST</div>
                  <div className="mt-3"><ServiceBookButton route={fare.id} variant="gold">Book now</ServiceBookButton></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              {/* Overview */}
              <section>
                <h2 className="font-display text-2xl font-bold text-evergreen-800">About this route</h2>
                <p className="mt-3 text-mist-700">
                  {route?.description ||
                    `Travel from ${fare.origin} to ${fare.destination} aboard a comfortable RockFlower coach. Skip the parking stress and let our local drivers handle the mountain roads while you take in the Canadian Rockies.`}
                </p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-mist-800">
                      <span className="mt-0.5 text-evergreen-600">✓</span> {h}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Schedule */}
              {bookableLegs.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-bold text-evergreen-800">Schedule</h2>
                  <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-mist-200">
                    <table className="w-full text-sm">
                      <thead className="bg-mist-100 text-left text-xs uppercase tracking-wider text-mist-500">
                        <tr>
                          <th className="px-4 py-3">Departure</th>
                          <th className="px-4 py-3">From</th>
                          <th className="px-4 py-3">To</th>
                          <th className="px-4 py-3">Depart</th>
                          <th className="px-4 py-3">Arrive</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mist-200 bg-white">
                        {bookableLegs.map((l, i) => (
                          <tr key={`${l.template}-${i}`}>
                            <td className="px-4 py-3 text-mist-700">{l.template}</td>
                            <td className="px-4 py-3 font-medium text-mist-900">{stopName(l.fromStop)}</td>
                            <td className="px-4 py-3 font-medium text-mist-900">{stopName(l.toStop)}</td>
                            <td className="px-4 py-3 tabular-nums">{minToTime(l.departMin)}</td>
                            <td className="px-4 py-3 tabular-nums text-mist-500">{minToTime(l.arriveMin)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-mist-500">Please arrive 10 minutes early; buses depart on time.</p>
                </section>
              )}
            </div>

            {/* Sticky booking card */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200">
                <h3 className="font-display text-lg font-bold text-mist-900">Fare breakdown</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-mist-500">Base fare</dt>
                    <dd className="tabular-nums">
                      {q.onSale ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-mist-400 line-through">{formatCents(q.originalUnitPriceCents)}</span>
                          <span>{formatCents(q.unitPriceCents)}</span>
                        </span>
                      ) : (
                        formatCents(q.unitPriceCents)
                      )}
                    </dd>
                  </div>
                  {fare.tollCents > 0 && <div className="flex justify-between"><dt className="text-mist-500">Moraine toll</dt><dd className="tabular-nums">{formatCents(fare.tollCents)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-mist-500">GST (5%)</dt><dd className="tabular-nums">{formatCents(q.gstCents)}</dd></div>
                  <div className="flex justify-between border-t border-mist-200 pt-2 font-display text-base font-bold text-mist-900"><dt>Total / seat</dt><dd className="tabular-nums">{formatCents(q.totalCents)}</dd></div>
                </dl>
                <div className="mt-5"><ServiceBookButton route={fare.id} variant="gold">Book this route</ServiceBookButton></div>
                <p className="mt-3 text-xs text-mist-500">Free 15-minute seat hold during checkout. Pay securely with Stripe.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <BookingModal />
    </>
  )
}
