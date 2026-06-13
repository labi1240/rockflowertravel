// ─────────────────────────────────────────────────────────────────────────────
//  ServiceCards — photo-backed top-of-funnel orientation
//
//  Each service is paired with its most iconic destination photo from
//  /public/images/locations/. To swap a photo, just drop a new file at the
//  same path and rename it (or update the `image` field below).
//  Orphaned SVG placeholders remain at /public/images/routes/ — safe to delete.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { ShieldCheck, RotateCcw } from 'lucide-react'
import type { BookingRouteId } from '@/store/booking-modal'
import type { FareTier } from '@/lib/fares'
import { useFares } from '@/components/FaresProvider'
import ServiceBookButton from '@/components/ServiceBookButton'

// Static marketing copy per tier. The fare `id` and "from" price come from the
// DB-backed catalog at render time (see useFares below). The dollar amounts in
// `highlights` are editorial prose — kept static; live prices flow via priceFromCents.
type ServiceMeta = {
  tier: FareTier
  name: string
  eyebrow: string
  window: string
  description: string
  image: string
  highlights: string[]
}

type Service = ServiceMeta & {
  id: BookingRouteId
  priceFromCents: number
}

const SERVICE_META: ServiceMeta[] = [
  {
    tier: 'sunrise',
    name: 'Sunrise Express',
    eyebrow: 'Premium · isolated inventory',
    window: '4:30 AM departure',
    description:
      'Premium early departure from Banff direct to Moraine Lake. Reach the lake for first light, ahead of the crowds.',
    image: '/images/locations/moraine-lake-ten-peaks.jpg',
    highlights: ['Banff → Moraine Lake $99.98', 'Direct premium service', 'Premium coach'],
  },
  {
    tier: 'daytime',
    name: 'Daytime',
    eyebrow: 'Most popular',
    window: '7:00 AM – 5:20 PM',
    description:
      'Daytime service circuit: Samson Mall → Lake Louise Lakeshore → Moraine Lake → Samson Mall.',
    image: '/images/locations/lake-louise-lakeshore.webp',
    highlights: [
      'Samson Mall → Lake Louise $65.99',
      'Lake Louise → Moraine $89.99',
      'Moraine → Samson Mall $65.99',
    ],
  },
  {
    tier: 'evening',
    name: 'Evening Return',
    eyebrow: 'End-of-day transfer',
    window: '6:00 PM departure',
    description:
      'Single late-day departure back to Banff after an afternoon at Lake Louise. Reservations recommended.',
    image: '/images/locations/banff.jpg',
    highlights: ['Lake Louise → Banff $65.99', 'Arrive 7:15 PM', 'Reserved seating'],
  },
]

export default function ServiceCards() {
  const { tierDefault, tierFrom } = useFares()

  const services: Service[] = SERVICE_META.flatMap((m) => {
    const id = tierDefault[m.tier]
    if (!id) return []
    return [{ ...m, id, priceFromCents: tierFrom[m.tier] }]
  })

  return (
    <ul className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </ul>
  )
}

function ServiceCard({ service: s }: { service: Service }) {
  const dollars = Math.floor(s.priceFromCents / 100)
  const cents = (s.priceFromCents % 100).toString().padStart(2, '0')
  const isPremium = s.tier === 'sunrise'

  return (
    <motion.li
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 transition-[box-shadow] hover:shadow-[var(--shadow-card-hover)] ${isPremium ? 'ring-sunrise-300' : 'ring-mist-200'}`}
    >
      {/* Photo */}
      <div className="relative aspect-16/10 overflow-hidden bg-evergreen-900">
        <Image
          src={s.image}
          alt={`${s.name} — ${s.description}`}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/25 backdrop-blur">
            {s.eyebrow}
          </span>
          <p className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tighter text-white">
            {s.name}
          </p>
          <p className="text-xs font-semibold tabular-nums text-white/80">{s.window}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm leading-relaxed text-mist-700">{s.description}</p>

        <ul className="space-y-1.5">
          {s.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-xs text-mist-700">
              <span
                aria-hidden
                className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-sunrise-500"
              />
              {h}
            </li>
          ))}
        </ul>

        {/* Price + CTAs */}
        <div className="mt-auto border-t border-mist-200 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">
                From
              </p>
              <p className="font-display text-2xl font-extrabold tracking-tighter tabular-nums text-mist-900">
                ${dollars}
                <span className="text-base">.{cents}</span>
                <span className="ml-1 text-xs font-semibold text-mist-500">CAD</span>
              </p>
            </div>
            <ServiceBookButton route={s.id} variant={isPremium ? 'gold' : 'primary'}>
              Book
            </ServiceBookButton>
          </div>
          <div className="mt-3.5 flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.15em] text-mist-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Secure Checkout
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" /> 24h Free Cancel
            </span>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
