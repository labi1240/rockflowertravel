// ─────────────────────────────────────────────────────────────────────────────
//  Fare pricing — TYPES + PURE MATH ONLY.
//
//  The fare *data* lives in the Payload `fares` collection (admin-editable). Load it
//  server-side via src/lib/fares-db.ts and deliver it to the client as `FareDTO`s
//  (the FaresProvider context). This module holds only the serializable shapes and
//  the pricing math, so the number the rider previews equals exactly what the
//  server-authoritative checkout route charges.
//
//  Prices are CAD cents, per seat, pre-GST. GST (5% Alberta) applies to the
//  fare + toll subtotal. The Moraine Lake toll is charged per passenger.
// ─────────────────────────────────────────────────────────────────────────────

// Fare ids are stable slugs. `string` (not a literal union) so admin-authored fares are
// valid — checkout validates membership against the DB, not this type.
export type FareId = string

export type FareTier = 'sunrise' | 'daytime' | 'evening'

export const GST_RATE = 0.05

// Serializable fare shape passed from server → client. Sale window is epoch-ms so it
// crosses the RSC boundary cleanly and compares without Date parsing.
export interface FareDTO {
  id: string
  tier: FareTier
  routeKind: string
  routeSlug: string | null
  label: string
  short: string
  origin: string
  destination: string
  priceCents: number // base fare per seat, pre-toll, pre-GST
  tollCents: number // toll per passenger, pre-GST
  roundTrip: boolean
  premium: boolean
  defaultTime: string
  note: string | null
  active: boolean
  salePriceCents: number | null
  saleStartsMs: number | null // epoch ms, inclusive lower bound
  saleEndsMs: number | null // epoch ms, inclusive upper bound
  sortOrder: number
}

// Minimal pricing inputs — anything structurally compatible with a FareDTO works.
export interface FarePricing {
  priceCents: number
  tollCents: number
  salePriceCents: number | null
  saleStartsMs: number | null
  saleEndsMs: number | null
}

/**
 * True when a sale price is set and `nowMs` is within the (optional) sale window.
 * Both bounds are inclusive.
 */
export function isSaleActive(fare: FarePricing, nowMs: number): boolean {
  if (fare.salePriceCents == null) return false
  if (fare.saleStartsMs != null && nowMs < fare.saleStartsMs) return false
  if (fare.saleEndsMs != null && nowMs > fare.saleEndsMs) return false
  return true
}

/** Effective per-seat price at `nowMs` — sale price if active, else base price. */
export function effectiveUnitPrice(fare: FarePricing, nowMs: number): number {
  return isSaleActive(fare, nowMs) ? (fare.salePriceCents as number) : fare.priceCents
}

export interface Quote {
  unitPriceCents: number // effective per-seat price charged (sale-aware)
  originalUnitPriceCents: number // base price, for strikethrough display
  onSale: boolean
  fareCents: number // effective unit × passengers
  tollCents: number // toll × passengers
  subtotalCents: number // fare + toll (taxable base)
  gstCents: number // 5% GST on subtotal
  totalCents: number // grand total
}

// Server-authoritative AND client-preview pricing. Single implementation over a
// FareDTO so server and client always agree. `nowMs` makes sale evaluation explicit.
export function quote(fare: FarePricing, passengers: number, nowMs: number): Quote {
  const onSale = isSaleActive(fare, nowMs)
  const unitPriceCents = onSale ? (fare.salePriceCents as number) : fare.priceCents
  const fareCents = unitPriceCents * passengers
  const tollCents = fare.tollCents * passengers
  const subtotalCents = fareCents + tollCents
  const gstCents = Math.round(subtotalCents * GST_RATE)
  return {
    unitPriceCents,
    originalUnitPriceCents: fare.priceCents,
    onSale,
    fareCents,
    tollCents,
    subtotalCents,
    gstCents,
    totalCents: subtotalCents + gstCents,
  }
}

/** Loose runtime guard — real validation is done against the DB in the checkout route. */
export function isFareId(value: unknown): value is FareId {
  return typeof value === 'string' && value.length > 0
}

// Tier metadata for grouped selectors and marketing cards (pure, no pricing data).
export const TIERS: { key: FareTier; label: string; window: string }[] = [
  { key: 'sunrise', label: 'Sunrise Express', window: '4:30 AM departure' },
  { key: 'daytime', label: 'Daytime', window: '7:00 AM – 5:20 PM' },
  { key: 'evening', label: 'Evening Return', window: '6:00 PM departure' },
]

// "$89.99" — formats CAD cents as a dollar string (no currency suffix).
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
