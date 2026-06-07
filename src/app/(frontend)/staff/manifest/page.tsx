import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Where } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { edmontonTodayISO, edmontonDateToUTC } from '@/lib/edmonton'
import PrintButton from '@/components/PrintButton'
import type { Booking } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Departure Manifest',
  robots: { index: false, follow: false },
}

async function requireStaff() {
  const payload = await getPayloadClient()
  const { headers } = await import('next/headers')
  const h = await headers()
  const { user } = await payload.auth({ headers: h })
  const ok = user?.collection === 'users' && (user.roles?.includes('admin') || user.roles?.includes('operator'))
  if (!ok) redirect('/admin')
  return payload
}

export default async function ManifestPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; route?: string }>
}) {
  const payload = await requireStaff()
  const sp = await searchParams
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? '') ? sp.date! : edmontonTodayISO()

  const where: Where = {
    serviceDate: { equals: edmontonDateToUTC(date).toISOString() },
    status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
    ...(sp.route ? { routeSlug: { equals: sp.route } } : {}),
  }

  const { docs: bookings } = await payload.find({
    collection: 'bookings',
    where,
    sort: ['departureTime', 'reference'],
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  // Group by departure time.
  const groups = new Map<string, Booking[]>()
  for (const b of bookings) {
    const key = `${b.routeName ?? b.routeSlug ?? 'Route'} · ${b.departureTime ?? '—'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(b)
  }

  const totalSeats = bookings.reduce((n, b) => n + (b.seats ?? 1), 0)
  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(edmontonDateToUTC(date))

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <form className="flex items-end gap-3" method="get">
          <div>
            <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-mist-500">Service date</label>
            <input id="date" name="date" type="date" defaultValue={date} className="mt-1 rounded-lg border border-mist-200 bg-white px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-mist-100 px-4 py-2 text-sm font-semibold text-evergreen-800 ring-1 ring-mist-200">Load</button>
        </form>
        <PrintButton />
      </div>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-evergreen-800">Departure Manifest</h1>
        <p className="text-mist-700">{fmtDate} · {bookings.length} bookings · {totalSeats} seats</p>
      </header>

      {groups.size === 0 ? (
        <p className="rounded-xl border border-dashed border-mist-200 bg-mist-50 p-6 text-sm text-mist-500">No bookings for this date.</p>
      ) : (
        [...groups.entries()].map(([key, rows]) => {
          const seats = rows.reduce((n, b) => n + (b.seats ?? 1), 0)
          return (
            <section key={key} className="mb-8 break-inside-avoid">
              <h2 className="mb-2 border-b border-mist-200 pb-1 font-display text-lg font-bold text-mist-900">
                {key} <span className="font-sans text-sm font-normal text-mist-500">— {rows.length} bookings, {seats} seats</span>
              </h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-mist-500">
                  <tr>
                    <th className="py-2">Passenger</th>
                    <th className="py-2">Seats</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-200">
                  {rows.map((b) => (
                    <tr key={b.reference}>
                      <td className="py-2 font-medium text-mist-900">{[b.guestFirstName, b.guestLastName].filter(Boolean).join(' ') || '—'}</td>
                      <td className="py-2 tabular-nums">{b.seats ?? 1}</td>
                      <td className="py-2">{b.guestPhone ?? '—'}</td>
                      <td className="py-2">{b.status === 'CONFIRMED' ? '✅ Confirmed' : '⏳ Pending'}</td>
                      <td className="py-2 font-mono text-xs text-mist-500">{b.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })
      )}
    </main>
  )
}
