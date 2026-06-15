import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BookingModal from '@/components/BookingModal'
import TripQR from '@/components/TripQR'
import MessageThread from '@/components/MessageThread'
import CancelBookingButton from '@/components/CancelBookingButton'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentCustomer } from '@/lib/customer-auth'
import { absoluteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trip details',
  robots: { index: false, follow: false },
}

const ROUTE_TAGLINE: Record<string, string> = {
  SUNRISE_EXPRESS: 'Premium 4:30 AM Banff → Moraine Lake',
  DAYTIME_CIRCUIT: 'Samson Mall ↔ Lake Louise ↔ Moraine',
  EVENING_RETURN: 'Lake Louise Lakeshore → Banff',
}

const STATUS_DISPLAY: Record<string, { label: string; tone: string; description: string }> = {
  PENDING_PAYMENT: { label: 'Pending payment', tone: 'bg-amber-100 text-amber-800 ring-amber-500/30', description: 'Your seat is held for 15 minutes. Complete payment to confirm.' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-emerald-100 text-emerald-800 ring-emerald-500/30', description: 'Your seat is reserved. See you at the pickup.' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-mist-100 text-mist-500 ring-mist-200', description: 'This booking was cancelled.' },
  REFUNDED: { label: 'Refunded', tone: 'bg-mist-100 text-mist-500 ring-mist-200', description: 'This booking was refunded.' },
  EXPIRED: { label: 'Expired', tone: 'bg-mist-100 text-mist-500 ring-mist-200', description: 'The payment hold expired before checkout completed.' },
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Edmonton',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)

export default async function BookingDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const customer = await getCurrentCustomer()
  const { reference } = await params
  if (!customer) redirect(`/sign-in?redirect=/my-trips/${reference}`)

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const booking = docs[0]
  if (!booking) notFound()

  // Ownership: the linked customer, or a guest booking made with this customer's email.
  const ownerId = typeof booking.customer === 'object' && booking.customer ? booking.customer.id : booking.customer
  const owns = ownerId === customer.id || (booking.guestEmail && booking.guestEmail === customer.email)
  if (!owns) notFound()

  const { docs: payments } = await payload.find({
    collection: 'payments',
    where: { booking: { equals: booking.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const payment = payments[0]

  // Support thread for this booking. Mark any unread staff replies as read now that
  // the customer is viewing them, then load the (now up-to-date) conversation.
  await payload.update({
    collection: 'messages',
    where: {
      booking: { equals: booking.id },
      sender: { equals: 'staff' },
      readByCustomerAt: { equals: null },
    },
    data: { readByCustomerAt: new Date().toISOString() },
    overrideAccess: true,
  }).catch(() => {})

  const { docs: messages } = await payload.find({
    collection: 'messages',
    where: { booking: { equals: booking.id } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  const statusInfo = STATUS_DISPLAY[booking.status] ?? STATUS_DISPLAY.PENDING_PAYMENT
  const tagline = booking.routeKind ? ROUTE_TAGLINE[booking.routeKind] : undefined
  const routeTitle = booking.routeName ?? 'Shuttle booking'
  const fullName = [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(' ')

  return (
    <>
      <Navbar />
      <main className="main-content min-h-screen bg-mist-50">
        <section className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
          <Link href="/my-trips" className="mb-6 inline-flex items-center gap-2 text-sm text-mist-500 transition-colors hover:text-mist-900 sm:mb-8">
            ← Back to my trips
          </Link>

          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusInfo.tone}`}>{statusInfo.label}</span>
              <span className="font-mono text-xs text-mist-500">{booking.reference}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-evergreen-800 sm:text-3xl lg:text-4xl">{routeTitle}</h1>
            {tagline && <p className="mt-1 text-mist-700">{tagline}</p>}
            <p className="mt-3 text-sm text-mist-700">{statusInfo.description}</p>
          </header>

          <div className="space-y-6">
            {booking.status === 'CONFIRMED' && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-mist-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-evergreen-700">Boarding pass</h2>
                <TripQR url={absoluteUrl(`/my-trips/${booking.reference}`)} />
              </div>
            )}

            <Panel title="Trip details">
              <Row label="Date">{booking.serviceDate ? DATE_FORMATTER.format(new Date(booking.serviceDate)) : 'Not set'}</Row>
              <Row label="Departure">{booking.departureTime ?? 'Not set'}</Row>
              <Row label="Seats">{booking.seats ?? 1}</Row>
            </Panel>

            <Panel title="Contact">
              <Row label="Name">{fullName || '—'}</Row>
              <Row label="Email">{booking.guestEmail ?? '—'}</Row>
              <Row label="Phone">{booking.guestPhone ?? '—'}</Row>
            </Panel>

            <Panel title="Receipt">
              <Row label="Subtotal" mono>{formatCAD(booking.subtotalCents)}</Row>
              <Row label="GST (5%)" mono>{formatCAD(booking.gstCents)}</Row>
              <Row label="Total" mono emphasize>{formatCAD(booking.totalCents)} {booking.currency}</Row>
              {payment?.stripePaymentIntentId && (
                <Row label="Payment ref" mono subtle>{payment.stripePaymentIntentId}</Row>
              )}
            </Panel>

            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT') && (
              <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-evergreen-700">Need to cancel?</h2>
                <p className="mb-4 text-sm text-mist-700">
                  Free cancellation up to 24h before departure. Send a request and our team will review and process your refund.
                </p>
                <CancelBookingButton reference={booking.reference} requested={Boolean(booking.cancellationRequestedAt)} />
              </div>
            )}

            <MessageThread
              bookingId={booking.id}
              initialMessages={messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt }))}
            />

            <p className="text-xs text-mist-500">
              Prefer email? Reach us at{' '}
              <a href="mailto:hello@rockflowertravels.ca" className="text-evergreen-700 underline underline-offset-2 hover:text-evergreen-800">hello@rockflowertravels.ca</a>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <BookingModal />
    </>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-evergreen-700">{title}</h2>
      <dl className="divide-y divide-mist-200">{children}</dl>
    </div>
  )
}

function Row({
  label,
  children,
  mono = false,
  emphasize = false,
  subtle = false,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
  emphasize?: boolean
  subtle?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-mist-500">{label}</dt>
      <dd className={`min-w-0 sm:text-right ${mono ? 'tabular-nums' : ''} ${emphasize ? 'font-display text-lg font-bold text-mist-900' : subtle ? 'break-all font-mono text-xs text-mist-500' : 'text-mist-900'}`}>
        {children}
      </dd>
    </div>
  )
}
