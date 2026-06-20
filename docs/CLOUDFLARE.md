# Cloudflare Setup — Bot Protection & Bandwidth Control

Reference for putting **rockflowertravels.ca** behind Cloudflare's free plan to
stop scraper abuse and cut Vercel Fast Data Transfer.

## Background

In June 2026 a single scraper burst served ~324 GB (69% to Mumbai `bom1`, 9% to
Singapore `sin1`) and paused the Vercel account. Root cause was **bytes per
request**, not page count: every page shipped a 31 MB hero video + ~1.7 MB of
oversized logos with no caching, so each bot hit cost ~33 MB. New domains get
auto-scanned within hours (Certificate Transparency logs → bot farms on cheap
Mumbai/Singapore VPS), so the traffic is indiscriminate, not targeted.

Fixes already shipped in-repo (on `main`):
- Hero video 31 MB → 1.7 MB, `preload="none"` + poster
- `main_logo.png` 1 MB → 135 KB, `white_logo.png` → 94 KB, poster → 373 KB JPEG
- `Cache-Control: immutable` on static assets + AVIF/WebP image optimizer (`next.config.ts`)
- Edge middleware bot-blocker (`src/middleware.ts`)

Cloudflare is the final layer: it caches static assets at its edge so bots never
reach Vercel, and gives a free WAF to block/challenge abuse.

---

## Prerequisites (these make everything else work)

Changing nameservers alone does nothing. After the domain shows **Active** in
Cloudflare, confirm:

1. **DNS → Records:** the record is **Proxied (orange cloud ON)**. Grey cloud =
   DNS only = no caching, no protection.
2. **SSL/TLS → Overview:** encryption mode = **Full (strict)**. Leaving it on
   "Flexible" causes an infinite redirect loop with Vercel (Vercel forces HTTPS).

Verify it's live by checking response headers (browser Network tab or a header
checker):
- `server: cloudflare`
- `cf-cache-status: HIT` on `/hero_video.mp4`, `/main_logo.png`, `/images/*` →
  means Cloudflare is serving them, not Vercel.

---

## Toggles (no rules needed)

**Security → Bots**
- Bot Fight Mode → **ON**

**Security → Settings**
- Security Level → **High**
- Browser Integrity Check → **ON**

---

## WAF custom rules (free plan allows up to 5)

**Security → WAF → Custom rules → Create rule → "Edit expression"**, paste each.

### Rule 1 — Block AI scrapers & known bad bots
**Action: Block**
```
(http.user_agent eq "") or
(lower(http.user_agent) contains "gptbot") or
(lower(http.user_agent) contains "oai-searchbot") or
(lower(http.user_agent) contains "chatgpt-user") or
(lower(http.user_agent) contains "claudebot") or
(lower(http.user_agent) contains "anthropic-ai") or
(lower(http.user_agent) contains "ccbot") or
(lower(http.user_agent) contains "bytespider") or
(lower(http.user_agent) contains "perplexitybot") or
(lower(http.user_agent) contains "amazonbot") or
(lower(http.user_agent) contains "ahrefsbot") or
(lower(http.user_agent) contains "semrushbot") or
(lower(http.user_agent) contains "dotbot") or
(lower(http.user_agent) contains "mj12bot") or
(lower(http.user_agent) contains "dataforseobot") or
(lower(http.user_agent) contains "petalbot") or
(lower(http.user_agent) contains "scrapy") or
(lower(http.user_agent) contains "python-requests") or
(lower(http.user_agent) contains "go-http-client")
```
> Deliberately excludes Googlebot / Bingbot / DuckDuckBot — those drive real SEO
> traffic. Mirrors the user-agent list in `src/middleware.ts`.

### Rule 2 — Challenge unverified bots from the abuse regions
**Action: Managed Challenge** (NOT Block — real tourists from India/Singapore
pass with one click; only bots fail)
```
(ip.geoip.country in {"IN" "SG"}) and not cf.client.bot
```
> Banff customers are international tourists, so never hard-block these
> countries. A challenge stops scrapers without rejecting genuine bookings.

### Rule 3 — Protect login/admin from brute force
**Action: Managed Challenge**
```
(http.request.uri.path contains "/admin") or
(http.request.uri.path contains "/sign-in") or
(http.request.uri.path contains "/api/users/login")
```

---

## Rate limiting (free tier includes 1 rule)

**Security → WAF → Rate limiting rules → Create**
- If: `(not cf.client.bot)`
- Rate: **60 requests / 1 minute** per IP
- Action: **Managed Challenge**

Catches any flood that slips past the rules above.

---

## Quick checklist

- [ ] Domain shows **Active** in Cloudflare
- [ ] Orange cloud ON (DNS → Records)
- [ ] SSL/TLS = Full (strict)
- [ ] Bot Fight Mode ON
- [ ] WAF Rule 1 (block scrapers)
- [ ] WAF Rule 2 (challenge IN/SG unverified)
- [ ] WAF Rule 3 (protect admin/login)
- [ ] Rate-limit rule
- [ ] Verified `cf-cache-status: HIT` on the hero video
