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
const QuerySchema = z
  .object({
    route: z.string().min(1), // fare slug
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().min(1).optional(), // single-slot (surge preview)
    times: z.string().min(1).optional(), // comma-separated batch (slot picker)
  })
  .refine((v) => v.time || v.times, { message: 'time or times required' })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    route: searchParams.get('route'),
    date: searchParams.get('date'),
    time: searchParams.get('time') ?? undefined,
    times: searchParams.get('times') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }
  const { route, date, time, times } = parsed.data

  try {
    const fare = await getFareBySlug(route)
    if (!fare || !fare.active) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 400 })
    }

    // Same departure key the checkout reserves against: routeSlug for catalog fares,
    // else the legacy routeKind tag.
    const keyFor = (departureTime: string): DepartureKey => ({
      routeSlug: fare.routeSlug ?? fare.routeKind,
      serviceDateISO: date,
      departureTime,
    })

    const payload = await getPayloadClient()

    // Batch mode: one seat count per requested departure time, for the slot picker.
    if (times) {
      const list = [...new Set(times.split(',').map((t) => t.trim()).filter(Boolean))].slice(0, 24)
      const slots = await Promise.all(
        list.map(async (t) => {
          const { seatsTotal, seatsRemaining } = await getDepartureSeats(payload, keyFor(t))
          return { time: t, seatsTotal, seatsRemaining }
        }),
      )
      return NextResponse.json({ slots }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Single-slot mode (surge preview).
    const { seatsTotal, seatsRemaining } = await getDepartureSeats(payload, keyFor(time as string))
    return NextResponse.json(
      { seatsTotal, seatsRemaining },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[availability] failed', err)
    return NextResponse.json({ error: 'Could not load availability' }, { status: 500 })
  }
}
