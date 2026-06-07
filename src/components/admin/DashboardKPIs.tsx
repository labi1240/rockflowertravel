import { getPayloadClient } from '@/lib/payload'
import { edmontonTodayUTC, edmontonTodayISO } from '@/lib/edmonton'
import type { Booking } from '@/payload-types'

/**
 * KPI tiles injected above the Payload admin dashboard (admin.components.beforeDashboard).
 * Shows today's (America/Edmonton) bookings, revenue, seats, and a manifest shortcut.
 */
export async function DashboardKPIs() {
  let bookings: Booking[] = []
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'bookings',
      where: { serviceDate: { equals: edmontonTodayUTC().toISOString() } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    bookings = res.docs
  } catch {
    bookings = []
  }

  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED')
  const revenue = confirmed.reduce((n, b) => n + (b.totalCents ?? 0), 0)
  const seats = confirmed.reduce((n, b) => n + (b.seats ?? 1), 0)
  const fmt = (c: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(c / 100)

  const tiles = [
    { label: 'Bookings today', value: String(bookings.length) },
    { label: 'Confirmed today', value: String(confirmed.length) },
    { label: 'Revenue today', value: fmt(revenue) },
    { label: 'Seats sold today', value: String(seats) },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-elevation-500)', margin: '0 0 12px' }}>
        Today — {edmontonTodayISO()} (Mountain Time)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: '14px 16px', background: 'var(--theme-elevation-50)' }}>
            <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{t.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--theme-elevation-800)', marginTop: 4 }}>{t.value}</div>
          </div>
        ))}
      </div>
      <a href="/staff/manifest" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--theme-success-500)' }}>
        → Open today&apos;s departure manifest
      </a>
    </div>
  )
}
