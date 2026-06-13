# RockFlower Travels — Progress Report

_Last updated: 2026-06-10_

## ✅ Shipped (update 3): Lint repair + code-health pass (2026-06-10)

`pnpm lint` had been silently broken (config imported the uninstalled
`@eslint/eslintrc`; `eslint-config-next` 16 is flat-config-native anyway).
Rewrote `eslint.config.mjs` in flat style, excluded the legacy `shuttle_service/`
tree, and fixed every error the working linter surfaced:

- `Date.now()` in async server components → `requestNowMs()` helper in
  `src/lib/utils.ts` (request-time reads are intentional there; the purity rule
  can't tell server from client components).
- `LightRays` now uses a deterministic seeded PRNG computed during render —
  hydration-safe with no setState-in-effect, and no flash of empty rays on mount.
- `RouteMapInteractive`: `isVisible` wrapped in `useCallback`, stale deps and
  dead eslint directives removed.
- `<a>` → `next/link` in `BookingModal` + admin `DashboardKPIs`.
- Deleted the Payload blank-template example endpoint `/my-route`.
- Updated the stale blank-template e2e homepage test to assert the real site.
- Migration files' template-generated unused args are lint-exempted.

`pnpm build`, `pnpm exec tsc --noEmit`, and `pnpm lint` all pass (0 errors).

## ✅ Shipped (update 2): Route-page redesign + image hosting + URL consolidation

Brought the dedicated route pages up to morainelakebus/Viator quality and fixed
the production-image breakage.

- **UploadThing media hosting** — Payload `Media` now persists to UploadThing
  (`@payloadcms/storage-uploadthing`), fixing broken images on Vercel (the
  serverless filesystem is ephemeral). `next.config` allows `*.ufs.sh` / `utfs.io`.
  Migration `add_uploadthing_media_fields` adds the `_key`/`prefix` columns.
- **One canonical page** — legacy `/routes/[fareSlug]` now **308-redirects** to the
  route's rich landing page (`/{seoSlug}`) when one is published.
- **Gallery hero** — Viator-style 1-large + 4-tile header (auto-built from the
  route hero image + Gallery-block photos), with a gradient fallback so a missing
  image never shows a broken icon. Hero no longer clips under the fixed navbar.
- **Sticky booking** — sticky price/fare card in the intro row + a slide-up
  bottom "Book now" bar on scroll.
- **Reviews summary** — aggregate rating header (e.g. 4.9 / 5, "Based on N reviews")
  above the testimonial cards.
- **You might also like** — related published-landing cards (image + from-price).
- **Breadcrumbs** — visible nav + `BreadcrumbList` JSON-LD.

### ⚠️ Action items before/after deploy
1. **Vercel env:** add `UPLOADTHING_TOKEN` (and `UPLOADTHING_SECRET_KEY`) to the
   Vercel project so production uploads work.
2. **Re-upload images:** existing Media rows point at old local-disk URLs and will
   404 until re-uploaded through the admin (UploadThing handles new uploads only).
   The seeded `sunrise-express` route has no images yet — add a hero + gallery photos
   in admin to light up the gallery hero.
3. **Restart local dev** (`pnpm dev`) — `next.config`/`payload.config` changes need a
   restart; the running server shows stale output until then.
4. Redirect uses Next `permanentRedirect` → **HTTP 308** (permanent; SEO-equivalent
   to 301 for GET).


## ✅ Shipped: Admin-customizable SEO landing pages

Rich, marketing-style landing pages (à la morainelakebus.com / Viator tour pages),
fully authored and reordered from the Payload admin panel. One strong, route-centric
SEO page per experience, priced live from that route's fares.

### Live example
- **Page:** `/sunrise-banff-moraine-lake-tour`
- **Admin:** Catalog → Routes → _Sunrise Express_ → **Landing Page** tab

### What it does
- **Pretty top-level URLs** — `/{seoSlug}` (e.g. `/sunrise-banff-moraine-lake-tour`).
  Static segments (`/routes`, `/staff`, `/admin`, …) take precedence; unknown slugs → 404.
- **Block builder** — admins add / remove / drag-reorder content sections per page.
- **11 content blocks:** Highlights, Feature grid ("why choose us"), Includes/Excludes,
  Itinerary, Route map, Gallery, Things to do, Testimonials, FAQ, Rich text, CTA banner.
- **Hero** — image, badge, headline, subheadline, star rating (value/count/source),
  and an auto "from $X" price pulled from the route's cheapest active fare.
- **"Choose your trip"** — every active fare on the route rendered as a bookable
  price card wired to the existing booking modal.
- **SEO** — per-page meta title/description + OG image (with sensible fallbacks),
  canonical URLs, and JSON-LD: `Product` + per-fare `Offer` + `AggregateRating` +
  `FAQPage` (auto-built from the FAQ block).
- **Sitemap** — published landing slugs added at priority 0.9.

### Key files
| Area | Path |
| --- | --- |
| Block definitions | `src/collections/blocks/landing.ts` |
| Collection fields | `src/collections/Routes.ts` (seoSlug + Landing Page tab) |
| Page route | `src/app/(frontend)/[pageSlug]/page.tsx` |
| Render components | `src/components/landing/` |
| Fares-by-route + landing slugs | `src/lib/fares-db.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Sample content seed | `src/seed/landing.ts` + `landing-run.ts` |
| DB migration | `src/migrations/20260607_042848_add_route_landing_content.ts` |

### How to publish a new landing page
1. Admin → **Routes** → pick or create a route.
2. Set a **SEO Slug** (sidebar), e.g. `moraine-lake-shuttle`.
3. Open the **Landing Page** tab → fill Hero + SEO → add/reorder layout blocks.
4. **Publish.** It's live at `/{seoSlug}`, priced from that route's active fares.
5. Re-seed the demo anytime: `pnpm exec tsx --env-file=.env src/seed/landing-run.ts`

## 🛠️ Build / infra notes

- **Production build passes** (`pnpm build` → exit 0).
- **Build blocker fixed (pre-existing):** `/sign-in` and `/sign-up` called
  `useSearchParams()` without a Suspense boundary, which failed static prerender.
  Both now wrap the form in `<Suspense>`.
- **Migration tracking repaired:** the DB schema had been built by Payload _dev push_
  (the `payload_migrations` table only held a `dev` marker). The two prior migrations
  were baselined as applied and the `dev` marker removed, so the new additive migration
  applied cleanly. Going forward, keep `push: false` and use
  `payload migrate:create` + `payload migrate`.

## ⚠️ Known data note

- ~~A fare `banff-canmore` (label "Banff", $64.99) is linked to the `sunrise-express`
  route~~ **Fixed 2026-06-10:** the fare's route link was nulled out; the demo
  `canmore-express` route + fares were hard-deleted from the DB.

## 📋 Pending / next ideas

- [ ] Seed landing content for the **daytime** and **evening** routes.
- [x] 301-redirect old `/routes/[fareSlug]` pages to the pretty landing URLs
      (`permanentRedirect` → 308 when a published landing exists).
- [x] Set `metadataBase` in the root layout (done — driven off `SITE.url`).
- [ ] Replace placeholder testimonials/photos with real assets per route.
- [ ] Consider a global "Policies" FAQ block source so policy answers stay consistent
      across pages (the legacy `src/components/Faq.tsx` still has TODO policy items).
