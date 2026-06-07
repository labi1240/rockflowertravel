// ─────────────────────────────────────────────────────────────────────────────
//  Central SEO configuration + structured-data builders.
//
//  Single source of truth for site identity (name, URL, description, keywords)
//  and JSON-LD graph nodes. Page/layout files import from here so canonical
//  URLs, Open Graph data, and schema.org markup never drift apart.
//
//  Base URL resolves from NEXT_PUBLIC_SITE_URL (set per-environment on Vercel)
//  and falls back to the production domain so local builds still emit valid
//  absolute URLs for Open Graph / canonical tags.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE = {
  name: "RockFlower Travels",
  legalName: "RockFlower Travels Inc.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rockflowertravels.ca").replace(/\/$/, ""),
  shortDescription:
    "Premium daily shuttle service connecting Banff, Lake Louise, and Moraine Lake.",
  description:
    "Book premium daily shuttle services between Banff, Lake Louise Village (Samson Mall), Lake Louise Lakeshore, and Moraine Lake. Reserve the 4:30 AM Sunrise Express or a Daytime Circuit seat in seconds.",
  email: "info@rockflowertravels.ca",
  locale: "en_CA",
  twitter: "@rockflowertravels",
  keywords: [
    "Banff shuttle",
    "Lake Louise shuttle",
    "Moraine Lake shuttle",
    "Moraine Lake bus",
    "Lake Louise bus",
    "Banff to Lake Louise shuttle",
    "Banff to Moraine Lake",
    "Sunrise Express shuttle",
    "Lake Louise Village shuttle",
    "Samson Mall shuttle",
    "Banff National Park transportation",
    "Moraine Lake access",
    "Lake Louise lakeshore shuttle",
  ],
} as const;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE.url).toString();
}

// ─── Structured data (schema.org JSON-LD) ────────────────────────────────────

const LOGO_URL = absoluteUrl("/main_logo.png");

/**
 * Primary business entity. Modelled as a TravelAgency (a LocalBusiness
 * subtype) — the closest schema.org type for a shuttle operator. The stable
 * `@id` lets other nodes reference it (e.g. WebSite.publisher).
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE.url,
  logo: LOGO_URL,
  image: LOGO_URL,
  email: SITE.email,
  description: SITE.shortDescription,
  priceRange: "$$",
  areaServed: [
    { "@type": "Place", name: "Banff, Alberta, Canada" },
    { "@type": "Place", name: "Lake Louise, Alberta, Canada" },
    { "@type": "Place", name: "Moraine Lake, Alberta, Canada" },
    { "@type": "Place", name: "Banff National Park, Alberta, Canada" },
  ],
  knowsAbout: [
    "Banff to Lake Louise shuttle",
    "Moraine Lake shuttle access",
    "Sunrise Express premium departures",
  ],
} as const;

/** WebSite node — ties the domain to the publishing organization. */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  description: SITE.shortDescription,
  inLanguage: "en-CA",
  publisher: { "@id": `${SITE.url}/#organization` },
} as const;

/**
 * FAQPage built ONLY from confirmed answers in src/components/Faq.tsx
 * (Booking & pricing, Schedule, Pickup & logistics). The six "Policy pending"
 * placeholder questions are intentionally excluded — shipping them as schema
 * would let Google index placeholder text. Keep this list in sync with the
 * non-`todo` FaqItems when answers change.
 */
const FAQ_ENTRIES: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "How much does the shuttle cost?",
    a: "Prices are per seat in CAD: Banff to Lake Louise is $65.99 (daytime); Banff to Lake Louise + Moraine Lake is $89.99 plus a $5 Moraine Lake toll per guest; Lake Louise to Moraine Lake round trip is $89.99; Sunrise Express Banff to Lake Louise is $79.99; and Sunrise Express Banff to Moraine Lake is $99.98. 5% GST is added at checkout on the fare plus any toll.",
  },
  {
    q: "Is the Lake Louise to Moraine Lake ticket round trip?",
    a: "Yes. The Lake Louise to Moraine Lake direct shuttle is $89.99 CAD and a single ticket covers both directions — Lake Louise to Moraine and back. You do not need to buy a separate return.",
  },
  {
    q: "What's the $5 toll on the Both Lakes route?",
    a: "The Banff to Lake Louise + Moraine Lake fare ($89.99) includes a $5.00 Moraine Lake toll per guest, charged because Moraine Lake access is restricted. The toll is added to your fare and 5% GST is applied to the combined total at checkout.",
  },
  {
    q: "Why does the price change depending on where I go?",
    a: "Each route is priced separately. A short Banff to Lake Louise hop ($65.99) costs less than visiting both lakes ($89.99 plus toll) or a premium Sunrise Express departure ($79.99–$99.98). The exact price for your selection is shown live in the booking window before you pay.",
  },
  {
    q: "What time is the first shuttle of the day?",
    a: "The premium Sunrise Express departs Banff at 4:30 AM and arrives at Moraine Lake at 6:00 AM. The first Daytime Circuit leaves Samson Mall (Lake Louise Village) at 7:00 AM.",
  },
  {
    q: "What time is the last shuttle back to Banff?",
    a: "The Evening Return departs Lake Louise Lakeshore at 6:00 PM and arrives in Banff at approximately 7:15 PM.",
  },
  {
    q: "How long does a full Daytime Circuit take?",
    a: "About 1 hour 50 minutes for a full loop: Samson Mall → Lake Louise Lakeshore → Moraine Lake → back to Samson Mall. Five circuits run daily, starting at 7:00, 9:00, 11:00, 1:30 PM, and 3:30 PM from Samson Mall.",
  },
  {
    q: "Do the 6:10 AM and 6:35 AM Sunrise legs sell seats?",
    a: "No. Those are internal repositioning legs — the bus moves from Moraine Lake to Lake Louise Lakeshore and then to Samson Mall to start the Daytime Circuit. Only the 4:30 AM Banff to Moraine Lake leg is customer-bookable.",
  },
  {
    q: "Where do I get picked up?",
    a: "Samson Mall in Lake Louise Village is the main pickup point for the Daytime Circuit — it has food, retail, and restrooms while you wait. Lake Louise Lakeshore and Moraine Lake use designated loading areas; follow staff direction at the stop.",
  },
  {
    q: "How early should I arrive?",
    a: "Arrive 10 minutes before your scheduled departure. Buses leave on time — late arrivals will miss the shuttle.",
  },
  {
    q: "Can I visit both lakes in a single trip?",
    a: "Yes. The Banff to Lake Louise + Moraine Lake fare ($89.99, plus the $5 Moraine Lake toll) is priced exactly for this — one ticket takes you to both shores in a single day.",
  },
];

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE.url}/#faq`,
  mainEntity: FAQ_ENTRIES.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
} as const;
