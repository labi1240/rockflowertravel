# RockFlower Travels — Shuttle Booking Engine

## A‑to‑Z Build Specification

> This document is a complete, self‑contained blueprint. A developer or AI with **no prior knowledge** of this codebase should be able to recreate the product — stack, design system, data model, features, flows, and pricing logic — from this file alone.
>
> Product: a daily mountain shuttle service in the Canadian Rockies (Banff ⇄ Lake Louise ⇄ Moraine Lake), with a public marketing/booking site, a Stripe checkout, QR boarding passes, and an admin "Operations Center" for fares, routes, refunds, and seat inventory.

---

## 1. Product Overview

**What it is:** A high‑performance booking engine for a daily shuttle operator ("RockFlower Travels"). Riders browse daily circuits, pick a fare + date + time + passenger count, pay via Stripe (with 5% Alberta GST), and receive a QR boarding pass. Operators manage everything from an admin dashboard.

**Three service tiers (the core domain concept):**

| Tier | Route | Notes |
|------|-------|-------|
| `sunrise` | **Sunrise Express** — Banff → Moraine Lake, 4:30 AM | Premium, isolated inventory, runs apart from standard loops |
| `daytime` | **Daytime Circuit** — Samson Mall → Lake Louise → Moraine Lake → Samson, 5 circuits/day | Standard loop |
| `evening` | **Evening Return** — Lake Louise → Banff, 6:00 PM | Standard one‑way |

**Primary user flow:**
1. Land on home page → see circuits, pricing, schedule, map.
2. Select a fare (route), service date, departure time, passengers (1–8).
3. Enter contact info (guest, or auto‑linked to a signed‑in Clerk user).
4. Server places a **15‑minute seat hold** + creates a Stripe PaymentIntent.
5. Pay with Stripe Elements → booking `CONFIRMED` via webhook.
6. Receive a boarding pass (QR encodes the live booking URL) + save options (PDF / PNG / calendar / Apple Wallet scaffold).

**Operator flow (admin `/admin`):** view KPIs and per‑departure capacity, manage bookings, issue refunds, edit fare pricing + temporary sales, author new routes/schedules/fares, and set seat capacity per departure.

---

## 2. Tech Stack (exact versions)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | `16.2.6` |
| Language | TypeScript | `^5` |
| Runtime/UI | React / React DOM | `19.2.4` |
| Styling | Tailwind CSS | `^4` (`@tailwindcss/postcss@^4`) |
| UI primitives | shadcn/ui (`radix-ui`) | `shadcn@^4.8.0`, `radix-ui@^1.4.3` |
| Animation | `motion` (Framer Motion) | `^12.40.0` |
| Icons | `lucide-react` | `^1.17.0` |
| ORM | Prisma + `@prisma/client` | `^7.8.0` |
| DB driver | `@prisma/adapter-pg` + `pg` | `^7.8.0` / `^8.21.0` |
| Database | PostgreSQL (Neon‑compatible) | — |
| Auth | Clerk (`@clerk/nextjs`) | `^7.4.0` |
| Payments | Stripe (`stripe`, `@stripe/react-stripe-js`, `@stripe/stripe-js`) | `^22.1.1` / `^6.4.0` / `^9.6.0`, **API `2026-04-22.dahlia`** |
| Webhooks verify | `svix` | `^1.94.0` |
| Maps | `mapbox-gl` + `react-map-gl` | `^3.24.0` / `^8.1.1` |
| QR codes | `qrcode.react` | `^4.2.0` |
| Image export | `html-to-image` | `^1.11.13` |
| Validation | `zod` | `^4.4.3` |
| Client state | `zustand` | `^5.0.13` |
| Class utils | `clsx`, `tailwind-merge`, `class-variance-authority` | `^2.1.1` / `^3.6.0` / `^0.7.1` |
| Animations CSS | `tw-animate-css` | `^1.4.0` |
| Package manager | **Bun** | `bun@1.3.13` |
| Hosting | Vercel (cron + env) | — |

**`package.json` scripts:**
```jsonc
"dev":         "next dev",
"build":       "prisma generate && next build",
"start":       "next start",
"lint":        "eslint",
"db:migrate":  "prisma migrate dev",
"db:generate": "prisma generate",
"db:studio":   "prisma studio",
"db:seed":     "tsx --env-file=.env prisma/seed.ts"
```

---

## 3. Configuration & Environment

