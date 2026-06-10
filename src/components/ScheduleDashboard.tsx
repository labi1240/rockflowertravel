import React from 'react';
import ScheduleInteractive from '@/components/ScheduleInteractive';
import ServiceCards from '@/components/ServiceCards';
import { getActiveFares } from '@/lib/fares-db';
import { isSaleActive, type FareDTO } from '@/lib/fares';
import { requestNowMs } from '@/lib/utils';

// Pricing shown on the marketing cards comes from the DB catalog so admin price/sale
// edits flow through. Each card maps to a representative fare id.
function priceProps(fare: FareDTO | undefined, nowMs: number): { priceCents: number; wasCents?: number } {
  if (!fare) return { priceCents: 0 };
  const onSale = isSaleActive(fare, nowMs);
  return onSale
    ? { priceCents: fare.salePriceCents as number, wasCents: fare.priceCents }
    : { priceCents: fare.priceCents };
}

export default async function ScheduleDashboard() {
  const fares = await getActiveFares().catch(() => [] as FareDTO[]);
  const byId = new Map(fares.map((f) => [f.id, f]));
  const nowMs = requestNowMs();

  return (
    <section id="schedule" className="mx-auto max-w-7xl px-6 py-24">
      <header className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tighter text-mist-900 dark:text-white sm:text-5xl">
          Pick your departure
        </h2>
        <p className="mt-4 text-base text-mist-500 dark:text-mist-300">
          Three services run daily between Banff, Lake Louise Village, and Moraine Lake.
          Filter by origin and destination, then book in one click.
        </p>
      </header>

      {/* Service overview — photo-backed orientation cards above pricing & schedule */}
      <ServiceCards />

      {/* Pricing & bundles — static, server-rendered above the planner so seats and savings are visible at the same moment */}
      <section aria-labelledby="pricing-heading" className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h3 id="pricing-heading" className="font-display text-lg font-bold text-mist-900 dark:text-white">
            Pricing &amp; bundles
          </h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500 dark:text-mist-500">
            All prices CAD · 5% GST extra
          </span>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PriceCard
            eyebrow="Daytime · from Banff"
            title="Banff → Lake Louise"
            {...priceProps(byId.get('banff-ll'), nowMs)}
            description="One-way daytime seat from Banff to Lake Louise. Add Moraine Lake for $89.99."
            note="Banff → Both Lakes $89.99 + $5 toll"
          />
          <PriceCard
            eyebrow="Most popular"
            title="Lake Louise ⇄ Moraine"
            {...priceProps(byId.get('ll-moraine'), nowMs)}
            description="Direct shuttle between Lake Louise and Moraine Lake — one ticket covers both directions."
            note="Round trip — there and back"
            accent
          />
          <PriceCard
            eyebrow="Premium · Sunrise"
            title="Sunrise Express"
            {...priceProps(byId.get('sunrise-banff-ll'), nowMs)}
            description="Premium 4:30 AM departure from Banff. Banff → Lake Louise $79.99, Banff → Moraine Lake $99.98."
            note="Beat the crowds at first light"
            primary
          />
        </ul>

        <p className="mt-4 text-xs text-mist-500 dark:text-mist-400">
          All fares are per seat in CAD. A $5 Moraine Lake toll (per guest) and 5% GST apply where noted; GST is calculated on the fare plus toll at checkout.
        </p>
      </section>

      <ScheduleInteractive />

      {/* Advisory — static, server-rendered for SEO */}
      <aside className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-lg font-bold text-mist-900 dark:text-white">
            Important travel notes
          </h3>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500 dark:text-mist-500">
            Before you board
          </span>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NoteCard
            icon={<ClockIcon />}
            tone="primary"
            title="Arrive 10 minutes early"
          >
            Be at your designated loading area before departure — buses depart strictly on schedule.
          </NoteCard>
          <NoteCard
            icon={<PinIcon />}
            title="Follow stop directions"
          >
            Lake Louise Lakeshore and Moraine Lake follow designated loading areas; follow staff instructions.
          </NoteCard>
          <NoteCard
            icon={<HubIcon />}
            title="Samson Mall hub"
          >
            Central pickup and drop-off point in Lake Louise Village with food, retail, and restrooms.
          </NoteCard>
          <NoteCard
            icon={<DraftIcon />}
            title="Schedule draft"
          >
            Drafted May 03, 2026. Times may change due to traffic, weather, or operations.
          </NoteCard>
        </ul>
      </aside>
    </section>
  );
}

