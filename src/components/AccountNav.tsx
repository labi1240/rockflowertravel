'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Me {
  id: number
  email: string
  firstName?: string | null
}

/** Auth-aware account links for the navbar (frontend customer session). */
export default function AccountNav() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/customers/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setMe(data?.user ?? null)
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [])

  async function signOut() {
    await fetch('/api/customers/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setMe(null)
    router.push('/')
    router.refresh()
  }

  if (!loaded) {
    return <div className="hidden h-9 w-20 animate-pulse rounded-full bg-mist-200 sm:block" />
  }

  if (me) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/my-trips"
          className="hidden rounded-full px-4 py-2 text-sm font-medium text-mist-700 transition-all hover:bg-mist-100 hover:text-evergreen-700 sm:inline-flex"
        >
          My Trips
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-mist-200 bg-white px-4 py-2 text-sm font-medium text-mist-900 shadow-sm transition-all hover:border-mist-300 hover:bg-mist-100 active:scale-95"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/sign-in"
        className="hidden rounded-full px-4 py-2 text-sm font-medium text-mist-700 transition-all hover:bg-mist-100 hover:text-evergreen-700 active:scale-95 sm:inline-flex"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="rounded-full border border-mist-200 bg-white px-4 py-2 text-sm font-medium text-mist-900 shadow-sm transition-all hover:border-mist-300 hover:bg-mist-100 active:scale-95"
      >
        Sign up
      </Link>
    </div>
  )
}
