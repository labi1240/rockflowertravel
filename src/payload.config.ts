import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Stops } from './collections/Stops'
import { Routes } from './collections/Routes'
import { ScheduleTemplates } from './collections/ScheduleTemplates'
import { Fares } from './collections/Fares'
import { Vehicles } from './collections/Vehicles'
import { DepartureInventory } from './collections/DepartureInventory'
import { Bookings } from './collections/Bookings'
import { Payments } from './collections/Payments'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'RockFlower Travels — Operations',
      description: 'Shuttle booking operations center',
    },
    components: {
      beforeDashboard: ['/components/admin/DashboardKPIs#DashboardKPIs'],
    },
  },
  collections: [
    // People
    Users,
    Customers,
    // Catalog
    Stops,
    Routes,
    ScheduleTemplates,
    Fares,
    Vehicles,
    // Operations
    DepartureInventory,
    Bookings,
    Payments,
    // System
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Schema is managed via committed migrations (src/migrations), not dev push — this
    // keeps the project drift-free (the old app's db-push drift was a known pain point).
    push: false,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    // Persist Media uploads on UploadThing (Vercel's filesystem is ephemeral —
    // local-disk uploads 404 in production). Token from env UPLOADTHING_TOKEN.
    uploadthingStorage({
      collections: { media: true },
      options: { token: process.env.UPLOADTHING_TOKEN, acl: 'public-read' },
    }),
  ],
})
