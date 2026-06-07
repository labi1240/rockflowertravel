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

const mediaUrl = (v: unknown): string | null =>
  v && typeof v === 'object' && 'url' in v ? ((v as { url?: string | null }).url ?? null) : null

/** Fare image, falling back to the route's hero image (requires depth ≥ 2). */
function resolveImageUrl(row: Fare): string | null {
  const fareImg = mediaUrl(row.image)
  if (fareImg) return fareImg
  const r = row.route
  if (r && typeof r === 'object') return mediaUrl((r as Route).heroImage)
  return null
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
    imageUrl: resolveImageUrl(row),
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
    depth: 2, // populate route + nested hero image
    limit: 200,
    overrideAccess: true,
  })
  return docs.map(toFareDTO)
}

/**
 * Active fares selling a given route (by the route's stable `slug`), sorted by
 * price then sortOrder. Powers the route-centric landing page's bookable
 * price options. Returns [] when the route has no active fares.
 */
export async function getFaresByRouteSlug(routeSlug: string): Promise<FareDTO[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'fares',
    where: {
      active: { equals: true },
      'route.slug': { equals: routeSlug },
    },
    sort: ['priceCents', 'sortOrder'],
    depth: 2, // populate route + nested hero image
    limit: 50,
    overrideAccess: true,
  })
  return docs.map(toFareDTO)
}

/**
 * Public `seoSlug`s of published routes that have a landing page. Drives the
 * sitemap entries for the pretty top-level SEO URLs (/{seoSlug}).
 */
export async function getLandingSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'routes',
    where: { _status: { equals: 'published' }, seoSlug: { exists: true } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })
  return docs.map((r) => r.seoSlug).filter((s): s is string => Boolean(s))
}

/** A single fare by its stable slug (active or not) — checkout decides sellability. */
export async function getFareBySlug(slug: string): Promise<FareDTO | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'fares',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] ? toFareDTO(docs[0]) : null
}
