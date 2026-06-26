import 'server-only'

import { Resend } from 'resend'
import { absoluteUrl, SITE } from '@/lib/seo'

// Resend requires a verified domain for production. The default works for test sends
// to the account owner; set EMAIL_FROM to a verified address before launch.
const FROM = process.env.EMAIL_FROM || 'RockFlower Travels <onboarding@resend.dev>'

export interface ConfirmationData {
  reference: string
  name?: string | null
  email: string
  routeName?: string | null
  serviceDate?: string | null
  departureTime?: string | null
  seats?: number | null
  totalCents: number
  currency?: string | null
}

const fmtCAD = (cents: number, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(cents / 100)

const fmtDate = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso))
    : 'See booking'

/** Send a booking confirmation + boarding-pass link. Fault-tolerant: never throws. */
export async function sendBookingConfirmation(b: ConfirmationData): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping confirmation email')
    return
  }
  if (!b.email) return

  const url = absoluteUrl(`/my-trips/${b.reference}`)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:500px;margin:0 auto;color:#211b16;padding:20px;background:#f5f4f0;">
    <div style="background:#faf9f5;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);border:1px solid #e7e0d6;">
      
      <!-- Header -->
      <div style="padding:16px 24px;border-bottom:1px solid #f0ebe3;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:bold;letter-spacing:0.1em;color:#114b3b;text-transform:uppercase;">🌸 RockFlower Travels</span>
        <span style="background:#fceacc;color:#bc6a00;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;">Boarding Pass</span>
      </div>

      <!-- Details -->
      <div style="padding:24px;">
        <div style="margin-bottom:20px;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#211b16;">${b.name || 'Passenger'}</p>
          <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Passenger</p>
        </div>

        <div style="margin-bottom:20px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#211b16;">${b.routeName ?? 'Shuttle'}</p>
          <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Route</p>
        </div>

        <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
          <tr>
            <td style="width:40%;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#211b16;">${fmtDate(b.serviceDate)}</p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Date</p>
            </td>
            <td style="width:40%;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#bc6a00;">${b.departureTime ?? '—'}</p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Departs</p>
            </td>
            <td style="width:20%;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#211b16;">${b.seats ?? 1}</p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Pax</p>
            </td>
          </tr>
        </table>

        <!-- Dashed Divider -->
        <div style="border-top:1px dashed #d1c8b9;margin:24px 0;"></div>

        <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
          <tr>
            <td>
              <p style="margin:0;font-size:14px;font-weight:bold;letter-spacing:0.1em;color:#bc6a00;font-family:monospace;">${b.reference}</p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Reference</p>
            </td>
            <td style="text-align:right;">
              <p style="margin:0;font-size:15px;font-weight:800;color:#211b16;">${fmtCAD(b.totalCents, b.currency ?? 'CAD')}</p>
              <p style="margin:4px 0 0;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#8a7c6d;text-transform:uppercase;">Paid · ${b.currency?.toUpperCase() || 'CAD'}</p>
            </td>
          </tr>
        </table>

        <!-- QR Code -->
        <div style="text-align:center;background:#fff;padding:16px;border-radius:12px;border:1px solid #e7e0d6;margin-bottom:16px;">
          <img src="${qrUrl}" alt="QR Code" width="150" height="150" style="display:block;margin:0 auto;" />
          <p style="margin:12px 0 4px;font-size:10px;font-weight:bold;letter-spacing:0.2em;color:#8a7c6d;font-family:monospace;">${b.reference}</p>
          <p style="margin:0;font-size:10px;color:#8a7c6d;">Scan to view your live booking</p>
        </div>

        <p style="margin:0;font-size:12px;color:#6b5d50;text-align:center;line-height:1.5;">
          Arrive <strong style="color:#211b16;">10 minutes</strong> before departure and present this pass to the driver.
        </p>

        <!-- Parks Canada parking notice -->
        <div style="margin-top:16px;background:#fdf3f1;border:1px solid #f1c8c0;border-radius:12px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:bold;letter-spacing:0.1em;color:#b3331c;text-transform:uppercase;">⚠ Important — Parking</p>
          <p style="margin:0;font-size:12px;color:#6b5d50;line-height:1.5;">
            Please plan your parking before you travel — we are unable to provide or guarantee parking. Parks Canada does <strong style="color:#211b16;">not</strong> permit customer parking at any Parks Canada parking lots, public parking areas, day-use areas, or trailheads at the <strong style="color:#211b16;">Lake Louise Lakeshore</strong> or <strong style="color:#211b16;">Moraine Lake</strong>. We recommend leaving your vehicle at your accommodation and reaching your pickup point by local public transit or taxi.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${url}" style="display:inline-block;background:#e8a13a;color:#0f2a20;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;">Open Online Pass →</a>
        </div>
      </div>
    </div>
  </div>`

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: b.email,
      subject: `Your RockFlower booking ${b.reference} is confirmed`,
      html,
    })
  } catch (err) {
    console.error('[email] confirmation send failed', err)
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const messageCardHtml = (heading: string, lead: string, body: string, ctaUrl: string, ctaLabel: string) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#211b16">
    <h1 style="font-size:20px;color:#114b3b;margin:0 0 4px">${heading}</h1>
    <p style="color:#6b5d50;margin:0 0 16px">${lead}</p>
    <blockquote style="margin:0 0 20px;padding:14px 16px;background:#fff;border:1px solid #e7e0d6;border-left:3px solid #e8a13a;border-radius:8px;white-space:pre-wrap;color:#211b16">${escapeHtml(body)}</blockquote>
    <a href="${ctaUrl}" style="display:inline-block;background:#e8a13a;color:#0f2a20;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${ctaLabel} →</a>
  </div>`

