/**
 * Hands-on demo: author a new route + fare, and put an existing fare on sale.
 *   pnpm tsx --env-file=.env src/seed/demo.ts          → create demo
 *   pnpm tsx --env-file=.env src/seed/demo.ts clear     → remove demo + clear sale
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const CLEAR = process.argv.includes('clear')

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => console.log(`[demo] ${m}`)

  const findOne = async (collection: 'routes' | 'fares', slug: string) => {
    const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
    return docs[0] ?? null
  }

  if (CLEAR) {
    const fare = await findOne('fares', 'canmore-banff')
    if (fare) await payload.delete({ collection: 'fares', id: fare.id, overrideAccess: true })
    const route = await findOne('routes', 'canmore-express')
    if (route) await payload.delete({ collection: 'routes', id: route.id, overrideAccess: true })
    const sale = await findOne('fares', 'banff-ll')
    if (sale) await payload.update({ collection: 'fares', id: sale.id, overrideAccess: true, data: { sale: { salePriceCents: null, saleStartsAt: null, saleEndsAt: null } } })
    log('cleared demo route, fare, and banff-ll sale.')
    process.exit(0)
  }

  // 1) New route (published)
  let route = await findOne('routes', 'canmore-express')
  if (!route) {
    route = await payload.create({
      collection: 'routes',
      overrideAccess: true,
      data: {
        slug: 'canmore-express',
        tier: 'daytime',
        displayName: 'Canmore Express',
        isPremium: false,
        description: 'Direct midday connection between Canmore and Banff.',
        _status: 'published',
      },
    })
    log('created route: Canmore Express (published)')
  } else {
    log('route already exists')
  }

  // 2) New fare pointing at the route
  let fare = await findOne('fares', 'canmore-banff')
  if (!fare) {
    fare = await payload.create({
      collection: 'fares',
      overrideAccess: true,
      data: {
        slug: 'canmore-banff',
        tier: 'daytime',
        route: route.id,
        label: 'Canmore → Banff',
        short: 'Canmore → Banff',
        origin: 'Canmore',
        destination: 'Banff',
        priceCents: 5499,
        tollCents: 0,
        defaultTime: '12:00 PM',
        active: true,
        sortOrder: 10,
      },
    })
    log('created fare: Canmore → Banff ($54.99), active')
  } else {
    log('fare already exists')
  }

  // 3) Put an existing fare on sale: banff-ll $65.99 → $49.99 for 7 days
  const banffLl = await findOne('fares', 'banff-ll')
  if (banffLl) {
    const now = Date.now()
    await payload.update({
      collection: 'fares',
      id: banffLl.id,
      overrideAccess: true,
      data: {
        sale: {
          salePriceCents: 4999,
          saleStartsAt: new Date(now - 60_000).toISOString(),
          saleEndsAt: new Date(now + 7 * 24 * 3600_000).toISOString(),
        },
      },
    })
    log('set sale on banff-ll: $65.99 → $49.99 (7 days)')
  }

  log('demo complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
