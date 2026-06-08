'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message } from '@/payload-types'

type ThreadMessage = Pick<Message, 'id' | 'sender' | 'body' | 'createdAt'>

const TIME_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Edmonton',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const fmtTime = (iso?: string | null) => (iso ? TIME_FORMATTER.format(new Date(iso)) : '')

/**
 * Per-booking support conversation. Reads/writes through Payload's auto REST API
 * (`/api/messages`) with the customer's cookie session; the server-side hook stamps
 * owner + sender, so we only send `{ booking, body }`. Polls every 25s while mounted.
 */
export default function MessageThread({
  bookingId,
  initialMessages,
}: {
  bookingId: number
  initialMessages: ThreadMessage[]
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        'where[booking][equals]': String(bookingId),
        sort: 'createdAt',
        depth: '0',
        limit: '200',
      })
      const res = await fetch(`/api/messages?${params}`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.docs)) setMessages(data.docs)
    } catch {
      /* keep last-known messages on transient errors */
    }
  }, [bookingId])

  // Light polling for staff replies while the page is open.
  useEffect(() => {
    const id = setInterval(refresh, 25000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ booking: bookingId, body }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || data?.message || 'Could not send. Please try again.')
        return
      }
      setDraft('')
      await refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-evergreen-700">Messages</h2>
      <p className="mb-4 text-sm text-mist-500">Questions about this trip? Message our team here — we usually reply within a few hours.</p>

      <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-mist-200 bg-mist-50 p-4 text-sm text-mist-500">
            No messages yet. Send us a note and we&apos;ll get back to you.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === 'customer'
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-evergreen-700 text-white'
                      : 'rounded-bl-sm bg-mist-100 text-mist-900 ring-1 ring-mist-200'
                  }`}
                >
                  {m.body}
                </div>
                <span className="mt-1 px-1 text-[11px] text-mist-400">
                  {mine ? 'You' : 'RockFlower'} · {fmtTime(m.createdAt)}
                </span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e)
          }}
          rows={3}
          placeholder="Type your message…"
          className="w-full resize-y rounded-xl border border-mist-200 bg-mist-50 p-3 text-sm text-mist-900 outline-none transition focus:border-sunrise-500/60 focus:bg-white focus:ring-2 focus:ring-sunrise-400/30"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-mist-400">⌘/Ctrl + Enter to send</span>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sunrise-400 to-sunrise-500 px-5 py-2 text-sm font-bold text-evergreen-950 shadow-[0_0_15px_hsla(41,80%,58%,0.3)] transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