### Config files
- **`next.config.ts`** — Turbopack root set to `import.meta.dirname`; `allowedDevOrigins: ["10.0.0.59"]`.
- **`tsconfig.json`** — `strict: true`, `moduleResolution: "bundler"`, path alias **`@/* → ./src/*`**, Next plugin.
- **`postcss.config.mjs`** — single plugin `@tailwindcss/postcss`.
- **`eslint.config.mjs`** — `eslint-config-next` core‑web‑vitals + typescript, ignores build output.
- **`components.json`** (shadcn) — style `radix-nova`, `rsc: true`, base color `neutral`, CSS vars on, css at `src/app/globals.css`, icon library `lucide`, aliases `@/components`, `@/lib`, `@/components/ui`, `@/hooks`; extra registry `@magicui → https://magicui.design/r/{name}`.
- **Prisma generator** outputs the client to **`src/generated/prisma`** (not the default `node_modules` location).

### Required environment variables (keys only)
```bash
# Database
DATABASE_URL=

# Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ENDPOINT=

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=

# Email (Resend — used/planned for receipts)
RESEND_API_KEY=

# Admin allowlist (comma-separated emails)
ADMIN_EMAILS=

# Cron auth (Vercel)
CRON_SECRET=

# Feature flag
NEXT_PUBLIC_WALLET_ENABLED=
```

### Deployment notes (Vercel)
- No committed `vercel.json`; project config is dashboard‑managed.
- A **cron** must hit `GET /api/cron/release-holds` every ~5 minutes (authorized via `CRON_SECRET`) to expire stale seat holds.
- Build command runs `prisma generate` before `next build`.

---

## 4. Next.js 16 Conventions (hard rules)

This is **Next.js 16** — several conventions differ from older versions. These are project invariants:

1. **Route protection uses `src/proxy.ts` on the Node.js runtime** — NOT `middleware.ts`, NOT the edge runtime.
2. **All request‑time APIs are async** — `await cookies()`, `await headers()`, `await params`, `await searchParams`. Synchronous access will crash.
3. **Server Components by default.** Push `"use client"` to leaf nodes only (interactive islands: Stripe Elements, Zustand consumers, `motion` animations, map).
4. **Server Actions and API routes are kept strictly separate from client components.**
5. **React Compiler is on** — do not hand‑wrap in `useMemo`/`useCallback` unless a library demands it.
6. Read the bundled docs in `node_modules/next/dist/docs/` before using an unfamiliar API; APIs may differ from training data.

---

## 5. Design System (recreate exactly)

Styling is **Tailwind 4.0 only — no raw CSS files** beyond the token layer. Theme = **warm cream + evergreen + sunrise gold** ("light alpine" aesthetic). All colors are HSL custom properties defined in `src/app/globals.css`.

### 5.1 globals.css header
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

### 5.2 Color ramps (`@theme`)

**Evergreen (primary brand — teal/forest, hue 168):**
```css
--color-evergreen-50:  hsl(168, 30%, 96%);
--color-evergreen-100: hsl(168, 30%, 92%);
--color-evergreen-200: hsl(168, 28%, 82%);
--color-evergreen-300: hsl(168, 32%, 64%);
--color-evergreen-400: hsl(168, 38%, 44%);
--color-evergreen-500: hsl(168, 45%, 30%);
--color-evergreen-600: hsl(168, 50%, 22%);
--color-evergreen-700: hsl(168, 55%, 16%);
--color-evergreen-800: hsl(168, 60%, 11%);
--color-evergreen-900: hsl(168, 65%, 7%);
--color-evergreen-950: hsl(168, 70%, 4%);
```

**Sunrise (accent — warm gold/amber, hue 41→34):**
```css
--color-sunrise-50:  hsl(41, 92%, 96%);
--color-sunrise-100: hsl(41, 88%, 90%);
--color-sunrise-200: hsl(41, 84%, 80%);
--color-sunrise-300: hsl(41, 82%, 68%);
--color-sunrise-400: hsl(41, 80%, 58%);
--color-sunrise-500: hsl(41, 78%, 50%);
--color-sunrise-600: hsl(40, 82%, 42%);
--color-sunrise-700: hsl(38, 80%, 34%);
--color-sunrise-800: hsl(36, 76%, 26%);
--color-sunrise-900: hsl(34, 72%, 18%);
```

