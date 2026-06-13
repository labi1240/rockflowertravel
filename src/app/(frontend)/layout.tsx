import type { Metadata, Viewport } from 'next'
import { Outfit, Plus_Jakarta_Sans, Geist } from 'next/font/google'
import React from 'react'
import './globals.css'
import { cn, requestNowMs } from '@/lib/utils'
import { FaresProvider } from '@/components/FaresProvider'
import { getActiveFares } from '@/lib/fares-db'
import type { FareDTO } from '@/lib/fares'
import { SITE, organizationSchema, websiteSchema } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Banff, Lake Louise & Moraine Lake Shuttle Service`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  category: 'travel',
  alternates: { canonical: '/' },
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: { icon: '/main_logo.png', shortcut: '/main_logo.png', apple: '/main_logo.png' },
  openGraph: {
    title: `${SITE.name} | Banff & Lake Louise Shuttles`,
    description: SITE.shortDescription,
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} | Banff & Lake Louise Shuttles`,
    description: SITE.shortDescription,
    creator: SITE.twitter,
    site: SITE.twitter,
  },
}

export const viewport: Viewport = {
  themeColor: '#1f3d2b',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  // Load the fare catalog once and feed the client islands (booking modal, hero form) via
  // context. Degrade gracefully to an empty catalog if the DB is unavailable. `nowMs` is
  // request-time and shared across SSR + hydration so sale-price evaluation can't mismatch.
  let fares: FareDTO[] = []
  try {
    fares = await getActiveFares()
  } catch (err) {
    console.error('[FrontendLayout] failed to load fares', err)
  }
  const nowMs = requestNowMs()

  return (
    <html lang="en" className={cn(outfit.variable, plusJakarta.variable, 'font-sans', geist.variable)}>
      <body>
        <JsonLd schema={[organizationSchema, websiteSchema]} />
        <FaresProvider fares={fares} nowMs={nowMs}>
          {children}
        </FaresProvider>
      </body>
    </html>
  )
}
