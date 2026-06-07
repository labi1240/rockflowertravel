# RockFlower Travels — Payload CMS Rebuild Plan

> Rebuild the live Next.js + Prisma + Clerk + custom-admin shuttle booking engine
> (`rockflowertravels.ca`, fully specced in `PROJECT_SPEC.md`) on **Payload CMS 3.85**,
> so operators manage everything through Payload's native admin instead of a hand-built
> Operations Center.
>
> **Locked decisions:**
> 1. **Auth** — all-in on Payload auth. Drop Clerk. Staff + customers live in Payload auth collections.
> 2. **Data** — fresh database. Re-seed the catalog, build everything, then migrate live bookings/users via a script before cutover.
> 3. This document is the plan; implementation follows after review.

---

## 0. Current state (what's already here)

- Fresh **Payload 3.85** blank template: Next.js `16.2.6`, React `19.2.6`, `@payloadcms/db-postgres`.
- Collections: only `Users` (auth) + `Media` (upload).
- `src/payload.config.ts` wired to Postgres via `DATABASE_URL`, Lexical editor, type output to `src/payload-types.ts`.
- Route groups exist: `src/app/(frontend)` (public) and `src/app/(payload)` (admin).
- Package manager: **pnpm** (lockfile present). Env: `DATABASE_URL`, `PAYLOAD_SECRET`.
- No Tailwind/shadcn, no Stripe, no domain collections yet.

## What we are deliberately consolidating (improvements over the old app)

The old app accreted cruft across Phases 1–4. We fix it at the schema level now:

- **Drop `Trip` / `TripLeg` / `BookingLeg` entirely.** The spec confirms `DepartureInventory` superseded them and checkout never created `BookingLeg`. We standardize on per-departure inventory (`route + serviceDate + departureTime`).
- **Routes/fares become real content** read via the Local API → admin-authored routes auto-surface on the home page (fixes the "home page hardcoded to 3 seed tiers" gap).
- **One source of truth.** Collection config replaces the Prisma schema **and** the hand-built admin UI **and** the server actions — three things collapse into one.
- **Versioning/drafts** on Routes & Fares (publish workflow) — free in Payload.
- **db-push drift** from the old project is gone — we start clean with proper Payload migrations.

---

## 1. Data model → Payload collections

Mapping from the Prisma models in `PROJECT_SPEC.md §6`. Each collection auto-generates a full admin UI (list, filters, edit form, access control) — this is what replaces the entire Operations Center.

