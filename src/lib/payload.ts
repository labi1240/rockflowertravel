import 'server-only'

import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cached: Promise<Payload> | null = null

/** Memoized Payload Local API client for use in Server Components, route handlers, and scripts. */
export const getPayloadClient = (): Promise<Payload> => {
  if (!cached) cached = getPayload({ config })
  return cached
}
