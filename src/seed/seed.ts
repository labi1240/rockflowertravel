import type { Payload } from 'payload'

/**
 * Idempotent catalog seed — mirrors the original Prisma seed (PROJECT_SPEC §6):
 * 4 stops, 3 routes, 7 schedule templates, 4 vehicles, 6 fares, + a bootstrap admin.
 * Safe to run repeatedly (find-or-create / update by unique key).
 */

const hm = (h: number, m: number) => h * 60 + m

const PRICES = {
  SUNRISE_BANFF_MORAINE: 9998,
  DAYTIME_SAMSON_LL: 6599,
  DAYTIME_LL_MORAINE: 8999,
  DAYTIME_MORAINE_SAMSON: 6599,
  EVENING_LL_BANFF: 6599,
}

const STOPS = [
  { code: 'BANFF', name: 'Banff', lng: -115.5708, lat: 51.1784, notes: 'Sunrise origin and Evening return destination.' },
  { code: 'SAMSON', name: 'Samson Mall (Lake Louise Village)', lng: -116.1773, lat: 51.4254, notes: 'Main pickup point in Lake Louise Village.' },
  { code: 'LL_LAKESHORE', name: 'Lake Louise Lakeshore', lng: -116.217, lat: 51.417, notes: 'Use designated loading area per staff direction.' },
  { code: 'MORAINE', name: 'Moraine Lake', lng: -116.186, lat: 51.3217, notes: 'Designated loading area only.' },
]

const ROUTES = [
  { slug: 'sunrise-express', tier: 'sunrise', kind: 'SUNRISE_EXPRESS', displayName: 'Sunrise Express', isPremium: true, description: 'Premium 4:30 AM departure from Banff direct to Moraine Lake.' },
  { slug: 'daytime-circuit', tier: 'daytime', kind: 'DAYTIME_CIRCUIT', displayName: 'Daytime Circuit', isPremium: false, description: 'Repeating loop: Samson Mall → Lake Louise Lakeshore → Moraine Lake → Samson Mall.' },
  { slug: 'evening-return', tier: 'evening', kind: 'EVENING_RETURN', displayName: 'Evening Return', isPremium: false, description: '6:00 PM service from Lake Louise Lakeshore back to Banff.' },
]

const FARES = [
  { slug: 'sunrise-banff-moraine', tier: 'sunrise', routeKind: 'SUNRISE_EXPRESS', routeSlug: 'sunrise-express', label: 'Banff → Moraine Lake (Sunrise Express)', short: 'Sunrise · Banff → Moraine', origin: 'Banff', destination: 'Moraine Lake', priceCents: 9998, tollCents: 0, roundTrip: false, premium: true, defaultTime: '4:30 AM', note: 'Premium direct departure — first light at Moraine Lake.', sortOrder: 1 },
  { slug: 'sunrise-banff-ll', tier: 'sunrise', routeKind: 'SUNRISE_EXPRESS', routeSlug: 'sunrise-express', label: 'Banff → Lake Louise (Sunrise Express)', short: 'Sunrise · Banff → Lake Louise', origin: 'Banff', destination: 'Lake Louise', priceCents: 7999, tollCents: 0, roundTrip: false, premium: true, defaultTime: '4:30 AM', note: 'Premium early departure to Lake Louise.', sortOrder: 2 },
  { slug: 'banff-ll', tier: 'daytime', routeKind: 'DAYTIME_CIRCUIT', routeSlug: 'daytime-circuit', label: 'Banff → Lake Louise', short: 'Banff → Lake Louise', origin: 'Banff', destination: 'Lake Louise', priceCents: 6599, tollCents: 0, roundTrip: false, premium: false, defaultTime: '7:00 AM', note: null, sortOrder: 3 },
  { slug: 'banff-ll-moraine', tier: 'daytime', routeKind: 'DAYTIME_CIRCUIT', routeSlug: 'daytime-circuit', label: 'Banff → Lake Louise + Moraine Lake', short: 'Banff → Both Lakes', origin: 'Banff', destination: 'Lake Louise & Moraine Lake', priceCents: 8999, tollCents: 500, roundTrip: false, premium: false, defaultTime: '7:00 AM', note: 'Visits both lakes. +$5 Moraine Lake toll per guest, plus GST.', sortOrder: 4 },
  { slug: 'll-moraine', tier: 'daytime', routeKind: 'DAYTIME_CIRCUIT', routeSlug: 'daytime-circuit', label: 'Lake Louise ⇄ Moraine Lake (round trip)', short: 'Lake Louise ⇄ Moraine', origin: 'Lake Louise', destination: 'Moraine Lake', priceCents: 8999, tollCents: 0, roundTrip: true, premium: false, defaultTime: '7:00 AM', note: 'Direct shuttle — one ticket covers both directions (there and back).', sortOrder: 5 },
  { slug: 'evening-ll-banff', tier: 'evening', routeKind: 'EVENING_RETURN', routeSlug: 'evening-return', label: 'Lake Louise → Banff (Evening Return)', short: 'Evening · Lake Louise → Banff', origin: 'Lake Louise', destination: 'Banff', priceCents: 6599, tollCents: 0, roundTrip: false, premium: false, defaultTime: '6:00 PM', note: 'End-of-day transfer back to Banff.', sortOrder: 6 },
] as const

