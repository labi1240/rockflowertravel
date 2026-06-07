'use client'

import { useEffect, useState } from 'react'
import { useBookingModal, type BookingRouteId } from '@/store/booking-modal'

/**
 * Slim sticky CTA that slides up from the bottom once the user scrolls past the
 * hero — keeps "Book now" reachable on long marketing pages (mobile especially).
 */
export default function StickyBookBar({
  fareId,
  priceLabel,
  title,
}: {
  fareId: BookingRouteId
  priceLabel: string
  title: string
}) {
  const open = useBookingModal((s) => s.open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-mist-200 bg-white/95 backdrop-blur transition-transform duration-300 ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-mist-900">{title}</p>
          <p className="text-xs text-mist-500">From {priceLabel} · per seat + GST</p>
        </div>
        <button
          type="button"
          onClick={() => open(fareId)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sunrise-500 px-5 py-2.5 text-sm font-bold text-evergreen-950 transition hover:bg-sunrise-400"
        >
          Book now <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
