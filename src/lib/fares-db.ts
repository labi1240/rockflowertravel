import 'server-only'

import { getPayloadClient } from '@/lib/payload'
import type { FareDTO, FareTier } from '@/lib/fares'
import type { Fare, Route } from '@/payload-types'

const msOrNull = (v?: string | null): number | null => (v ? new Date(v).getTime() : null)

/** Resolve the selling route's slug from the (possibly populated) relationship. */
function resolveRouteSlug(row: Fare): string | null {
  const r = row.route
  if (r && typeof r === 'object') return (r as Route).slug ?? null
  return row.routeKind ?? null
}

/** Maps a Payload Fare doc to the serializable FareDTO (dates → epoch ms). */
export function toFareDTO(row: Fare): FareDTO {
  return {
    id: row.slug,
    tier: row.tier as FareTier,
    routeKind: row.routeKind ?? '',
    routeSlug: resolveRouteSlug(row),
    label: row.label,
    short: row.short,
    origin: row.origin,
    destination: row.destination,
    priceCents: row.priceCents,
    tollCents: row.tollCents ?? 0,
    roundTrip: Boolean(row.roundTrip),
    premium: Boolean(row.premium),
    defaultTime: row.defaultTime,
    note: row.note ?? null,
    active: row.active ?? true,
    salePriceCents: row.sale?.salePriceCents ?? null,
    saleStartsMs: msOrNull(row.sale?.saleStartsAt),
    saleEndsMs: msOrNull(row.sale?.saleEndsAt),
    sortOrder: row.sortOrder ?? 0,
  }
}

/** All active fares, tier/sortOrder ordered — for selectors and marketing surfaces. */
export async function getActiveFares(): Promise<FareDTO[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'fares',
    where: { active: { equals: true } },
    sort: ['tier', 'sortOrder'],
    depth: 1, // populate route to resolve its slug
    limit: 200,
    overrideAccess: true,
  })
  return docs.map(toFareDTO)
}

/** A single fare by its stable slug (active or not) — checkout decides sellability. */
export async function getFareBySlug(slug: string): Promise<FareDTO | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'fares',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] ? toFareDTO(docs[0]) : null
}
