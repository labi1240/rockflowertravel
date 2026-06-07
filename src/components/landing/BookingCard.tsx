import ServiceBookButton from '@/components/ServiceBookButton'
import { quote, formatCents, type FareDTO } from '@/lib/fares'

/**
 * Sticky booking card for the landing intro row. Lists every active fare on the
 * route as a selectable price option, each wired to the booking modal. The
 * cheapest fare is highlighted as the default.
 */
export default function BookingCard({ fares, nowMs }: { fares: FareDTO[]; nowMs: number }) {
  if (fares.length === 0) return null
  const min = fares[0]

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-elevated)] ring-1 ring-mist-200 sm:p-6">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-mist-500">From</span>
        <span className="font-display text-3xl font-bold text-evergreen-800">{formatCents(min.priceCents)}</span>
      </div>
      <p className="mt-0.5 text-right text-xs text-mist-500">per seat + 5% GST</p>

      <div className="mt-5 space-y-3">
        {fares.map((f) => {
          const q = quote(f, 1, nowMs)
          return (
            <div key={f.id} className="rounded-xl border border-mist-200 p-3.5 transition hover:border-evergreen-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-mist-900">{f.label}</p>
                  <p className="mt-0.5 text-xs text-mist-500">Departs {f.defaultTime}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-base font-bold text-mist-900">{formatCents(f.priceCents)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-mist-400">{formatCents(q.totalCents)} total</div>
                </div>
              </div>
              <div className="mt-3">
                <ServiceBookButton route={f.id} variant="gold">Book this trip</ServiceBookButton>
              </div>
            </div>
          )
        })}
      </div>

      <ul className="mt-5 space-y-2 border-t border-mist-200 pt-4 text-xs text-mist-600">
        <li className="flex items-center gap-2"><Check /> Free changes up to 24h before departure</li>
        <li className="flex items-center gap-2"><Check /> Reserved seat — no waiting in line</li>
        <li className="flex items-center gap-2"><Check /> Secure checkout with Stripe</li>
      </ul>
    </div>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-evergreen-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8 3.5 3.5L13 4" />
    </svg>
  )
}
