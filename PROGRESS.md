# RockFlower Travels — Progress Report

_Last updated: 2026-06-07_

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

- A fare `banff-canmore` (label "Banff", $64.99) is linked to the `sunrise-express`
  route in the DB, so it currently shows as a third "Choose your trip" option on the
  demo page. Relink or rename it in admin if unintended.

## 📋 Pending / next ideas

- [ ] Seed landing content for the **daytime** and **evening** routes.
- [ ] Optional: 301-redirect old `/routes/[fareSlug]` pages to the pretty landing URLs.
- [ ] Set `metadataBase` in the root layout (build warns; OG/Twitter image URLs
      currently resolve against `http://localhost:3000`). Drive it off `NEXT_PUBLIC_SITE_URL`.
- [ ] Replace placeholder testimonials/photos with real assets per route.
- [ ] Consider a global "Policies" FAQ block source so policy answers stay consistent
      across pages (the legacy `src/components/Faq.tsx` still has TODO policy items).
