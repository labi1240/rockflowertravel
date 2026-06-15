import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { getFareBySlug } from '@/lib/fares-db'
import { getDepartureSeats, type DepartureKey } from '@/lib/inventory'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Read-only seat availability for one departure, used by the booking modal to preview
// demand-surge pricing live (the checkout endpoint stays the authoritative pricer).
// Conservative by design: `seatsBooked` includes pending holds, so this never under-counts
// demand. No row mutation, no auth — it only exposes a seat count.
const QuerySchema = z.object({
  route: z.string().min(1), // fare slug
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    route: searchParams.get('route'),
    date: searchParams.get('date'),
    time: searchParams.get('time'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }
  const { route, date, time } = parsed.data

  try {
    const fare = await getFareBySlug(route)
    if (!fare || !fare.active) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 400 })
    }

    // Same departure key the checkout reserves against: routeSlug for catalog fares,
    // else the legacy routeKind tag.
    const inventoryKey: DepartureKey = {
      routeSlug: fare.routeSlug ?? fare.routeKind,
      serviceDateISO: date,
      departureTime: time,
    }

    const payload = await getPayloadClient()
    const { seatsTotal, seatsRemaining } = await getDepartureSeats(payload, inventoryKey)

    return NextResponse.json(
      { seatsTotal, seatsRemaining },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[availability] failed', err)
    return NextResponse.json({ error: 'Could not load availability' }, { status: 500 })
  }
}
