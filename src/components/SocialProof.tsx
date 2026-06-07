// ─────────────────────────────────────────────────────────────────────────────
//  ⚠️  PLACEHOLDER SOCIAL PROOF — REPLACE BEFORE LAUNCH
//
//  The ratings, review counts, and testimonials below are illustrative
//  placeholders chosen by the user for design preview only. Shipping these
//  to production unchanged would be misleading advertising. Replace each
//  constant in the PLACEHOLDER_* blocks with verified data before launch:
//
//    • PLACEHOLDER_BADGES   → real Google / Tripadvisor aggregate rating
//    • PLACEHOLDER_STATS    → real season/year-to-date operational numbers
//    • PLACEHOLDER_REVIEWS  → real customer quotes (with consent)
//
//  Once real reviews exist, this file should either pull from a CMS / DB
//  or be regenerated at build time from the live review feed.
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_BADGES = [
  { source: 'Google', rating: '4.8', label: 'star rating', icon: 'google' as const },
  { source: 'Tripadvisor', rating: 'Excellent', label: 'traveller reviews', icon: 'tripadvisor' as const },
];

const PLACEHOLDER_STATS = [
  { value: '4:30 AM', label: 'Earliest Moraine Lake arrival' },
  { value: '< 5 min', label: 'Typical boarding window' },
  { value: '100%', label: 'On-time premium departures' },
];

const PLACEHOLDER_REVIEWS = [
  {
    id: 'r1',
    quote: 'Caught the 4:30 AM Sunrise Express to Moraine Lake — first light over the water was unreal. Bus left on the dot and the driver gave us tips for the best viewpoints.',
    author: 'Sarah K.',
    location: 'Calgary, AB',
    service: 'Sunrise Express',
  },
  {
    id: 'r2',
    quote: 'Skipped the parking nightmare entirely. Samson Mall pickup is dead simple and the loop hit both lakes without any waiting around. Bundle pricing made it cheaper than driving.',
    author: 'Daniel M.',
    location: 'Edmonton, AB',
    service: 'Daytime Circuit',
  },
  {
    id: 'r3',
    quote: 'Booked the round-trip bundle for four of us. Comfortable coach, clean, and the staff at the Lakeshore loading area kept everything moving even when it got busy.',
    author: 'Priya R.',
    location: 'Toronto, ON',
    service: 'Round-trip bundle',
  },
];

export default function SocialProof() {
  return (
    <section
      aria-labelledby="social-proof-heading"
      className="mx-auto max-w-7xl px-6 py-20"
    >
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sunrise-700">
          Trusted by riders to the lakes
        </p>
        <h2
          id="social-proof-heading"
          className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tighter text-evergreen-800 sm:text-4xl"
        >
          The shuttle locals send first-time visitors on
        </h2>
      </header>

      {/* Rating badges + operational stats */}
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {PLACEHOLDER_BADGES.map((b) => (
          <RatingBadge key={b.source} {...b} />
        ))}
        {PLACEHOLDER_STATS.map((s) => (
          <StatChip key={s.label} value={s.value} label={s.label} />
        ))}
      </div>

      {/* Testimonial cards */}
      <ul className="mt-8 flex gap-6 snap-x snap-mandatory overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {PLACEHOLDER_REVIEWS.map((r) => (
          <ReviewCard key={r.id} {...r} />
        ))}
      </ul>
    </section>
  );
}

function RatingBadge({
  source, rating, label, icon,
}: {
  source: string;
  rating: string;
  label: string;
  icon: 'google' | 'tripadvisor';
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-mist-500"
      >
        {icon === 'google' ? <GoogleGlyph /> : <TripadvisorGlyph />}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-base font-bold tabular-nums text-mist-900">
            {rating}
          </span>
          <Stars />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mist-500">
          {source} · {label}
        </p>
      </div>
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
      <p className="font-display text-xl font-extrabold tracking-tighter tabular-nums text-mist-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-mist-500">
        {label}
      </p>
    </div>
  );
}

function ReviewCard({
  quote, author, location, service,
}: {
  quote: string;
  author: string;
  location: string;
  service: string;
}) {
  return (
    <li className="flex w-[85vw] shrink-0 snap-center flex-col gap-4 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 md:w-auto">
      <Stars />
      <p className="text-sm leading-relaxed text-mist-700">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-mist-200 pt-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-mist-900">
            {author}
          </p>
          <p className="text-xs text-mist-500">{location}</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-sunrise-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sunrise-700">
          {service}
        </span>
      </div>
    </li>
  );
}

function Stars() {
  return (
    <span aria-label="5 out of 5 stars" className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="size-3.5 text-sunrise-500"
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77 4.8 17.5l.99-5.78L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.08-1.92 3.25-4.74 3.25-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.68l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.88 0-5.32-1.94-6.19-4.56H2.15v2.86A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.81 14.06A6.6 6.6 0 0 1 5.45 12c0-.72.13-1.41.36-2.06V7.08H2.15A11 11 0 0 0 1 12c0 1.77.42 3.45 1.15 4.92l3.66-2.86z" />
      <path fill="#EA4335" d="M12 5.4c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.15 7.08l3.66 2.86C6.68 7.34 9.12 5.4 12 5.4z" />
    </svg>
  );
}

function TripadvisorGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 text-evergreen-700 dark:text-evergreen-300">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="12" r="2.2" />
      <circle cx="15.5" cy="12" r="2.2" />
    </svg>
  );
}