**Mist (warm‑tinted neutral / cream, hue 42→24):**
```css
--color-mist-50:  hsl(42, 44%, 97%);
--color-mist-100: hsl(42, 38%, 94%);
--color-mist-200: hsl(40, 28%, 88%);
--color-mist-300: hsl(38, 20%, 79%);
--color-mist-400: hsl(34, 13%, 64%);
--color-mist-500: hsl(30, 10%, 47%);
--color-mist-600: hsl(28, 12%, 36%);
--color-mist-700: hsl(26, 15%, 27%);
--color-mist-800: hsl(24, 19%, 18%);
--color-mist-900: hsl(24, 24%, 12%);
--color-mist-950: hsl(24, 28%, 7%);
```

**Legacy aliases (kept for back‑compat):**
```css
--color-primary:       var(--color-evergreen-700);
--color-primary-light: var(--color-evergreen-600);
--color-primary-dark:  var(--color-evergreen-900);
--color-accent:        var(--color-sunrise-500);
--color-accent-hover:  var(--color-sunrise-600);
--color-accent-light:  var(--color-sunrise-100);
```

### 5.3 Semantic tokens (`:root`)
```css
--bg: var(--color-mist-50);            --text: var(--color-mist-900);
--background: var(--color-mist-50);    --foreground: var(--color-mist-900);
--card: hsl(42, 50%, 99%);             --card-foreground: var(--color-mist-900);
--popover: hsl(42, 50%, 99%);          --popover-foreground: var(--color-mist-900);
--primary: var(--color-evergreen-700); --primary-foreground: var(--color-mist-50);
--secondary: var(--color-mist-100);    --secondary-foreground: var(--color-mist-900);
--muted: var(--color-mist-100);        --muted-foreground: var(--color-mist-500);
--accent: var(--color-sunrise-100);    --accent-foreground: var(--color-sunrise-900);
--destructive: oklch(0.577 0.245 27.325);
--border: var(--color-mist-200);       --input: var(--color-mist-200);
--ring: var(--color-evergreen-600);
--chart-1..5: evergreen-500, sunrise-500, evergreen-300, sunrise-300, mist-400;
--radius: 0.625rem;
/* sidebar tokens mirror the above (cream surface, evergreen primary) */
```
A `.dark` block exists (neutral oklch palette) but the product ships **light‑mode only** — do not add a `prefers-color-scheme: dark` override (a prior commit explicitly removed it).

### 5.4 Typography
Fonts via `next/font/google` in `src/app/layout.tsx`:
- **Display:** `Outfit` (weights 400–800) → `--font-outfit`
- **Body/UI:** `Plus_Jakarta_Sans` (weights 400–700) → `--font-plus-jakarta`
- **Fallback sans:** `Geist` → `--font-sans`

```css
--font-display: var(--font-outfit), system-ui, -apple-system, sans-serif;
--font-sans:    var(--font-plus-jakarta), system-ui, -apple-system, sans-serif;
```
Base: `body { font-family: var(--font-sans); line-height: 1.55; }`, antialiased, `text-rendering: optimizeLegibility`.
Headings (`@layer base`): `font-family: var(--font-display); font-weight: 700; line-height: 1.15; letter-spacing: -0.015em;`.
Body background has two faint radial gradients (evergreen top‑left, sunrise bottom‑right), `background-attachment: fixed`.

### 5.5 Shadows, radii, animations
```css
--shadow-card:         0 1px 2px hsl(24 30% 10% / 0.04), 0 4px 12px hsl(24 30% 10% / 0.06);
--shadow-card-hover:   0 2px 4px hsl(24 30% 10% / 0.05), 0 12px 28px hsl(24 30% 10% / 0.10);
--shadow-elevated:     0 4px 8px hsl(24 30% 10% / 0.08), 0 24px 48px hsl(24 30% 10% / 0.14);
--shadow-glow-sunrise: 0 0 0 1px hsl(41 78% 50% / 0.20), 0 8px 24px hsl(41 78% 40% / 0.25);

/* @theme inline radii, base 0.625rem */
--radius-sm .6×  --radius-md .8×  --radius-lg 1×  --radius-xl 1.4×
--radius-2xl 1.8×  --radius-3xl 2.2×  --radius-4xl 2.6×

--animate-fade-in:    fadeIn 0.4s ease-out forwards;
--animate-pulse-glow: pulseGlow 2s infinite ease-in-out;
--animate-bus-drive:  busDrive 0.6s infinite ease;
```
Keyframes: `fadeIn` (opacity + 8px rise), `pulseGlow` (sunrise ring pulse), `busDrive` (2px bob).

