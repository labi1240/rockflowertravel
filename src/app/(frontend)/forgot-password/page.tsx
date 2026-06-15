'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Kicks off Payload's forgot-password flow. The branded reset email (configured on the
// Customers collection) links to /set-password?token=.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/customers/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Swallow — we always show the same neutral confirmation to avoid leaking which
      // emails have accounts.
    } finally {
      setSent(true)
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
          <h1 className="font-display text-2xl font-bold text-evergreen-800">Reset password</h1>

          {sent ? (
            <p className="mt-3 rounded-lg bg-evergreen-50 px-3 py-3 text-sm text-evergreen-800">
              If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a link to set a new password. Check your inbox.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-mist-700">Enter your email and we&apos;ll send a link to set a new password.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-mist-500">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-mist-900 focus:border-evergreen-500 focus:outline-none focus:ring-2 focus:ring-evergreen-500/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sunrise-500 px-6 py-4 font-display font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] transition-all hover:bg-sunrise-400 disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-mist-700">
            <Link href="/sign-in" className="font-semibold text-evergreen-700 underline underline-offset-2 hover:text-evergreen-800">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