type LegInput = { sequence: number; from: string; to: string; departMin: number; arriveMin: number; bookable: boolean; priceCents: number }

export async function seed(payload: Payload): Promise<void> {
  const log = (m: string) => payload.logger.info(`[seed] ${m}`)

  // ── find-or-update helper ──────────────────────────────────────────────────
  async function upsert<T extends Record<string, unknown>>(
    collection: 'stops' | 'routes' | 'fares' | 'vehicles',
    whereField: string,
    whereValue: string,
    data: T,
  ): Promise<{ id: number }> {
    const { docs } = await payload.find({
      collection,
      where: { [whereField]: { equals: whereValue } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (docs[0]) {
      const updated = await payload.update({ collection, id: docs[0].id, data: data as never, overrideAccess: true })
      return updated as { id: number }
    }
    const created = await payload.create({ collection, data: data as never, overrideAccess: true })
    return created as { id: number }
  }

  // ── Stops ────────────────────────────────────────────────────────────────
  const stopIdByCode: Record<string, number> = {}
  for (const s of STOPS) {
    const doc = await upsert('stops', 'code', s.code, {
      code: s.code,
      name: s.name,
      location: [s.lng, s.lat],
      notes: s.notes,
    })
    stopIdByCode[s.code] = doc.id
  }
  log(`stops: ${Object.keys(stopIdByCode).length}`)

  // ── Routes (published) ─────────────────────────────────────────────────────
  const routeIdBySlug: Record<string, number> = {}
  for (const r of ROUTES) {
    const doc = await upsert('routes', 'slug', r.slug, {
      slug: r.slug,
      tier: r.tier,
      kind: r.kind,
      displayName: r.displayName,
      isPremium: r.isPremium,
      description: r.description,
      _status: 'published',
    })
    routeIdBySlug[r.slug] = doc.id
  }
  log(`routes: ${Object.keys(routeIdBySlug).length}`)

  // ── Schedule templates ─────────────────────────────────────────────────────
  async function upsertTemplate(routeSlug: string, label: string, sortOrder: number, legs: LegInput[]) {
    const data = {
      route: routeIdBySlug[routeSlug],
      label,
      sortOrder,
      legs: legs.map((l) => ({
        sequence: l.sequence,
        fromStop: stopIdByCode[l.from],
        toStop: stopIdByCode[l.to],
        departMin: l.departMin,
        arriveMin: l.arriveMin,
        bookable: l.bookable,
        priceCents: l.priceCents,
      })),
    }
    const { docs } = await payload.find({
      collection: 'schedule-templates',
      where: { label: { equals: label } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (docs[0]) {
      await payload.update({ collection: 'schedule-templates', id: docs[0].id, data: data as never, overrideAccess: true })
    } else {
      await payload.create({ collection: 'schedule-templates', data: data as never, overrideAccess: true })
    }
  }

  await upsertTemplate('sunrise-express', 'Sunrise Express (04:30)', 1, [
    { sequence: 1, from: 'BANFF', to: 'MORAINE', departMin: hm(4, 30), arriveMin: hm(6, 0), bookable: true, priceCents: PRICES.SUNRISE_BANFF_MORAINE },
    { sequence: 2, from: 'MORAINE', to: 'LL_LAKESHORE', departMin: hm(6, 10), arriveMin: hm(6, 35), bookable: false, priceCents: 0 },
    { sequence: 3, from: 'LL_LAKESHORE', to: 'SAMSON', departMin: hm(6, 35), arriveMin: hm(6, 50), bookable: false, priceCents: 0 },
  ])

  const circuits: Array<{ label: string; start: [number, number] }> = [
    { label: 'Circuit 1 (07:00)', start: [7, 0] },
    { label: 'Circuit 2 (09:00)', start: [9, 0] },
    { label: 'Circuit 3 (11:00)', start: [11, 0] },
    { label: 'Circuit 4 (13:30)', start: [13, 30] },
    { label: 'Circuit 5 (15:30)', start: [15, 30] },
  ]
  for (let i = 0; i < circuits.length; i++) {
    const { label, start } = circuits[i]
    const t0 = hm(start[0], start[1])
    await upsertTemplate('daytime-circuit', label, i + 1, [
      { sequence: 1, from: 'SAMSON', to: 'LL_LAKESHORE', departMin: t0, arriveMin: t0 + 15, bookable: true, priceCents: PRICES.DAYTIME_SAMSON_LL },
      { sequence: 2, from: 'LL_LAKESHORE', to: 'MORAINE', departMin: t0 + 15, arriveMin: t0 + 40, bookable: true, priceCents: PRICES.DAYTIME_LL_MORAINE },
      { sequence: 3, from: 'MORAINE', to: 'SAMSON', departMin: t0 + 40, arriveMin: t0 + 110, bookable: true, priceCents: PRICES.DAYTIME_MORAINE_SAMSON },
    ])
  }

  await upsertTemplate('evening-return', 'Evening Return (18:00)', 1, [
    { sequence: 1, from: 'LL_LAKESHORE', to: 'BANFF', departMin: hm(18, 0), arriveMin: hm(19, 15), bookable: true, priceCents: PRICES.EVENING_LL_BANFF },
  ])
  log('schedule templates: 7')

  // ── Vehicles ───────────────────────────────────────────────────────────────
  for (let i = 1; i <= 4; i++) {
    const code = `BUS-0${i}`
    await upsert('vehicles', 'code', code, { code, seatCapacity: 25, active: true })
  }
  log('vehicles: 4')

  // ── Fares ────────────────────────────────────────────────────────────────
  for (const f of FARES) {
    await upsert('fares', 'slug', f.slug, {
      slug: f.slug,
      tier: f.tier,
      route: routeIdBySlug[f.routeSlug],
      routeKind: f.routeKind,
      label: f.label,
      short: f.short,
      origin: f.origin,
      destination: f.destination,
      priceCents: f.priceCents,
      tollCents: f.tollCents,
      roundTrip: f.roundTrip,
      premium: f.premium,
      defaultTime: f.defaultTime,
      note: f.note ?? undefined,
      active: true,
      sortOrder: f.sortOrder,
    })
  }
  log(`fares: ${FARES.length}`)

  // ── Bootstrap admin ──────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'lovepreetgill1238@gmail.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026'
  const existing = await payload.find({ collection: 'users', where: { email: { equals: adminEmail } }, limit: 1, overrideAccess: true })
  if (!existing.docs[0]) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password: adminPassword, name: 'RockFlower Admin', roles: ['admin'] },
      overrideAccess: true,
    })
    log(`admin created: ${adminEmail} (password: ${adminPassword} — change after first login)`)
  } else {
    // Ensure the admin role is set and reset the password to the known seed default
    // (handles users created before the role/password logic existed).
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { roles: ['admin'], password: adminPassword },
      overrideAccess: true,
    })
    log(`admin ensured (role=admin, password reset): ${adminEmail} / ${adminPassword}`)
  }

  log('seed complete.')
}
