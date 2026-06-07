import 'server-only'

import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import type { Customer } from '@/payload-types'

/**
 * Resolve the signed-in customer (frontend auth) from the request cookie.
 * Returns null for guests or when a staff token is present (staff aren't customers).
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  try {
    const payload = await getPayloadClient()
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })
    if (user && user.collection === 'customers') return user as Customer
    return null
  } catch {
    return null
  }
}
