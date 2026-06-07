import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getPayloadClient } from '@/lib/payload'
import { releaseExpiredHolds } from '@/lib/inventory'

export const runtime = 'nodejs'

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayloadClient()
    const released = await releaseExpiredHolds(payload)
    return NextResponse.json({ released })
  } catch (err) {
    console.error('[cron/release-holds] failed', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
