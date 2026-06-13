'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type Msg = {
  id: number
  sender: 'customer' | 'staff'
  body: string
  createdAt: string
  customer: number | { id: number }
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const customerId = (v: Msg['customer']) => (typeof v === 'object' ? v.id : v)

/**
 * Inline support thread on the Booking edit page. Reads/writes the `messages`
 * collection through Payload's REST API with the staff session; the collection's
 * beforeValidate hook stamps `sender: 'staff'` + `staffUser`. Mirrors the
 * RefundButton pattern for placement and styling.
 */
export function BookingMessages() {
  const { id: bookingId } = useDocumentInfo()
  const bookingCustomer = useFormFields(([fields]) => fields?.customer?.value as number | undefined)

  const [messages, setMessages] = useState<Msg[]>([])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Customer to reply to: the booking's linked account, else whoever started the thread.
  const replyCustomerId = bookingCustomer ?? (messages.length ? customerId(messages[0].customer) : undefined)

  const load = useCallback(async () => {
    if (!bookingId) return
    const params = new URLSearchParams({ 'where[booking][equals]': String(bookingId), sort: 'createdAt', depth: '0', limit: '200' })
    const res = await fetch(`/api/messages?${params}`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data?.docs)) setMessages(data.docs)
  }, [bookingId])

  // Initial load + mark customer messages read by staff.
  useEffect(() => {
    if (!bookingId) return
    void load()
    const markParams = new URLSearchParams({
      'where[booking][equals]': String(bookingId),
      'where[sender][equals]': 'customer',
      'where[readByStaffAt][equals]': 'null',
    })
    fetch(`/api/messages?${markParams}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ readByStaffAt: new Date().toISOString() }),
    }).catch(() => {})
  }, [bookingId, load])

  if (!bookingId) {
    return <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>Save the booking first to message the customer.</p>
  }

  async function send() {
    const body = reply.trim()
    if (!body || busy) return
    if (!replyCustomerId) {
      setError('No customer account is linked to this booking, so there is nobody to reply to.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ booking: bookingId, customer: replyCustomerId, body }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || data?.message || 'Could not send.')
        return
      }
      setReply('')
      await load()
    } catch {
      setError('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', padding: messages.length ? 4 : 0 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>No messages yet for this booking.</p>
        ) : (
          messages.map((m) => {
            const staff = m.sender === 'staff'
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: staff ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    background: staff ? 'var(--theme-success-100, #1d6b53)' : 'var(--theme-elevation-100)',
                    color: staff ? 'var(--theme-success-900, #fff)' : 'var(--theme-elevation-800)',
                  }}
                >
                  {m.body}
                </div>
                <span style={{ fontSize: 11, color: 'var(--theme-elevation-400)', marginTop: 2 }}>
                  {staff ? 'Staff' : 'Customer'} · {fmt(m.createdAt)}
                </span>
              </div>
            )
          })
        )}
      </div>

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        placeholder={replyCustomerId ? 'Reply to the customer…' : 'No linked customer to reply to (guest booking).'}
        disabled={!replyCustomerId}
        style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-elevation-800)',
          fontSize: 13,
          resize: 'vertical',
        }}
      />
      <button
        type="button"
        onClick={send}
        disabled={busy || !reply.trim() || !replyCustomerId}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          background: busy || !reply.trim() ? 'var(--theme-elevation-200)' : 'var(--theme-success-500, #2e8b6f)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Sending…' : 'Send reply'}
      </button>
      {error && <p style={{ fontSize: 12, color: 'var(--theme-error-500)' }}>{error}</p>}
    </div>
  )
}
