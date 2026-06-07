'use client'

import React, { useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

/**
 * Admin booking sidebar action: issue a Stripe refund for a CONFIRMED booking.
 * Calls the staff-gated `/staff/refund` endpoint; the webhook finalizes REFUNDED status.
 */
export function RefundButton() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => (fields?.status?.value as string) ?? '')

  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  if (!id) {
    return <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>Save the booking first to enable refunds.</p>
  }

  if (status !== 'CONFIRMED') {
    return (
      <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>
        Refund available only for <strong>CONFIRMED</strong> bookings (current: {status || '—'}).
      </p>
    )
  }

  async function issueRefund() {
    if (!confirm('Issue a full Stripe refund for this booking? This cannot be undone.')) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/staff/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: id, reason }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ kind: 'err', text: body?.error || 'Refund failed.' })
        return
      }
      setMessage({ kind: 'ok', text: 'Refund issued. Status will update to REFUNDED via webhook shortly.' })
    } catch {
      setMessage({ kind: 'err', text: 'Network error.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-elevation-500)' }}>
        Refund reason (optional)
      </label>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. customer cancellation"
        style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-elevation-800)',
          fontSize: 13,
        }}
      />
      <button
        type="button"
        onClick={issueRefund}
        disabled={busy}
        style={{
          padding: '8px 14px',
          borderRadius: 6,
          border: 'none',
          background: busy ? 'var(--theme-elevation-200)' : 'var(--theme-error-500)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Processing…' : 'Issue refund'}
      </button>
      {message && (
        <p style={{ fontSize: 12, color: message.kind === 'ok' ? 'var(--theme-success-500)' : 'var(--theme-error-500)' }}>
          {message.text}
        </p>
      )}
    </div>
  )
}
