'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

// Shared by the booking auto-account welcome email and the forgot-password flow — both
// link here with a one-time ?token=. POSTs to Payload's reset-password endpoint, which
// sets the customer's password and logs them in.
function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('This link is missing its token. Request a new one from the sign-in page.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/customers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        setError('That link is invalid or expired. Request a new one from the sign-in page.')
        return
      }
      router.push('/my-trips')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist-50 px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center" aria-label="RockFlower Travels — home">
          <Image src="/main_logo.png" alt="Rock Flower Travels Inc." width={400} height={195} priority className="h-12 w-auto" />
        </Link>

        <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="font-display text-2xl font-bold text-evergreen-800">Set your password</h1>
          <p className="mt-1 text-sm text-mist-700">Choose a password to finish setting up your account.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-mist-500">New password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-mist-900 focus:border-evergreen-500 focus:outline-none focus:ring-2 focus:ring-evergreen-500/25"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-mist-500">Confirm password</label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-mist-900 focus:border-evergreen-500 focus:outline-none focus:ring-2 focus:ring-evergreen-500/25"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sunrise-500 px-6 py-4 font-display font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] transition-all hover:bg-sunrise-400 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Set password & sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-mist-700">
            Already set?{' '}
            <Link href="/sign-in" className="font-semibold text-evergreen-700 underline underline-offset-2 hover:text-evergreen-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-mist-50" />}>
      <SetPasswordForm />
    </Suspense>
  )
}
