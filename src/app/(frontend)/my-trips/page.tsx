import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingModal from '@/components/BookingModal'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentCustomer } from '@/lib/customer-auth'
import { edmontonTodayISO } from '@/lib/edmonton'
import type { Booking } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Trips',
  robots: { index: false, follow: false },
}

const ROUTE_TONE: Record<string, string> = {
  SUNRISE_EXPRESS: 'bg-sunrise-100 text-sunrise-700 ring-sunrise-500/30',
  DAYTIME_CIRCUIT: 'bg-evergreen-100 text-evergreen-800 ring-evergreen-500/20',
  EVENING_RETURN: 'bg-mist-100 text-mist-700 ring-mist-200',
}

const STATUS_DISPLAY: Record<string, { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: 'Pending payment', tone: 'bg-amber-100 text-amber-800 ring-amber-500/30' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-emerald-100 text-emerald-800 ring-emerald-500/30' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-mist-100 text-mist-500 ring-mist-200' },
  REFUNDED: { label: 'Refunded', tone: 'bg-mist-100 text-mist-500 ring-mist-200' },
  EXPIRED: { label: 'Expired', tone: 'bg-mist-100 text-mist-500 ring-mist-200' },
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Edmonton',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

const formatDate = (iso?: string | null) => (iso ? DATE_FORMATTER.format(new Date(iso)) : 'Date unavailable')

export default async function MyTripsPage() {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/sign-in?redirect=/my-trips')

  const payload = await getPayloadClient()
  const { docs: bookings } = await payload.find({
    collection: 'bookings',
    where: { customer: { equals: customer.id } },
    sort: ['-serviceDate', '-createdAt'],
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  const todayISO = edmontonTodayISO()
  const isUpcoming = (b: Booking) =>
    !!b.serviceDate &&
    String(b.serviceDate).slice(0, 10) >= todayISO &&
    (b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT')

  const upcoming = bookings.filter(isUpcoming)
  const past = bookings.filter((b) => !isUpcoming(b))

  return (
    <>
      <Navbar />
      <main className="main-content min-h-screen bg-mist-50">
        <section className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
          <header className="mb-8 sm:mb-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sunrise-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sunrise-700">
              <span className="size-1.5 rounded-full bg-sunrise-500" /> My trips
            </p>
            <h1 className="font-display text-3xl font-bold text-evergreen-800 sm:text-4xl lg:text-5xl">
              Welcome back{customer.firstName ? `, ${customer.firstName}` : ''}
            </h1>
            <p className="mt-3 text-mist-700">All your RockFlower shuttle bookings in one place.</p>
          </header>

          {bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-12">
              <BookingList title="Upcoming" emptyHint="No upcoming rides booked." bookings={upcoming} />
              <BookingList title="Past & cancelled" emptyHint="Nothing in your history yet." bookings={past} muted />
            </div>
          )}
        </section>
      </main>
      <Footer />
      <BookingModal />
    </>
  )
}

function BookingList({
  title,
  emptyHint,
  bookings,
  muted = false,
}: {
  title: string
  emptyHint: string
  bookings: Booking[]
  muted?: boolean
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-evergreen-700">
        {title} <span className="ml-1 text-mist-500">({bookings.length})</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-mist-200 bg-mist-100 p-6 text-sm text-mist-500">{emptyHint}</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const status = STATUS_DISPLAY[b.status] ?? STATUS_DISPLAY.PENDING_PAYMENT
            const routeTone = b.routeKind ? ROUTE_TONE[b.routeKind] : undefined
            return (
              <li key={b.reference}>
                <Link
                  href={`/my-trips/${b.reference}`}
                  className={`group flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:border-sunrise-500/40 hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center sm:justify-between ${muted ? 'opacity-80' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {(b.routeName || b.routeKind) && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${routeTone ?? 'bg-evergreen-100 text-evergreen-800 ring-evergreen-500/20'}`}>
                          {b.routeName ?? b.routeKind}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.tone}`}>{status.label}</span>
                    </div>
                    <p className="font-display text-lg font-semibold text-mist-900">
                      {formatDate(b.serviceDate)}
                      {b.departureTime && <span className="ml-2 font-normal text-mist-500">· {b.departureTime}</span>}
                    </p>
                    <p className="mt-1 font-mono text-xs text-mist-500">{b.reference}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-display text-xl font-bold tabular-nums text-mist-900">{formatCAD(b.totalCents)}</p>
                    <span className="text-xs text-mist-500 transition-colors group-hover:text-sunrise-700">View details →</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-mist-200 bg-white p-6 text-center shadow-[var(--shadow-card)] sm:p-12">
      <p className="font-display text-2xl font-semibold text-mist-900">No bookings yet</p>
      <p className="mt-2 text-mist-700">Once you book a shuttle, it&apos;ll show up here.</p>
      <Link
        href="/#schedule"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sunrise-400 to-sunrise-500 px-6 py-2.5 text-sm font-bold text-evergreen-950 shadow-[0_0_15px_hsla(41,80%,58%,0.3)] transition-all hover:scale-105"
      >
        Browse schedules
      </Link>
    </div>
  )
}