/** Notify the support inbox that a customer sent a message. Fault-tolerant: never throws. */
export async function notifyStaffOfMessage(m: {
  reference: string | null
  bookingId: number | string | null
  body: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const to = 'rockflowertravels@gmail.com'
  if (!key || !to) {
    console.warn('[email] RESEND_API_KEY or SUPPORT_EMAIL not set — skipping support notification')
    return
  }
  const ref = m.reference ? ` (${m.reference})` : ''
  const adminUrl = m.bookingId != null ? absoluteUrl(`/admin/collections/bookings/${m.bookingId}`) : absoluteUrl('/admin')
  const html = messageCardHtml(
    'New customer message',
    `A rider sent a message about booking${ref}.`,
    m.body,
    adminUrl,
    'Open booking in admin',
  )
  try {
    await new Resend(key).emails.send({
      from: FROM,
      to,
      subject: `New message${ref ? ' re ' + m.reference : ''} — ${SITE.name}`,
      html,
    })
  } catch (err) {
    console.error('[email] support notification failed', err)
  }
}

/** Notify a customer that staff replied to their thread. Fault-tolerant: never throws. */
export async function notifyCustomerOfReply(m: {
  email: string
  reference: string | null
  body: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping reply notification')
    return
  }
  if (!m.email) return
  const tripUrl = m.reference ? absoluteUrl(`/my-trips/${m.reference}`) : absoluteUrl('/my-trips')
  const html = messageCardHtml(
    `You have a reply from ${SITE.name}`,
    'Our team replied to your message:',
    m.body,
    tripUrl,
    'View the conversation',
  )
  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: m.email,
      subject: `Reply from ${SITE.name}${m.reference ? ' — booking ' + m.reference : ''}`,
      html,
    })
  } catch (err) {
    console.error('[email] reply notification failed', err)
  }
}

/**
 * Welcome a rider whose account was auto-created at booking, linking to a one-time
 * set-password page. We never email a plaintext password. Fault-tolerant: never throws.
 */
export async function sendWelcomeSetPassword(d: {
  email: string
  firstName?: string | null
  token: string
  reference?: string | null
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping welcome email')
    return
  }
  if (!d.email || !d.token) return
  const url = absoluteUrl(`/set-password?token=${encodeURIComponent(d.token)}`)
  const hi = d.firstName ? `Hi ${escapeHtml(d.firstName)}, ` : ''
  const ref = d.reference ? ` (${escapeHtml(d.reference)})` : ''
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#211b16">
    <h1 style="font-size:20px;color:#114b3b;margin:0 0 4px">Welcome to ${SITE.name} 🌸</h1>
    <p style="color:#6b5d50;margin:0 0 16px">${hi}we created an account for you so you can manage your booking${ref}, view your boarding pass, and request changes. Set a password to finish setting it up:</p>
    <a href="${url}" style="display:inline-block;background:#e8a13a;color:#0f2a20;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Set your password →</a>
    <p style="color:#8a7c6d;font-size:12px;margin-top:16px">This link expires in 1 hour. You can always sign in later and reset it from the sign-in page.</p>
  </div>`
  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: d.email,
      subject: `Welcome to ${SITE.name} — set your password`,
      html,
    })
  } catch (err) {
    console.error('[email] welcome email failed', err)
  }
}

/** Notify the support inbox that a rider requested cancellation. Fault-tolerant: never throws. */
export async function sendCancellationRequestToStaff(d: {
  reference: string
  bookingId: number | string
  customerEmail: string
  reason?: string | null
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const to = 'rockflowertravels@gmail.com'
  if (!key || !to) {
    console.warn('[email] RESEND_API_KEY or SUPPORT_EMAIL not set — skipping cancellation notice')
    return
  }
  const adminUrl = absoluteUrl(`/admin/collections/bookings/${d.bookingId}`)
  const html = messageCardHtml(
    'Cancellation requested',
    `${escapeHtml(d.customerEmail)} requested to cancel booking ${escapeHtml(d.reference)}. Review and refund in the admin if appropriate.`,
    d.reason?.trim() ? d.reason : '(no reason provided)',
    adminUrl,
    'Open booking in admin',
  )
  try {
    await new Resend(key).emails.send({
      from: FROM,
      to,
      subject: `Cancellation requested — ${d.reference} — ${SITE.name}`,
      html,
    })
  } catch (err) {
    console.error('[email] cancellation notice failed', err)
  }
}

/** Notify staff of a new booking confirmation. Fault-tolerant: never throws. */
export async function notifyStaffOfNewBooking(b: ConfirmationData & { bookingId: number | string }): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const to = 'rockflowertravels@gmail.com'
  if (!key || !to) {
    console.warn('[email] RESEND_API_KEY or SUPPORT_EMAIL not set — skipping staff booking notification')
    return
  }

  const adminUrl = absoluteUrl(`/admin/collections/bookings/${b.bookingId}`)
  const html = messageCardHtml(
    'New Booking Confirmed 🎉',
    `A new booking (${b.reference}) was just confirmed for ${b.routeName || 'a shuttle'}.`,
    `Date: ${fmtDate(b.serviceDate)}
Departure: ${b.departureTime || '—'}
Passengers: ${b.seats || 1}
Total: ${fmtCAD(b.totalCents, b.currency || 'CAD')}
Customer: ${b.email}`,
    adminUrl,
    'View booking in admin'
  )

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to,
      subject: `New Booking Confirmed — ${b.reference} — ${SITE.name}`,
      html,
    })
  } catch (err) {
    console.error('[email] staff booking notification failed', err)
  }
}
