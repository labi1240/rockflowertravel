import 'server-only'

import { Resend } from 'resend'
import { absoluteUrl, SITE } from '@/lib/seo'

// Resend requires a verified domain for production. The default works for test sends
// to the account owner; set EMAIL_FROM to a verified address before launch.
const FROM = process.env.EMAIL_FROM || 'RockFlower Travels <onboarding@resend.dev>'

export interface ConfirmationData {
  reference: string
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
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#211b16">
    <h1 style="font-size:22px;color:#114b3b;margin:0 0 4px">Booking confirmed 🎉</h1>
    <p style="color:#6b5d50;margin:0 0 20px">Thanks for riding with ${SITE.name}.</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e7e0d6;border-radius:12px;overflow:hidden">
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px">Reference</td><td style="padding:12px 16px;text-align:right;font-weight:700">${b.reference}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px;border-top:1px solid #f0ebe3">Route</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #f0ebe3">${b.routeName ?? 'Shuttle'}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px;border-top:1px solid #f0ebe3">Date</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #f0ebe3">${fmtDate(b.serviceDate)}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px;border-top:1px solid #f0ebe3">Departure</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #f0ebe3">${b.departureTime ?? '—'}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px;border-top:1px solid #f0ebe3">Seats</td><td style="padding:12px 16px;text-align:right;border-top:1px solid #f0ebe3">${b.seats ?? 1}</td></tr>
      <tr><td style="padding:12px 16px;color:#8a7c6d;font-size:13px;border-top:1px solid #f0ebe3">Total paid</td><td style="padding:12px 16px;text-align:right;font-weight:700;border-top:1px solid #f0ebe3">${fmtCAD(b.totalCents, b.currency ?? 'CAD')}</td></tr>
    </table>
    <a href="${url}" style="display:inline-block;margin:24px 0;background:#e8a13a;color:#0f2a20;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">View your boarding pass →</a>
    <p style="color:#8a7c6d;font-size:12px;margin-top:8px">Please arrive 10 minutes early; buses depart on time.</p>
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
  const to = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM
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