function PriceCard({
  eyebrow,
  title,
  priceCents,
  wasCents,
  description,
  note,
  primary = false,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  priceCents: number;
  wasCents?: number;
  description: string;
  note: string;
  primary?: boolean;
  accent?: boolean;
}) {
  const dollars = Math.floor(priceCents / 100);
  const cents = (priceCents % 100).toString().padStart(2, '0');
  const wasDollars = wasCents !== undefined ? (wasCents / 100).toFixed(2) : null;

  return (
    <li
      className={`relative flex flex-col gap-4 rounded-2xl p-6 transition ${
        primary
          ? 'bg-evergreen-800 text-white shadow-[var(--shadow-card-hover)] dark:bg-sunrise-500 dark:text-evergreen-950'
          : 'bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 dark:bg-evergreen-900 dark:ring-evergreen-700/30'
      } ${accent && !primary ? 'ring-2 ring-sunrise-300 dark:ring-sunrise-500/40' : ''}`}
    >
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
          primary
            ? 'bg-white/15 text-white dark:bg-evergreen-950/25 dark:text-evergreen-950'
            : accent
              ? 'bg-sunrise-100 text-sunrise-700 dark:bg-sunrise-500/15 dark:text-sunrise-300'
              : 'bg-mist-100 text-mist-500 dark:bg-evergreen-950/40 dark:text-mist-400'
        }`}
      >
        {eyebrow}
      </span>

      <div>
        <p className={`font-display text-lg font-bold leading-tight ${primary ? '' : 'text-mist-900 dark:text-white'}`}>
          {title}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`font-display text-4xl font-extrabold tracking-tighter tabular-nums ${primary ? '' : 'text-mist-900 dark:text-white'}`}>
            ${dollars}
            <span className="text-2xl">.{cents}</span>
          </span>
          <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${primary ? 'text-white/70 dark:text-evergreen-950/70' : 'text-mist-400 dark:text-mist-500'}`}>
            CAD / seat
          </span>
        </div>
        {wasDollars && (
          <p className={`mt-1 text-xs font-medium tabular-nums ${primary ? 'text-white/70 dark:text-evergreen-950/70' : 'text-mist-500 dark:text-mist-400'}`}>
            <span className="line-through">${wasDollars}</span>
            <span className="ml-1.5">if booked separately</span>
          </p>
        )}
      </div>

      <p className={`text-sm leading-relaxed ${primary ? 'text-white/85 dark:text-evergreen-950/85' : 'text-mist-500 dark:text-mist-300'}`}>
        {description}
      </p>

      <p
        className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold ${
          primary
            ? 'text-white dark:text-evergreen-950'
            : accent
              ? 'text-sunrise-700 dark:text-sunrise-300'
              : 'text-mist-500 dark:text-mist-400'
        }`}
      >
        <span aria-hidden>{primary || accent ? '✓' : '·'}</span>
        {note}
      </p>
    </li>
  );
}

function NoteCard({
  icon, title, children, tone = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: 'default' | 'primary';
}) {
  const isPrimary = tone === 'primary';
  return (
    <li
      className={`rounded-2xl p-4 transition sm:p-5 ${
        isPrimary
          ? 'bg-evergreen-800 text-white shadow-[var(--shadow-card)] dark:bg-sunrise-500 dark:text-evergreen-950'
          : 'bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 dark:bg-evergreen-900 dark:ring-evergreen-700/30'
      }`}
    >
      <div
        className={`inline-flex size-9 items-center justify-center rounded-xl ${
          isPrimary
            ? 'bg-white/15 text-white dark:bg-evergreen-950/30 dark:text-evergreen-950'
            : 'bg-sunrise-100 text-sunrise-700 dark:bg-sunrise-500/15 dark:text-sunrise-300'
        }`}
        aria-hidden
      >
        {icon}
      </div>
      <p className={`mt-3.5 font-display text-sm font-bold leading-snug ${isPrimary ? '' : 'text-mist-900 dark:text-white'}`}>
        {title}
      </p>
      <p className={`mt-1.5 text-xs leading-relaxed ${isPrimary ? 'text-white/85 dark:text-evergreen-950/85' : 'text-mist-500 dark:text-mist-300'}`}>
        {children}
      </p>
    </li>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function HubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M4 10h16l-1.5 9.5a1 1 0 0 1-1 .85h-11a1 1 0 0 1-1-.85L4 10Z" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