### 5.6 Recurring component class patterns
- **Inputs (admin):** `w-full rounded-lg border border-mist-200 bg-mist-50 px-3 py-2 text-sm text-mist-900 focus:border-evergreen-800/40 focus:outline-none`
- **Field label:** `text-xs font-semibold uppercase tracking-wider text-mist-500`
- **Public inputs:** `rounded-xl border border-mist-200 bg-white px-4 py-3.5 ... focus:border-evergreen-500 focus:ring-2 focus:ring-evergreen-500/25`
- **Primary CTA:** `rounded-xl bg-sunrise-500 px-6 py-4 font-display font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] hover:bg-sunrise-400`
- **Card:** `rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200 hover:shadow-[var(--shadow-card-hover)]` (premium → `ring-sunrise-300`)
- **Eyebrow/badge:** `inline-flex items-center gap-2 rounded-full border border-evergreen-700/20 bg-evergreen-700/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-evergreen-700`
- **Nav CTA:** gradient `from-sunrise-400 to-sunrise-500`, `rounded-full`, glow shadow, `hover:scale-105 active:scale-95`.

**Design conventions:** prefer depth (shadow + subtle bg shift) over borders; minimize labels (value carries meaning); establish hierarchy with weight/contrast before size; icons `h-4 w-4` inline / `h-5 w-5` in buttons; maintain ≥4.5:1 contrast.

---

## 6. Data Model (Prisma)

`datasource db { provider = "postgresql" }`, `generator client { provider = "prisma-client"; output = "../src/generated/prisma" }`.

### Enums
```prisma
enum RouteKind     { SUNRISE_EXPRESS  DAYTIME_CIRCUIT  EVENING_RETURN }
enum BookingStatus { PENDING_PAYMENT  CONFIRMED  CANCELLED  REFUNDED  EXPIRED }
enum PaymentStatus { REQUIRES_PAYMENT PROCESSING SUCCEEDED  FAILED  REFUNDED }
```
> **Fare tiers are free‑form strings** (`'sunrise' | 'daytime' | 'evening'` + admin‑custom), NOT an enum. `RouteKind` is legacy: seeded routes use it; **admin‑authored routes set `kind = null`** and are identified by `slug`.

### Models (purpose → key fields)

**Reference / catalog**
- **`Stop`** — a pickup/dropoff point. `id`, `code @unique` (e.g. `BANFF`, `SAMSON`, `LL_LAKESHORE`, `MORAINE`), `name`, `lat?`, `lng?`, `notes?`.
- **`Route`** — a named service. `id`, `kind RouteKind?`, `slug @unique?`, `tier?`, `displayName`, `isPremium @default(false)`, `description?` → `templates ScheduleTemplate[]`.
- **`ScheduleTemplate`** — one daily departure pattern for a route. `routeId`, `label` (e.g. "Circuit 1 (07:00)"), `sortOrder`, `activeFrom @default(now())`, `activeUntil?` → `legs`, `trips`. Index `[routeId, sortOrder]`.
- **`LegTemplate`** — an ordered segment within a template. `templateId` (cascade), `sequence`, `fromStopId`/`toStopId` (→ `Stop`), `departMin`/`arriveMin` (**minutes from midnight**), `bookable @default(true)` (false = positioning leg, no seats sold), `priceCents` (CAD cents, pre‑GST).
- **`Fare`** — admin‑editable sellable price. **`id` is the PK string slug** (e.g. `banff-ll`). `tier`, `routeKind` (legacy string tag), `routeSlug?` (the `Route.slug` this fare sells), `label`, `short`, `origin`, `destination`, `priceCents`, `tollCents @default(0)` (Moraine toll/passenger), `roundTrip`, `premium`, `defaultTime` (display string e.g. "7:00 AM"), `note?`, `active @default(true)`, **sale fields** `salePriceCents?` `saleStartsAt?` `saleEndsAt?`, `sortOrder`, timestamps. Indexes `[tier, sortOrder]`, `[routeSlug]`.

