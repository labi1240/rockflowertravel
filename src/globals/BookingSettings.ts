import type { GlobalConfig } from 'payload'
import { isStaff } from '../access'

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  admin: {
    group: 'System',
    meta: {
      title: 'Booking Settings',
    },
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      name: 'pauseBookings',
      type: 'checkbox',
      label: 'Pause Bookings Globally',
      defaultValue: false,
      admin: {
        description: 'Toggle this on to temporarily disable checkout/bookings across the entire website.',
      },
    },
    {
      name: 'pauseMessage',
      type: 'textarea',
      label: 'Pause Message Notice',
      defaultValue: 'Bookings are temporarily suspended. We are currently performing maintenance. Please check back later.',
      admin: {
        description: 'Message shown to users on the booking form/modal when bookings are paused.',
        condition: (data) => Boolean(data?.pauseBookings),
      },
    },
  ],
}
