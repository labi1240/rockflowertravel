/**
 * Upload the bundled location photos into the Media collection and link them as route
 * hero images. Idempotent: skips a route that already has a hero image.
 *   pnpm tsx --env-file=.env src/seed/photos.ts
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.resolve(dirname, '../../public/images/locations')

// route slug → [photo file, alt text]
const ROUTE_PHOTOS: Record<string, [string, string]> = {
  'sunrise-express': ['moraine-lake-ten-peaks.jpg', 'Sunrise over Moraine Lake and the Valley of the Ten Peaks'],
  'daytime-circuit': ['lake-louise-lakeshore.webp', 'Lake Louise lakeshore with turquoise water'],
  'evening-return': ['banff.jpg', 'Banff townsite in the Canadian Rockies'],
  'canmore-express': ['moraine-lake.jpg', 'Moraine Lake, Banff National Park'],
}

async function run() {
  const payload = await getPayload({ config })
  const log = (m: string) => console.log(`[photos] ${m}`)

  for (const [slug, [file, alt]] of Object.entries(ROUTE_PHOTOS)) {
    const { docs } = await payload.find({
      collection: 'routes',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const route = docs[0]
    if (!route) {
      log(`route not found, skipping: ${slug}`)
      continue
    }
    if (route.heroImage) {
      const oldMediaId = typeof route.heroImage === 'object' ? (route.heroImage as any).id : route.heroImage
      log(`route already has hero image ${oldMediaId}, deleting old media record to re-upload: ${slug}`)
      try {
        await payload.delete({
          collection: 'media',
          id: oldMediaId,
          overrideAccess: true,
        })
      } catch (e) {
        log(`note: could not delete old media record (might have already been deleted)`)
      }
    }

    const media = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.join(PUBLIC, file),
      overrideAccess: true,
    })
    await payload.update({
      collection: 'routes',
      id: route.id,
      data: { heroImage: media.id },
      overrideAccess: true,
    })
    log(`linked ${file} → ${slug}`)
  }

  log('done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