**Operational instances (materialized per day)**
- **`Vehicle`** — `code @unique` (BUS‑01..04), `seatCapacity @default(25)`, `active`.
- **`Trip`** — a template instance for a `serviceDate @db.Date` (America/Edmonton). `@@unique([templateId, serviceDate])`.
- **`TripLeg`** — live per‑leg inventory. `tripId` (cascade), `legTemplateId`, `departAt`/`arriveAt` (materialized UTC), `seatsTotal @default(25)`, `seatsBooked @default(0)`. `@@unique([tripId, legTemplateId])`.

**Users / bookings / payments**
- **`User`** — `clerkUserId @unique?` (null for guests), `email @unique`, names, `phone?` → `bookings`.
- **`Booking`** — `reference @unique` (e.g. `RF-7K2P9X`), optional `userId` + guest fields, **denormalized snapshots** `routeKind?`/`routeName?`/`routeSlug?`/`serviceDate?`/`departureTime?`, `status @default(PENDING_PAYMENT)`, `holdExpiresAt?` (15‑min hold), `seats @default(1)`, money `subtotalCents`/`gstCents`/`totalCents`/`currency @default("CAD")`, refund audit `refundedAt?`/`refundedBy?`/`refundReason?`, timestamps → `legs`, `payment`. Indexes `[status, holdExpiresAt]`, `[userId, serviceDate]`, `[guestEmail]`.
- **`BookingLeg`** — `bookingId` (cascade), `tripLegId`, `passengers`, `unitPriceCents` (snapshot). `@@unique([bookingId, tripLegId])`.
- **`Payment`** — `bookingId @unique` (cascade), `stripeCheckoutSessionId?@unique`, `stripePaymentIntentId?@unique`, `stripeCustomerId?`, `amountSubtotalCents`/`gstCents`/`amountTotalCents`/`currency`, `status @default(REQUIRES_PAYMENT)`, timestamps.

**Inventory (per‑departure pool — current live model)**
- **`DepartureInventory`** — `routeSlug`, `serviceDate @db.Date`, `departureTime` (string, matches `Booking.departureTime`), `seatsTotal @default(25)`, `seatsBooked @default(0)`. `@@unique([routeSlug, serviceDate, departureTime])`, index `[serviceDate]`. Auto‑provisioned on first booking; admin‑adjustable.

> **Inventory note:** Two inventory models coexist. `Trip`/`TripLeg` is the full materialized model (seeded); the live checkout path uses the simpler **`DepartureInventory`** keyed by `(routeSlug, serviceDate, departureTime)`.

