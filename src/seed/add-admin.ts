/**
 * One-off: add (or ensure) an admin user.
 *   pnpm tsx --env-file=.env src/seed/add-admin.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const EMAIL = process.argv[2] || 'Rockflowertravels@gmail.com'
const PASSWORD = process.argv[3] || 'ChangeMe!2026'
const NAME = 'RockFlower Admin'

async function run() {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 1,
    overrideAccess: true,
  })

  if (!existing.docs[0]) {
    await payload.create({
      collection: 'users',
      data: { email: EMAIL, password: PASSWORD, name: NAME, roles: ['admin'] },
      overrideAccess: true,
    })
    console.log(`✅ admin created: ${EMAIL} (password: ${PASSWORD} — change after first login)`)
  } else {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { roles: ['admin'], password: PASSWORD },
      overrideAccess: true,
    })
    console.log(`✅ admin ensured (role=admin, password reset): ${EMAIL} / ${PASSWORD}`)
  }
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
