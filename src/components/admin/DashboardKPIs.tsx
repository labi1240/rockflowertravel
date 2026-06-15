import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { edmontonTodayUTC, edmontonTodayISO } from '@/lib/edmonton'
import type { Booking } from '@/payload-types'

interface Totals {
  count: number
  revenueCents: number
  seats: number
}

const ZERO: Totals = { count: 0, revenueCents: 0, seats: 0 }

/**
 * KPI tiles injected above the Payload admin dashboard (admin.components.beforeDashboard).
 * Two rows: today's *departures* (ops/manifest view), and confirmed-booking *totals*
 * (this month + all time) so revenue is always visible regardless of departure date.
 */
export async function DashboardKPIs() {
  let bookings: Booking[] = []
  let monthTotals: Totals = ZERO
  let allTimeTotals: Totals = ZERO

  try {
    const payload = await getPayloadClient()

    // Today's departures (serviceDate === today, Mountain time).
    const res = await payload.find({
      collection: 'bookings',
      where: { serviceDate: { equals: edmontonTodayUTC().toISOString() } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    bookings = res.docs

    // Confirmed-revenue aggregates via the raw pool — efficient, no row scan in JS.
    const pool = (payload.db as unknown as { pool: { query: (t: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> } }).pool
    const agg = `select count(*)::int n, coalesce(sum(total_cents),0)::int cents, coalesce(sum(seats),0)::int seats from bookings where status = 'CONFIRMED'`
    const monthStartISO = `${edmontonTodayISO().slice(0, 7)}-01T00:00:00.000-07:00` // 1st of this month, Mountain

    const [allRes, monthRes] = await Promise.all([
      pool.query(agg),
      pool.query(`${agg} and created_at >= $1`, [monthStartISO]),
    ])
    const toTotals = (r: Record<string, unknown>): Totals => ({
      count: Number(r.n),
      revenueCents: Number(r.cents),
      seats: Number(r.seats),
    })
    allTimeTotals = allRes.rows[0] ? toTotals(allRes.rows[0]) : ZERO
    monthTotals = monthRes.rows[0] ? toTotals(monthRes.rows[0]) : ZERO
  } catch {
    bookings = []
  }

  const confirmedToday = bookings.filter((b) => b.status === 'CONFIRMED')
  const revenueToday = confirmedToday.reduce((n, b) => n + (b.totalCents ?? 0), 0)
  const seatsToday = confirmedToday.reduce((n, b) => n + (b.seats ?? 1), 0)
  const fmt = (c: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(c / 100)

  const todayTiles = [
    { label: 'Departures today', value: String(bookings.length) },
    { label: 'Confirmed today', value: String(confirmedToday.length) },
    { label: 'Revenue today', value: fmt(revenueToday) },
    { label: 'Seats today', value: String(seatsToday) },
  ]
  const totalTiles = [
    { label: 'Revenue this month', value: fmt(monthTotals.revenueCents) },
    { label: 'Revenue all time', value: fmt(allTimeTotals.revenueCents) },
    { label: 'Confirmed bookings', value: String(allTimeTotals.count) },
    { label: 'Seats sold all time', value: String(allTimeTotals.seats) },
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <Section title={`Today's departures — ${edmontonTodayISO()} (Mountain Time)`} tiles={todayTiles} />
      <Link href="/staff/manifest" style={{ display: 'inline-block', margin: '8px 0 20px', fontSize: 13, fontWeight: 600, color: 'var(--theme-success-500)' }}>
        → Open today&apos;s departure manifest
      </Link>
      <Section title="Confirmed-booking totals" tiles={totalTiles} />
    </div>
  )
}

function Section({ title, tiles }: { title: string; tiles: { label: string; value: string }[] }) {
  return (
    <>
      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-elevation-500)', margin: '0 0 12px' }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: '14px 16px', background: 'var(--theme-elevation-50)' }}>
            <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{t.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--theme-elevation-800)', marginTop: 4 }}>{t.value}</div>
          </div>
        ))}
      </div>
    </>
  )
}