### Prisma client singleton (`src/lib/prisma.ts`)
```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Seed data (`prisma/seed.ts`)
- **Stops (4):** BANFF (51.1784,-115.5708), SAMSON "Samson Mall" (51.4254,-116.1773), LL_LAKESHORE "Lake Louise Lakeshore" (51.4170,-116.2170), MORAINE "Moraine Lake" (51.3217,-116.1860).
- **Routes (3):** `sunrise-express` (SUNRISE_EXPRESS, tier sunrise, premium), `daytime-circuit` (DAYTIME_CIRCUIT, tier daytime), `evening-return` (EVENING_RETURN, tier evening).
- **Schedule templates (7):** Sunrise Express 04:30 (1 bookable leg + 2 positioning); Daytime Circuits 1–5 at 07:00 / 09:00 / 11:00 / 13:30 / 15:30 (each 3 bookable legs Samson→LL→Moraine→Samson); Evening Return 18:00 (1 leg LL→Banff).
- **Vehicles (4):** BUS‑01..04, 25 seats.
- **Leg prices (CAD cents):** Sunrise Banff→Moraine `9998`; Daytime Samson↔LL `6599`, LL→Moraine `8999`; Evening LL→Banff `6599`.
- **Fares (6, upserted):**

| id | tier | routeSlug | label | price¢ | toll¢ | round | premium | default |
|----|------|-----------|-------|-------|------|-------|---------|---------|
| `sunrise-banff-moraine` | sunrise | sunrise-express | Banff → Moraine (Sunrise Express) | 9998 | 0 | – | ✓ | 4:30 AM |
| `sunrise-banff-ll` | sunrise | sunrise-express | Banff → Lake Louise (Sunrise Express) | 7999 | 0 | – | ✓ | 4:30 AM |
| `banff-ll` | daytime | daytime-circuit | Banff → Lake Louise | 6599 | 0 | – | – | 7:00 AM |
| `banff-ll-moraine` | daytime | daytime-circuit | Banff → LL + Moraine | 8999 | 500 | – | – | 7:00 AM |
| `ll-moraine` | daytime | daytime-circuit | LL ⇄ Moraine (round trip) | 8999 | 0 | ✓ | – | 7:00 AM |
| `evening-ll-banff` | evening | evening-return | Lake Louise → Banff (Evening Return) | 6599 | 0 | – | – | 6:00 PM |

---

## 7. Application Structure & Features

### 7.1 Directory map (`src/`)
```
src/
├── app/
│   ├── admin/                 # Operations Center (gated)
│   │   ├── _actions/          # capacity.ts, fares.ts, refunds.ts, routes.ts (server actions)
│   │   ├── _components/       # admin NavBar etc.
│   │   ├── bookings/          # list + [reference] detail (refund)
│   │   ├── capacity/          # CapacityManager
│   │   ├── fares/             # list + [id] pricing/sale editor
│   │   ├── routes/            # list + new/RouteBuilder
│   │   ├── layout.tsx         # requireAdmin() shell
│   │   └── page.tsx           # KPI overview + capacity bars
│   ├── api/
│   │   ├── checkout/create-payment-intent/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── cron/release-holds/route.ts
│   │   └── wallet/apple/[reference]/route.ts   # 501 scaffold
│   ├── my-trips/              # list + [reference] booking detail + ticket
│   ├── sign-in/[[...sign-in]]/ , sign-up/[[...sign-up]]/   # Clerk
│   ├── privacy-policy/
│   ├── globals.css, layout.tsx, page.tsx
│   ├── manifest.ts, robots.ts, sitemap.ts, opengraph-image.tsx   # SEO/PWA
├── components/                # Navbar, Footer, BookingModal, HeroBookingForm,
│   ├── ui/                    #   ScheduleDashboard, ServiceCards, ScheduleInteractive,
│   │   └── map/              #   RouteMapInteractive, ShuttleTracker, SocialProof,
│   │                         #   Faq, FaresProvider, JsonLd, ServiceBookButton
├── lib/                       # admin-auth, edmonton, seo, inventory, fares,
│                              #   fares-db, prisma, stripe, stripe-client, utils, validation
├── store/                     # zustand: booking-modal.ts, filters.ts
├── proxy.ts                   # route protection (Node runtime)
└── generated/prisma/          # generated client (do not edit)
```

### 7.2 Public pages
- **`/`** — marketing + booking entry: Hero + `HeroBookingForm`, `ShuttleTracker`, `SocialProof`, `ScheduleDashboard` (`ServiceCards` + price cards + `ScheduleInteractive`), `RouteMapInteractive`, `Faq`. JSON‑LD injected.
- **`/my-trips`** — signed‑in user's bookings (upcoming/past split).
- **`/my-trips/[reference]`** — booking detail: trip info, contact, receipt, **boarding pass QR**.
- **`/privacy-policy`**, **`/sign-in`**, **`/sign-up`**.

### 7.3 Key components (one‑liners)
- **`FaresProvider`** — client context holding `FareDTO[]` + `nowMs`; memoizes `byTier`, `tierFrom` (min price/tier), `tierDefault` (first fare/tier), `getFare`.
- **`BookingModal`** — 4‑step checkout (route → contact → payment → confirmation), Stripe Elements, boarding‑pass generator (QR + save actions).
- **`HeroBookingForm`** — quick‑book entry in the hero.
- **`ScheduleDashboard` / `ServiceCards` / `ScheduleInteractive`** — pricing + schedule UI (⚠️ currently **hardcoded** to the 3 seed tiers; see §10).
- **`RouteMapInteractive`** — Mapbox stops/routes.
- **`Navbar` / `Footer` / `Faq` / `SocialProof` / `JsonLd`**.

> ⚠️ The home page is currently **hardcoded to the 3 seeded tiers** (specific fare IDs `banff-ll`, `ll-moraine`, `sunrise-banff-ll`, and `SERVICE_META` for sunrise/daytime/evening). Admin‑created routes are saved and sellable but **do not auto‑appear on the home page** without converting these components to be data‑driven over `Route`/`Fare`.

---

## 8. Booking & Checkout Flow

1. **Select** (BookingModal step 1) — fare (from `FaresProvider`), date, time, passengers (1–8).
2. **Contact** (step 2) — name/email/phone; guest or Clerk‑linked.
3. **Hold + intent** — `POST /api/checkout/create-payment-intent`:
   - Validate (fare exists & `active`, date/time, 1–8 pax) with Zod.
   - **Server‑authoritative pricing** — read `Fare` from DB, apply active sale, compute quote (below).
   - **Atomic seat reservation** against `DepartureInventory` (oversell‑safe, §9).
   - Create `Booking` (`PENDING_PAYMENT`, `holdExpiresAt` ~15 min) + `Payment` (`REQUIRES_PAYMENT`).
   - `stripe.paymentIntents.create()` → return `clientSecret`, `bookingId`, `reference`, `holdExpiresAt`.
4. **Pay** (step 3) — Stripe `PaymentElement`, `stripe.confirmPayment()` with `return_url` + `receipt_email`.
5. **Confirm** (step 4 + webhook) — boarding pass: header (name/route) → perforation → stub (reference, total, **QR = absolute URL `/my-trips/{reference}`**). Actions: add‑to‑calendar (ICS), Save PDF, Save PNG (`html-to-image`), Copy link, Apple Wallet (flagged by `NEXT_PUBLIC_WALLET_ENABLED`).

**Pricing & GST (`src/lib/fares.ts → quote()`):**
```ts
const onSale         = isSaleActive(fare, nowMs);          // now ∈ [saleStartsAt, saleEndsAt]
const unitPriceCents = onSale ? fare.salePriceCents : fare.priceCents;
const fareCents      = unitPriceCents * passengers;
const tollCents      = fare.tollCents  * passengers;        // Moraine toll/passenger
const subtotalCents  = fareCents + tollCents;
const gstCents       = Math.round(subtotalCents * 0.05);    // 5% Alberta GST
const totalCents     = subtotalCents + gstCents;
```

---

## 9. Seat Inventory & Concurrency

**Atomic reservation** (`src/lib/inventory.ts → reserveDepartureSeats`) — a single guarded UPDATE; Postgres row‑locks serialize concurrent requests so the seat pool can never oversell:
```sql
UPDATE "DepartureInventory"
SET "seatsBooked" = "seatsBooked" + $N, "updatedAt" = now()
WHERE "routeSlug" = $slug AND "serviceDate" = $date AND "departureTime" = $time
  AND "seatsBooked" + $N <= "seatsTotal";
