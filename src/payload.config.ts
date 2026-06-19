import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
import { Messages } from './collections/Messages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Origins allowed to authenticate against the admin / REST API.
// Payload otherwise seeds `csrf` from `serverURL` alone — and `extractJWT`
// silently DROPS the auth cookie for any request whose Origin isn't on this
// list, so `req.user` becomes undefined and every write fails with
// "You are not allowed to perform this action." That bites the production
// custom domain (rockflowertravels.ca) and localhost, neither of which equals
// the Vercel serverURL. List every origin the panel is actually served from.
const allowedOrigins = [
  ...new Set(
    [
      serverURL,
      'https://rockflowertravels.ca',
      'https://www.rockflowertravels.ca',
      'https://rockflowertravel.vercel.app',
      'http://localhost:3000',
    ].filter(Boolean),
  ),
]

export default buildConfig({
  // Used to build absolute links in transactional email (e.g. password-reset).
  serverURL,
  cors: allowedOrigins,
  csrf: allowedOrigins,
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
    Messages,
    // System
    Media,
  ],
  editor: lexicalEditor(),
  // Transactional email (forgot-password, verification, etc.).
  // Uses Mailtrap SMTP when configured; otherwise Payload logs emails to the console.
  email: process.env.MAILTRAP_HOST
    ? nodemailerAdapter({
        defaultFromName: 'RockFlower Travels',
        defaultFromAddress:
          process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || 'rockflowertravels@gmail.com',
        transportOptions: {
          host: process.env.MAILTRAP_HOST,
          port: Number(process.env.MAILTRAP_PORT) || 2525,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        },
      })
    : undefined,
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
      // Serve media directly from the UploadThing CDN instead of proxying through
      // /api/media/file/*. The proxy declares Content-Length: 0 (UploadThing's CDN
      // omits content-length on HEAD), which Vercel enforces — images arrive empty
      // in production. Direct CDN URLs sidestep that and skip a function invocation.
      collections: { media: { disablePayloadAccessControl: true } },
      options: { token: process.env.UPLOADTHING_TOKEN, acl: 'public-read' },
    }),
  ],
})