### Auth collections
- **`users`** (staff/operators) — Payload admin users. `auth: true`. Fields: `name`, `roles` (`select`, multi: `admin` | `operator`, `saveToJWT: true`). `admin.user` points here. Replaces `ADMIN_EMAILS` + Clerk role gating.
- **`customers`** (riders) — second auth collection. `auth: true`. Fields: `name`, `phone`. Bookings relate here. (Separate from staff so 10k+ customers don't clutter staff login and access rules differ.)

### Catalog / reference
- **`stops`** — `code` (unique, indexed), `name`, `location` (`point` — geolocation), `notes`. *(Postgres supports point fields; SQLite would not.)*
- **`routes`** — `slug` (unique, indexed), `tier` (text), `displayName`, `isPremium` (checkbox), `description` (richText), `kind` (optional select, legacy). **Versions + drafts on.**
- **`schedule-templates`** — `route` (relationship→routes), `label`, `sortOrder`, `activeFrom`, `activeUntil`, and `legs` as an **array field** (`sequence`, `fromStop`/`toStop` rels, `departMin`/`arriveMin`, `bookable`, `priceCents`). Legs are descriptive now (inventory is departure-based), so an array beats a separate collection.
- **`fares`** — the sellable products. `id`/`slug` stable string, `tier`, `route` (rel→routes), `label`, `short`, `origin`, `destination`, `priceCents`, `tollCents`, `roundTrip`, `premium`, `defaultTime`, `note`, `active`, a **`sale` group** (`salePriceCents`, `saleStartsAt`, `saleEndsAt`), `sortOrder`. Indexes on `[tier, sortOrder]` and `route`.
- **`vehicles`** — `code` (unique), `seatCapacity` (default 25), `active`.

### Operational
- **`departure-inventory`** — `route` (rel) + `routeSlug` (snapshot for fast keying), `serviceDate` (date), `departureTime` (text), `seatsTotal` (default 25), `seatsBooked` (default 0). Composite unique index on `[routeSlug, serviceDate, departureTime]`. Admin-editable capacity (guarded ≥ `seatsBooked`).
- **`bookings`** — `reference` (unique, e.g. `RF-7K2P9X`), `customer` (rel, optional) + guest fields, route snapshots (`routeName`/`routeSlug`/`serviceDate`/`departureTime`), `status` (select: `PENDING_PAYMENT|CONFIRMED|CANCELLED|REFUNDED|EXPIRED`), `holdExpiresAt`, `seats`, money group (`subtotalCents`/`gstCents`/`totalCents`/`currency`), refund-audit group (`refundedAt`/`refundedBy`/`refundReason`), `payment` (rel). Indexes on `[status, holdExpiresAt]`, `[customer, serviceDate]`, `guestEmail`.
- **`payments`** — `booking` (rel, unique), `stripePaymentIntentId`/`stripeCheckoutSessionId`/`stripeCustomerId`, amount fields, `status` (select).

### Access control (per collection)
- Staff (`admin`/`operator`) — full read/write on operational collections.
- `customers` — read **own** bookings only (row-level: `{ customer: { equals: user.id } }`).
- `routes`/`fares`/`stops` — public read (frontend), staff write.
- **Remember:** Local API bypasses access control unless `overrideAccess: false` — enforce it on any customer-facing query (SKILL.md §Security Pitfall #1).

---

## 2. The custom logic Payload does *not* give us for free

These are ported from the old `src/lib` + API routes. Payload runs inside the same Next app, so route handlers and custom endpoints coexist cleanly.

### 2a. Pricing & GST — `src/lib/fares.ts` (pure)
Port `quote(fare, passengers, nowMs)`: sale-aware unit price → fare×pax + toll×pax → 5% Alberta GST on the subtotal → total. Used both server-side (checkout, authoritative) and client-side (display). Pure, no Payload dependency.

### 2b. Atomic seat reservation — **the one genuinely hard part**
Payload's Local API can't express the oversell-safe guard. We use raw SQL through the Postgres pool / Drizzle inside a custom endpoint:
```sql
UPDATE "departure_inventory"
SET "seatsBooked" = "seatsBooked" + $n
WHERE "routeSlug" = $slug AND "serviceDate" = $date AND "departureTime" = $time
  AND "seatsBooked" + $n <= "seatsTotal";
-- 1 row affected = reserved; 0 = sold out
```
Auto-provision the row at 25 on first booking. Postgres row locks serialize concurrent requests. Wrap reservation + `payload.create(booking)` + `payload.create(payment)` in a **single transaction** (thread `req` through — SKILL.md §Pitfall #2).

### 2c. Checkout endpoint — `POST /api/checkout/create-payment-intent`
Validate (zod) → `getFare` (reject inactive) → `quote` → sweep that departure's expired holds → atomic reserve (409 if sold out) → create `booking` (PENDING, 15-min hold) + `payment` → `stripe.paymentIntents.create` (API `2026-04-22.dahlia`) → return `clientSecret`, `reference`, `holdExpiresAt`.

### 2d. Stripe webhook — `POST /api/webhooks/stripe`
Signature-verified. `payment_intent.succeeded` → booking `CONFIRMED`, clear hold, payment `SUCCEEDED`. `payment_intent.payment_failed` → payment `FAILED`. `charge.refunded` → booking `REFUNDED` + release seats (idempotent).

### 2e. Hold-release cron — `GET /api/cron/release-holds`
`CRON_SECRET`-guarded (timing-safe). Find `PENDING_PAYMENT` past `holdExpiresAt` → `EXPIRED` + release seats. **Add the Vercel cron entry** (`*/5 * * * *`) the old app never committed.

### 2f. Refunds in admin
Replace the bespoke refund page with a **custom admin action/button** on the `bookings` edit view (or a server endpoint) that calls `stripe.refunds.create({ payment_intent, idempotencyKey: 'refund_'+pi })` and writes audit fields; the webhook remains the single writer of `REFUNDED` status.

### 2g. Boarding pass + extras
QR (`qrcode.react`, encodes absolute `/my-trips/{reference}`), PNG/PDF via `html-to-image`, ICS calendar (embedded America/Edmonton VTIMEZONE), Apple Wallet behind `NEXT_PUBLIC_WALLET_ENABLED` (501 scaffold). Resend for receipt emails (Payload email adapter).

---

## 3. Public frontend — `src/app/(frontend)`

- **Design system:** add **Tailwind 4 + shadcn** scoped to the frontend group (Payload admin keeps its own styling). Port `globals.css` token system (evergreen/sunrise/mist ramps), Outfit + Plus Jakarta fonts. Light mode only.
- **Pages:** `/` (Hero + booking form, ServiceCards, ScheduleDashboard, RouteMap, FAQ, SocialProof), `/my-trips` + `/my-trips/[reference]`, `/privacy-policy`, auth pages (now Payload-backed).
- **Data:** components read collections via `getPayload({ config })` Local API in Server Components — **data-driven**, so admin routes/fares appear automatically.
- **Booking modal:** 4-step (route → contact → payment → confirmation) with Stripe Elements + boarding pass.
- **SEO/PWA:** `robots.ts`, `sitemap.ts`, `manifest.ts`, `opengraph-image.tsx`, JSON-LD (TravelAgency/Website/FAQ from confirmed answers only).

> **Efficiency flag:** most `(frontend)` components and `globals.css` already exist in the live Next.js repo. **Copying them in and rewiring data access to the Local API is far cheaper than rebuilding from the spec.** I'll need read access to the old repo's `src/` — confirm whether that source is available locally.

---

## 4. Data migration (run before cutover, not during build)

1. **Catalog** — re-seed `stops`, `routes`, `schedule-templates`, `fares`, `vehicles` from `PROJECT_SPEC.md §6` via a Payload seed script (`payload.create`). Price-neutral, matches old seed.
2. **Customers** — export Clerk users (Clerk Backend API) → create Payload `customers`. Password hashes can't transfer → trigger a **password-reset / set-password email** on first login.
3. **Bookings/payments** — script reads the live Postgres (old Prisma tables) and re-creates `bookings` + `payments` in Payload, mapping snapshots and statuses. Preserve `reference` values so existing QR/boarding-pass URLs keep working.
4. **Verify** — row counts, money totals, a sample of QR URLs resolve, refund audit fields intact.

---

## 5. Phasing & sequencing

| Phase | Deliverable | Outcome |
|---|---|---|
| **0** | Repo prep: Tailwind 4 + shadcn in `(frontend)`, install Stripe/zod/qrcode/etc., env keys, confirm old-source access | Foundations ready |
| **1** | **All domain collections + access control + seed** | Full admin dashboard live — replaces the entire Operations Center |
| **2** | Public frontend (marketing + catalog, data-driven) | Site renders from Payload data |
| **3** | Checkout: pricing lib, atomic reservation endpoint, Stripe intent, webhook, hold-release cron | End-to-end booking + payment |
| **4** | Boarding pass (QR/PDF/ICS), refunds-in-admin, SEO/PWA, Mapbox, Resend emails | Feature parity |
| **5** | Migration scripts (catalog → customers → bookings) + cutover | Live launch on Payload |

Each phase ends with `pnpm generate:types` + `tsc` clean + a verified happy path. We read the relevant `reference/*.md` (ACCESS-CONTROL, HOOKS, ADAPTERS, QUERIES, ENDPOINTS) before writing each phase's code.

---

## 6. Open items to confirm before Phase 1

- **Old frontend source** — is the live repo's `src/` available locally to copy components + `globals.css`? (Big time saver vs rebuilding from spec.)
- **Database** — provision a **fresh** Neon/Postgres for the rebuild (separate from the live one) so the live site keeps running during the build. Confirm we create a new DB rather than touching the current one.
- **Stripe** — reuse the existing Stripe account + test keys (webhook secret will differ per env).
- **Resend / Mapbox / domain** — reuse existing keys; set `NEXT_PUBLIC_SITE_URL` per env on cutover.

---

## ✅ Build Status (as of this session)

**Database:** fresh Neon project `autumn-bar-83570749` (rockflowertravels), schema via committed migration `src/migrations/20260607_004841_initial.ts`. Dev push disabled (`push: false`) → drift-free.

**Done & verified live (dev server):**
- **Phase 1 — data model + admin.** 11 collections (`users`, `customers`, `stops`, `routes`, `schedule-templates`, `fares`, `vehicles`, `departure-inventory`, `bookings`, `payments`, `media`) with role-based access control. Admin panel loads (HTTP 200). Trip/TripLeg/BookingLeg dropped (consolidated on DepartureInventory). Routes/Fares have drafts+versions.
- **Phase 1b — libs + seed.** `lib/fares.ts` (pure), `lib/edmonton.ts`, `lib/inventory.ts` (Payload-backed atomic reserve via raw pg pool), `lib/fares-db.ts`, `lib/payload.ts`. Seed (`src/seed/`, `pnpm seed`) populated 4 stops / 3 routes / 7 templates / 19 legs / 6 fares / 4 vehicles + admin user (`lovepreetgill1238@gmail.com` / `ChangeMe!2026`).
- **Phase 0 — deps.** stripe@22.1.1 (apiVersion `2026-04-22.dahlia`), zod, resend, @stripe/*, qrcode.react, html-to-image, mapbox-gl, react-map-gl, motion, lucide-react, zustand, tailwindcss v4.
- **Phase 3 — checkout backend.** `POST /checkout/create-payment-intent` (verified: booking #+payment+Stripe intent, GST correct, **oversell returns 409**), `POST /webhooks/stripe`. Hosted at top-level paths to avoid Payload's `/api/[...slug]` catch-all.
- **Hold expiry — no cron (Vercel Hobby).** Expired 15-min holds are swept **lazily at checkout**: `releaseExpiredHolds()` runs scoped to the target departure before each reservation, so stale holds are reclaimed the moment anyone re-books that departure. Oversell is prevented independently by the atomic guard, so no scheduler is required. `GET /cron/release-holds` (CRON_SECRET-guarded) remains available for optional manual/external triggering; `vercel.json` cron removed.
- **Phase 2 — public frontend.** Home page renders (HTTP 200) **fully data-driven from Payload fares** (fixes the hardcoded-home gap). BookingModal + Stripe Elements → `/checkout`. Navbar (Clerk removed). All marketing components, `globals.css` design system, fonts. SEO routes (`robots`/`sitemap`/`manifest`/`opengraph-image`) + privacy-policy all 200.
- **Phase 4 (partial).** Boarding pass (real QR + PDF/PNG/ICS) shipped inside BookingModal.

- **Customer accounts (DONE, verified E2E).** Payload `customers` auth: `/sign-in` + `/sign-up` pages (call `/api/customers/login` + create), `lib/customer-auth.ts` (`getCurrentCustomer` via `payload.auth`), `/my-trips` list (gated → redirects guests to sign-in) + `/my-trips/[reference]` detail with boarding-pass QR + guest-email reclaim, auth-aware Navbar (`AccountNav`: Sign in/up ↔ My Trips/Sign out). Verified: signup→login→authenticated booking links to `customer_id`→appears in my-trips (HTTP 200); no-cookie my-trips → 307 to sign-in.

- **Admin one-click Stripe refund (DONE).** Staff-gated `POST /staff/refund` (verifies admin/operator, guards CONFIRMED + SUCCEEDED payment, `stripe.refunds.create` with idempotency key, writes audit fields — webhook finalizes REFUNDED). Custom admin sidebar component `RefundButton` on the Bookings edit view (registered in importMap). Unauthenticated call → 401 verified. Full Stripe round-trip needs `stripe listen` + a captured payment.
- **Phase 5 migration script (DONE — verified dry-run).** `src/migrate-legacy/run.ts` (`pnpm migrate:legacy`, dry-run default, `--write` to persist). Reads legacy Prisma Postgres (`LEGACY_DATABASE_URL`) → creates Payload `customers`/`bookings`/`payments`, idempotent by email/reference, customers get a random password (reset on first login). **Dry-run against the live legacy DB read 2 users / 64 bookings / 64 payments cleanly.** Run `--write` against the production Payload `DATABASE_URL` at cutover.

**Remaining (operational / optional):**
1. **Cutover** — run `pnpm migrate:legacy --write` against the production DB, set `NEXT_PUBLIC_SITE_URL` + production Stripe webhook secret, deploy. (No cron needed on Hobby — holds expire lazily at checkout.)
2. **Stripe E2E** — `stripe listen --forward-to localhost:3000/webhooks/stripe` to exercise succeeded/refunded webhooks locally.
3. Apple Wallet 501 scaffold (behind `NEXT_PUBLIC_WALLET_ENABLED`) — not yet ported.

## 7. Key risks & how we handle them

- **Seat concurrency** — only the raw-SQL reservation path is delicate; ported verbatim from the proven old logic + tested with a parallel-request check.
- **Auth cutover** — no password migration from Clerk; customers reset on first login (communicate this).
- **Two auth collections** — `users` (staff) vs `customers`; admin gating via `roles`, frontend via the `customers` collection.
- **Transactions/hooks** — always thread `req`; use `req.context` flags to avoid hook loops (SKILL.md pitfalls #2/#3).
- **Live continuity** — build on a fresh DB; the current site stays up until migration + cutover.
