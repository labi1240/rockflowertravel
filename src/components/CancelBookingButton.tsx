'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Customer-facing "request cancellation" control on a booking detail page. Posts to
// /account/cancel-request, which records the ask and emails support. Staff issue the
// actual refund — this never refunds on its own.
export default function CancelBookingButton({
  reference,
  requested,
}: {
  reference: string
  requested: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(requested)
  const [error, setError] = useState('')

  if (done) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Cancellation requested</p>
        <p className="mt-0.5">Our team will review it and follow up by email. Refunds are processed manually.</p>
      </div>
    )
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/account/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, reason }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        setError(d.error || 'Could not submit request. Please try again.')
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-mist-300 bg-white px-5 py-3 text-sm font-semibold text-mist-700 transition hover:border-red-300 hover:text-red-700"
      >
        Request cancellation
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-4">
      <label htmlFor="cancel-reason" className="text-xs font-semibold uppercase tracking-wider text-mist-500">
        Reason (optional)
      </label>
      <textarea
        id="cancel-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Let us know why you're cancelling…"
        className="mt-1 w-full rounded-xl border border-mist-200 bg-white px-3 py-2.5 text-sm text-mist-900 focus:border-evergreen-500 focus:outline-none focus:ring-2 focus:ring-evergreen-500/25"
      />
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Submit cancellation request'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-xl border border-mist-200 px-5 py-2.5 text-sm font-semibold text-mist-600 transition hover:bg-mist-50"
        >
          Keep booking
        </button>
      </div>
    </div>
  )
}
