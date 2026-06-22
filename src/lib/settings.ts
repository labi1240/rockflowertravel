import 'server-only'

import { getPayloadClient } from '@/lib/payload'

export interface BookingSettingsType {
  pauseBookings?: boolean | null
  pauseMessage?: string | null
}

export async function getBookingSettings(): Promise<BookingSettingsType> {
  try {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({
      slug: 'booking-settings',
      depth: 0,
      overrideAccess: true,
    })
    return {
      pauseBookings: Boolean(settings.pauseBookings),
      pauseMessage: typeof settings.pauseMessage === 'string' ? settings.pauseMessage : null,
    }
  } catch (err) {
    console.error('[settings] failed to fetch booking-settings', err)
    return {
      pauseBookings: false,
      pauseMessage: null,
    }
  }
}
