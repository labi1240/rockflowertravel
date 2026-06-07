import { getPayload } from 'payload'
import config from '../payload.config'
import { seed } from './seed'

const run = async () => {
  console.log('[run] booting payload…')
  const payload = await getPayload({ config })
  console.log('[run] payload ready, seeding…')
  await seed(payload)
  console.log('[run] done.')
  process.exit(0)
}

run().catch((err) => {
  console.error('[run] FAILED:', err)
  process.exit(1)
})