-- affected rows: 1 = reserved, 0 = sold out
```
- **Auto‑provision:** first booking on a departure inserts an inventory row at `DEFAULT_DEPARTURE_SEATS` (25).
- **Hold expiry** (`releaseExpiredHolds(scope?)`): finds `PENDING_PAYMENT` with `holdExpiresAt < now()`, flips to `EXPIRED`, releases seats. Called with a scope at checkout, and globally by the **5‑min cron** `GET /api/cron/release-holds`.
- **Refund release:** Stripe `charge.refunded` webhook releases seats back.

---

## 10. Admin "Operations Center" (`/admin`)

Gated by `src/lib/admin-auth.ts`: `getAdminIdentity()` reads Clerk `currentUser()` and allows if role `admin` **or** email ∈ `ADMIN_EMAILS`; `requireAdmin()` redirects non‑admins to `/` and wraps the admin layout.

- **Overview (`/admin`)** — KPI cards (bookings today, revenue today (confirmed), seats sold/capacity, top route) + per‑departure capacity bars (green/amber/red by % full).
- **Bookings (`/admin/bookings` + `[reference]`)** — filter by date/route/status (search params); detail shows payment breakdown + refund audit trail; **refund button** → `refundBooking()` action → `stripe.refunds.create()` (idempotency key) → writes `refundedAt/By/Reason`; webhook finalizes `REFUNDED`.
- **Fares (`/admin/fares` + `[id]`)** — table (price w/ strikethrough on sale, toll, sale status); editor updates base price/toll and sets/clears a **temporary sale** (sale price + start/end, validated < base); `setFareActive()` toggles visibility.
- **Routes (`/admin/routes` + `/new`)** — `RouteBuilder` (client) authors: route basics (slug, display name, tier, premium, description) → schedule label + legs (from/to stops, depart/arrive times, bookable, leg price) → bookable fares (id, label, short, origin, destination, price, toll, round‑trip, premium, default time, note). `createRouteWithSchedule()` validates everything and writes **Route + ScheduleTemplate + LegTemplate[] + Fare[]** in one transaction (`kind = null`, fares tagged with `routeSlug = slug`).
- **Capacity (`/admin/capacity`)** — `CapacityManager` sets `seatsTotal` per departure; guarded so capacity can't drop below `seatsBooked`.

**Server actions (`src/app/admin/_actions/`):** `routes.ts` (`createStop`, `createRouteWithSchedule`), `fares.ts` (`updateFarePricing`, `setFareSale`, `setFareActive`), `refunds.ts` (`refundBooking`), `capacity.ts` (`setDepartureCapacity`). Every action re‑checks admin identity first.

---

## 11. Stripe Integration

- **Client:** `src/lib/stripe.ts` lazy singleton, **API version `2026-04-22.dahlia`**; `src/lib/stripe-client.ts` loads Stripe.js for browser Elements.
- **Create intent:** `paymentIntents.create({ amount: totalCents, currency: 'cad', automatic_payment_methods, metadata: { bookingId, reference, route, date, time, passengers } })`.
- **Webhook (`/api/webhooks/stripe`)** — signature‑verified; handles:
  - `payment_intent.succeeded` → booking `CONFIRMED`, clear `holdExpiresAt`, payment `SUCCEEDED`.
  - `payment_intent.payment_failed` → payment `FAILED` (hold stays).
  - `charge.refunded` → booking `REFUNDED`, payment `REFUNDED`, release seats.

---

## 12. Auth (Clerk)

- `ClerkProvider` wraps the root layout; `/sign-in` + `/sign-up` are catch‑all Clerk pages.
- Route protection in **`src/proxy.ts`** (Node runtime).
- At checkout, if a Clerk session exists, upsert a `User` (`clerkUserId`, email, name, phone) and link the booking; otherwise it's a guest booking (`userId = null`) reclaimable by email.

---

## 13. SEO & PWA
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, dynamic `app/opengraph-image.tsx` (1200×630).
- `components/JsonLd.tsx` + `lib/seo.ts` emit Organization / Website / FAQ structured data.

---

## 14. Rebuild Checklist (A → Z)

1. `bun init` a **Next.js 16** TS app; set package manager to `bun@1.3.13`.
2. Install the exact dependencies from §2.
3. Add config files from §3 (note path alias `@/* → src/*`, Prisma output `src/generated/prisma`, shadcn `radix-nova`/neutral).
4. Drop in `src/app/globals.css` with the full token system from §5.
5. Wire fonts (Outfit + Plus Jakarta + Geist) in `layout.tsx`; light mode only.
6. Create `prisma/schema.prisma` (§6) → `prisma generate` → migrate against a Postgres DB.
7. Write `prisma/seed.ts` with the stops/routes/templates/vehicles/fares from §6 → `bun run db:seed`.
8. Add `src/lib/prisma.ts` singleton (PrismaPg adapter).
9. Build `lib/fares.ts` (quote + sale logic, 5% GST), `lib/fares-db.ts`, `lib/inventory.ts` (atomic reserve/release), `lib/edmonton.ts` (TZ), `lib/validation.ts` (Zod), `lib/stripe.ts` (API `2026-04-22.dahlia`).
10. Integrate Clerk: `ClerkProvider`, sign‑in/up pages, `src/proxy.ts`, `lib/admin-auth.ts`.
11. Build public pages + components (§7), then `BookingModal` checkout (§8).
12. Implement API routes: `create-payment-intent`, `webhooks/stripe`, `cron/release-holds`.
13. Build the admin Operations Center + four server-action modules (§10).
14. Configure Stripe webhook + Vercel cron (5 min) + all env vars (§3).
15. `bun run build` must pass with **zero type errors**; verify the full booking flow end‑to‑end.

---

## 15. ⚠️ Known gaps / cleanups (don't replicate blindly)

- **`context/project-overview.md` is stale** — it describes a leftover template product ("Ammo Terminal", an ammo aggregator) and does **not** match this shuttle app. Treat **this file** as the source of truth and rewrite that overview.
- **Home page is hardcoded** to the 3 seed tiers/fare IDs; admin‑authored routes don't surface publicly until those components are made data‑driven over `Route`/`Fare`.
- **Two inventory models coexist** (`Trip`/`TripLeg` materialized vs. `DepartureInventory` live). Checkout uses `DepartureInventory`; consolidate eventually.
- **Apple Wallet** route is a 501 scaffold (needs `passkit-generator`).
- Some context docs reference TanStack Query/Zustand for data; in practice server data flows through Server Components + `FaresProvider`, and Zustand is used for the booking modal UI state.
```

