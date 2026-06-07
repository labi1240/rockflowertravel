import Image from 'next/image'
import Link from 'next/link'
import { formatCents } from '@/lib/fares'
import type { LandingCard } from '@/lib/fares-db'

/** "You might also like" — cards linking to other published landing pages. */
export default function RelatedRoutes({ cards }: { cards: LandingCard[] }) {
  if (cards.length === 0) return null
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">You might also like</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 3).map((c) => (
            <Link
              key={c.seoSlug}
              href={`/${c.seoSlug}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 transition hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-evergreen-700 to-evergreen-950">
                {c.imageUrl && (
                  <Image src={c.imageUrl} alt={c.displayName} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
                {c.isPremium && (
                  <span className="absolute left-3 top-3 rounded-full bg-sunrise-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-evergreen-950">Premium</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-bold text-evergreen-800 group-hover:text-evergreen-900">{c.displayName}</h3>
                <div className="mt-auto pt-3 text-sm text-mist-500">
                  {c.minPriceCents != null ? (
                    <>From <span className="font-bold text-mist-900">{formatCents(c.minPriceCents)}</span></>
                  ) : (
                    'View details'
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
