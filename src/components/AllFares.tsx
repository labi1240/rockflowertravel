import Image from 'next/image'
import Link from 'next/link'
import { getActiveFares } from '@/lib/fares-db'
import { isSaleActive, formatCents, type FareDTO } from '@/lib/fares'
import ServiceBookButton from '@/components/ServiceBookButton'
import { requestNowMs } from '@/lib/utils'

const TIER_LABEL: Record<string, string> = {
  sunrise: 'Sunrise',
  daytime: 'Daytime',
  evening: 'Evening',
}

/**
 * Data-driven catalog: renders EVERY active fare as a bookable product card.
 * Any route/fare authored in the admin shows up here automatically — no code change.
 * This is the surface that makes admin-created routes (e.g. Canmore Express) visible.
 */
export default async function AllFares() {
  let fares: FareDTO[] = []
  try {
    fares = await getActiveFares()
  } catch {
    fares = []
  }
  if (fares.length === 0) return null

  const nowMs = requestNowMs()

  return (
    <section id="routes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="mb-8 text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-evergreen-700/20 bg-evergreen-700/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-evergreen-700">
          <span className="size-1.5 rounded-full bg-sunrise-500" /> Every route we run
        </p>
        <h2 className="font-display text-3xl font-bold text-evergreen-800 sm:text-4xl">All routes &amp; fares</h2>
        <p className="mt-2 text-mist-700">Pick any route below — prices include all options; GST added at checkout.</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {fares.map((fare) => {
          const onSale = fare.salePriceCents != null && isSaleActive(fare, nowMs)
          const price = onSale ? (fare.salePriceCents as number) : fare.priceCents
          return (
            <div
              key={fare.id}
              className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 transition-all hover:shadow-[var(--shadow-card-hover)] ${
                fare.premium ? 'ring-sunrise-300' : 'ring-mist-200'
              }`}
            >
              <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-evergreen-700 to-evergreen-900">
                {fare.imageUrl && (
                  <Image
                    src={fare.imageUrl}
                    alt={fare.label}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-evergreen-700/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-evergreen-700 ring-1 ring-evergreen-700/15">
                  {TIER_LABEL[fare.tier] ?? fare.tier}
                </span>
                {fare.premium && (
                  <span className="inline-flex items-center rounded-full bg-sunrise-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sunrise-800 ring-1 ring-sunrise-300">
                    Premium
                  </span>
                )}
                {onSale && (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700 ring-1 ring-rose-300">
                    Sale
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-bold text-mist-900">{fare.label}</h3>
              <p className="mt-1 text-sm text-mist-600">
                {fare.origin} → {fare.destination}
                {fare.roundTrip ? ' · round trip' : ''}
              </p>
              {fare.note && <p className="mt-2 text-xs text-mist-500">{fare.note}</p>}

              <div className="mt-4 flex items-end justify-between gap-3 pt-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold tabular-nums text-evergreen-800">{formatCents(price)}</span>
                    {onSale && <span className="text-sm text-mist-400 line-through tabular-nums">{formatCents(fare.priceCents)}</span>}
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-mist-500">
                    per seat{fare.tollCents > 0 ? ` · +${formatCents(fare.tollCents)} toll` : ''}
                  </span>
                </div>
                <ServiceBookButton route={fare.id} variant={fare.premium ? 'gold' : 'primary'}>
                  Book
                </ServiceBookButton>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-mist-400">Departs {fare.defaultTime}</p>
                <Link href={`/routes/${fare.id}`} className="text-xs font-semibold text-evergreen-700 underline-offset-2 hover:underline">
                  More details →
                </Link>
              </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
