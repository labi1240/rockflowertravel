import { NextResponse, type NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
//  Edge middleware: cheap abuse filtering for the public marketing site.
//
//  Context: a single scraper burst (Jun 2026) served ~225 GB to one region and
//  blew through the Vercel transfer cap. Cloudflare (Bot Fight Mode + WAF) is the
//  primary defence; this middleware is an app-level backstop that runs on any
//  host/plan and rejects obvious bots *before* they pull page assets.
//
//  Scope: only the public site. /api (Stripe + UploadThing webhooks, Payload
//  REST) and /admin (Payload dashboard) are exempt so machine + owner traffic is
//  never touched — see the matcher below.
// ─────────────────────────────────────────────────────────────────────────────

// Aggressive scrapers, AI crawlers, and generic HTTP tooling. Deliberately does
// NOT include Googlebot / Bingbot / DuckDuckBot — those drive real SEO traffic.
const BAD_BOT =
  /(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|anthropic-ai|Claude-Web|CCBot|Bytespider|Amazonbot|PerplexityBot|Google-Extended|Diffbot|Omgili|ImagesiftBot|Meta-ExternalAgent|FacebookBot|AhrefsBot|SemrushBot|DotBot|MJ12bot|DataForSeoBot|BLEXBot|PetalBot|Barkrowler|ZoominfoBot|MauiBot|serpstatbot|python-requests|python-urllib|Scrapy|Go-http-client|node-fetch|libwww-perl|HTTPie|masscan|zgrab|Nikto)/i

// Optional hard country block. Empty by default — Banff customers are
// international tourists, so blanket geo-blocking risks rejecting real bookings.
// Turn on only if bot filtering isn't enough, e.g. BLOCKED_COUNTRIES="IN,SG".
const BLOCKED_COUNTRIES = new Set(
  (process.env.BLOCKED_COUNTRIES ?? '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean),
)

function deny(reason: string) {
  return new NextResponse(`Forbidden (${reason})`, {
    status: 403,
    headers: { 'cache-control': 'no-store' },
  })
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''

  // 1. Block known scrapers / AI crawlers / raw HTTP tooling by user-agent.
  if (BAD_BOT.test(ua)) return deny('bot')

  // 2. Optional country block. Cloudflare sets cf-ipcountry once proxied;
  //    Vercel sets x-vercel-ip-country. Absent in local dev → never blocks.
  if (BLOCKED_COUNTRIES.size > 0) {
    const country = (
      request.headers.get('cf-ipcountry') ??
      request.headers.get('x-vercel-ip-country') ??
      ''
    ).toUpperCase()
    if (country && BLOCKED_COUNTRIES.has(country)) return deny('geo')
  }

  return NextResponse.next()
}

export const config = {
  // Run on the public site only. Skip Next internals, the Payload admin, all
  // API/webhook routes, and common static asset extensions (Cloudflare caches
  // those and machine clients must pass through untouched).
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\.(?:mp4|webm|png|jpg|jpeg|webp|avif|svg|ico|woff|woff2|css|js|txt|xml)$).*)',
  ],
}
