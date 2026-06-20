import arcjet, { shield, detectBot } from '@arcjet/next'

// ─────────────────────────────────────────────────────────────────────────────
//  Shared Arcjet client — app-level security for sensitive API routes.
//
//  Everything starts in DRY_RUN. This site takes live bookings + payments, so we
//  observe what each rule *would* block against real traffic for a few days
//  before flipping mode to 'LIVE'. In DRY_RUN, decision.isDenied() stays false,
//  so the enforcement branches in each route are inert until we promote the
//  rules (via the Arcjet dashboard/MCP, no redeploy needed for remote rules, or
//  by changing mode here for these in-code rules).
//
//  Per-route rate limits are added inline with `.withRule(...)` so each endpoint
//  gets a limit tuned to its own traffic shape.
// ─────────────────────────────────────────────────────────────────────────────
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  // Identify clients by source IP (Arcjet derives the real IP from proxy headers).
  characteristics: ['ip.src'],
  rules: [
    // WAF: detect SQLi / XSS / other common attacks at the application layer.
    shield({ mode: 'DRY_RUN' }),
    // Block automated clients, but always allow verified search + uptime bots so
    // SEO and monitoring keep working.
    detectBot({
      mode: 'DRY_RUN',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:MONITOR', 'CATEGORY:PREVIEW'],
    }),
  ],
})
