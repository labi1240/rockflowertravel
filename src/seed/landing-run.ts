import { getPayload } from 'payload'
import config from '../payload.config'
import { seedLanding } from './landing'

const run = async () => {
  console.log('[landing-run] booting payload…')
  const payload = await getPayload({ config })
  console.log('[landing-run] payload ready, seeding landing page…')
  await seedLanding(payload)
  console.log('[landing-run] done.')
  process.exit(0)
}

run().catch((err) => {
  console.error('[landing-run] FAILED:', err)
  process.exit(1)
})
