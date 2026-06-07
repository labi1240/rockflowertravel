'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/my-trips'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Create the customer account.
      const createRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      })
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => null)
        setError(body?.errors?.[0]?.message || 'Could not create account. The email may already be in use.')
        return
      }
      // Log in to set the session cookie.
      const loginRes = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!loginRes.ok) {
        router.push('/sign-in')
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'mt-1 w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-mist-900 focus:border-evergreen-500 focus:outline-none focus:ring-2 focus:ring-evergreen-500/25'
  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-mist-500'

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist-50 px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center" aria-label="RockFlower Travels — home">
          <Image src="/main_logo.png" alt="Rock Flower Travels Inc." width={400} height={195} priority className="h-12 w-auto" />
        </Link>

        <div className="rounded-3xl border border-mist-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="font-display text-2xl font-bold text-evergreen-800">Create your account</h1>
          <p className="mt-1 text-sm text-mist-700">Save your trips and re-book faster.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className={labelCls}>First name</label>
                <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="lastName" className={labelCls}>Last name</label>
                <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} autoComplete="family-name" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>Phone</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sunrise-500 px-6 py-4 font-display font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] transition-all hover:bg-sunrise-400 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-mist-700">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-evergreen-700 underline underline-offset-2 hover:text-evergreen-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
