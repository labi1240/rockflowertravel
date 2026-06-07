'use client';

import React, { useState } from 'react';
import { useBookingModal, type BookingRouteId } from '@/store/booking-modal';

import { Sunrise, Sun, Sunset } from 'lucide-react';

type TabKey = 'sunrise' | 'daytime' | 'evening';

const TABS: { key: TabKey; label: string; window: string; icon: React.ReactNode }[] = [
  { key: 'sunrise', label: 'Sunrise Express', window: '4:30 AM – 6:50 AM', icon: <Sunrise className="size-6" /> },
  { key: 'daytime', label: 'Daytime Circuit', window: '7:00 AM – 5:20 PM', icon: <Sun className="size-6" /> },
  { key: 'evening', label: 'Evening Return', window: '6:00 PM departure', icon: <Sunset className="size-6" /> },
];

const LOCATIONS = [
  { value: 'all', label: 'All locations' },
  { value: 'banff', label: 'Banff' },
  { value: 'samson', label: 'Samson Mall (Village)' },
  { value: 'lakeshore', label: 'Lake Louise Lakeshore' },
  { value: 'moraine', label: 'Moraine Lake' },
];

const sunriseRoutes = [
  { id: 's1', route: 'Banff → Moraine Lake',                 origin: 'banff',     dest: 'moraine',   depart: '4:30 AM', arrive: '6:00 AM', kind: 'premium'     as const },
  { id: 's2', route: 'Moraine Lake → Lake Louise Lakeshore', origin: 'moraine',   dest: 'lakeshore', depart: '6:10 AM', arrive: '6:35 AM', kind: 'positioning' as const },
  { id: 's3', route: 'Lake Louise Lakeshore → Samson Mall',  origin: 'lakeshore', dest: 'samson',    depart: '6:35 AM', arrive: '6:50 AM', kind: 'positioning' as const },
];

const daytimeCircuits = [
  { id: 'c1', name: 'Circuit 1', samson: '7:00 AM',  lakeshore: '7:15 AM',  moraine: '7:40 AM',  returnSamson: '8:50 AM'  },
  { id: 'c2', name: 'Circuit 2', samson: '9:00 AM',  lakeshore: '9:15 AM',  moraine: '9:40 AM',  returnSamson: '10:50 AM' },
  { id: 'c3', name: 'Circuit 3', samson: '11:00 AM', lakeshore: '11:15 AM', moraine: '11:40 AM', returnSamson: '12:50 PM' },
  { id: 'c4', name: 'Circuit 4', samson: '1:30 PM',  lakeshore: '1:45 PM',  moraine: '2:10 PM',  returnSamson: '3:20 PM'  },
  { id: 'c5', name: 'Circuit 5', samson: '3:30 PM',  lakeshore: '3:45 PM',  moraine: '4:10 PM',  returnSamson: '5:20 PM'  },
];

const eveningRoutes = [
  { id: 'e1', route: 'Lake Louise Lakeshore → Banff', depart: '6:00 PM', arrive: '7:15 PM' },
];

export default function ScheduleInteractive() {
  const openBooking = useBookingModal((s) => s.open);
  const [activeTab, setActiveTab] = useState<TabKey>('daytime');
  const [searchOrigin, setSearchOrigin] = useState<string>('all');
  const [searchDestination, setSearchDestination] = useState<string>('all');

  const handleBook = (route: BookingRouteId) => () => openBooking(route);

  return (
    <>
      {/* Trip planner — From → To with interactive swap */}
      <div className="relative mt-12 grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 dark:bg-evergreen-900 dark:ring-evergreen-700/30 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end sm:gap-3 sm:p-6">
        <FilterSelect
          id="filter-origin"
          label="From"
          icon="○"
          value={searchOrigin}
          onChange={setSearchOrigin}
          options={LOCATIONS}
        />
        <button
          type="button"
          onClick={() => { const o = searchOrigin; setSearchOrigin(searchDestination); setSearchDestination(o); }}
          aria-label="Swap origin and destination"
          className="group hidden self-end justify-self-center rounded-full border border-mist-200 bg-white p-2.5 text-mist-500 shadow-sm transition hover:border-sunrise-300 hover:text-sunrise-600 dark:border-evergreen-700/60 dark:bg-evergreen-950/60 dark:text-mist-300 sm:inline-flex"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition group-hover:rotate-180">
            <path d="M7 4 4 7l3 3" />
            <path d="M4 7h16" />
            <path d="m17 20 3-3-3-3" />
            <path d="M20 17H4" />
          </svg>
        </button>
        <FilterSelect
          id="filter-dest"
          label="To"
          icon="●"
          value={searchDestination}
          onChange={setSearchDestination}
          options={LOCATIONS}
        />
        <button
          type="button"
          onClick={() => { setSearchOrigin('all'); setSearchDestination('all'); }}
          disabled={searchOrigin === 'all' && searchDestination === 'all'}
          className="self-end rounded-lg px-4 py-3 text-sm font-semibold text-mist-500 transition hover:text-evergreen-700 disabled:cursor-default disabled:opacity-40 disabled:hover:text-mist-500 dark:text-mist-300 dark:hover:text-sunrise-300"
        >
          Clear
        </button>
      </div>

      {/* Service tabs */}
      <div role="tablist" aria-label="Shuttle services" className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.key)}
              className={`group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sunrise-400/40 ${
                active
                  ? 'border-evergreen-800 bg-evergreen-800 text-white shadow-[var(--shadow-card-hover)] dark:border-sunrise-500 dark:bg-sunrise-500 dark:text-evergreen-950'
                  : 'border-mist-200 bg-white hover:border-mist-300 hover:bg-mist-50 dark:border-evergreen-700/40 dark:bg-evergreen-900 dark:hover:border-evergreen-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span aria-hidden className="text-xl">{t.icon}</span>
                {active && (
                  <span aria-hidden className="inline-flex size-5 items-center justify-center rounded-full bg-white text-evergreen-800 dark:bg-evergreen-950 dark:text-sunrise-400">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3"><path d="M13.5 4.5 6 12 2.5 8.5l1-1L6 10l6.5-6.5z" /></svg>
                  </span>
                )}
              </div>
              <span className={`font-display text-base font-bold leading-tight ${active ? '' : 'text-mist-900 dark:text-white'}`}>
                {t.label}
              </span>
              <span className={`text-xs tabular-nums ${active ? 'text-white/75 dark:text-evergreen-950/75' : 'text-mist-500 dark:text-mist-400'}`}>
                {t.window}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card-hover)] dark:bg-evergreen-900">
        {activeTab === 'sunrise' && (
          <SunrisePanel
            routes={sunriseRoutes}
            onBook={handleBook('sunrise-banff-moraine')}
            origin={searchOrigin}
            dest={searchDestination}
          />
        )}
        {activeTab === 'daytime' && (
          <DaytimePanel
            circuits={daytimeCircuits}
            onBook={handleBook('banff-ll-moraine')}
          />
        )}
        {activeTab === 'evening' && (
          <EveningPanel routes={eveningRoutes} onBook={handleBook('evening-ll-banff')} />
        )}
      </div>
    </>
  );
}

function FilterSelect({
  id, label, value, onChange, options, icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500 dark:text-mist-400">
        {icon && <span aria-hidden className="text-sunrise-500">{icon}</span>}
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mist-200 bg-white px-3.5 py-3 text-sm font-medium text-mist-900 outline-none transition focus:border-evergreen-500 focus:ring-2 focus:ring-evergreen-500/20 dark:border-evergreen-700/60 dark:bg-evergreen-950/60 dark:text-white dark:focus:border-sunrise-400 dark:focus:ring-sunrise-400/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-mist-900 dark:bg-evergreen-900 dark:text-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RouteSummary({
  stops, durationLabel, loop = false,
}: {
  stops: string[];
  durationLabel?: string;
  loop?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {stops.map((stop, i) => (
          <React.Fragment key={`${stop}-${i}`}>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-sunrise-500 ring-[3px] ring-sunrise-500/15" />
              <span className="font-display text-sm font-bold text-mist-900 dark:text-white">{stop}</span>
            </span>
            {i < stops.length - 1 && (
              <span aria-hidden className="text-mist-300 dark:text-mist-500">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {loop && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mist-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-mist-500 dark:bg-evergreen-950/40 dark:text-mist-400">
            <span aria-hidden>↻</span> loop
          </span>
        )}
        {durationLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-evergreen-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-evergreen-700 tabular-nums dark:bg-evergreen-700/30 dark:text-evergreen-200">
            <span aria-hidden>⏱</span> {durationLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-mist-50 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500 dark:bg-evergreen-950/40 dark:text-mist-400">
      {children}
    </th>
  );
}

function Time({ value, muted = false }: { value: string; muted?: boolean }) {
  return (
    <span className={`font-display tabular-nums ${muted ? 'text-mist-400 dark:text-mist-500' : 'text-mist-900 dark:text-white'} text-base font-semibold`}>
      {value}
    </span>
  );
}

function BookButton({ onClick, disabled, label = 'Book' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  if (disabled) {
    return (
      <span className="inline-flex cursor-not-allowed items-center rounded-lg border border-mist-200 px-3 py-1.5 text-xs font-semibold text-mist-400 dark:border-evergreen-700/50 dark:text-mist-500">
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-evergreen-800 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-evergreen-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunrise-400/40 dark:bg-sunrise-500 dark:text-evergreen-950 dark:hover:bg-sunrise-400"
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}

function SunrisePanel({
  routes, onBook, origin, dest,
}: {
  routes: typeof sunriseRoutes;
  onBook: () => void;
  origin: string;
  dest: string;
}) {
  return (
    <div className="animate-fade-in">
      <div className="border-b border-mist-200 px-6 py-5 dark:border-evergreen-700/40">
        <RouteSummary stops={['Banff', 'Moraine Lake']} durationLabel="1h 30m direct" />
        <p className="mt-3 text-sm text-mist-500 dark:text-mist-400">
          Premium 4:30 AM departure direct to Moraine Lake. Positioning legs are internal only.
        </p>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Route</Th>
              <Th>Departs</Th>
              <Th>Arrives</Th>
              <Th>Service</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => {
              const isPositioning = r.kind === 'positioning';
              const isMatch = (origin === 'all' || r.origin === origin) && (dest === 'all' || r.dest === dest);
              return (
                <tr
                  key={r.id}
                  className={`border-t border-mist-100 transition dark:border-evergreen-700/20 ${
                    isPositioning
                      ? (i % 2 === 1 ? 'bg-mist-50/40 dark:bg-evergreen-950/20' : '')
                      : 'bg-sunrise-50 dark:bg-sunrise-500/5'
                  } ${isMatch ? '' : 'opacity-40'}`}>
                  <td className="px-5 py-3.5 font-medium text-mist-900 dark:text-white">{r.route}</td>
                  <td className="px-5 py-3.5"><Time value={r.depart} muted={isPositioning} /></td>
                  <td className="px-5 py-3.5"><Time value={r.arrive} muted={isPositioning} /></td>
                  <td className="px-5 py-3.5">
                    {isPositioning ? (
                      <span className="inline-flex items-center rounded-full bg-mist-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-mist-500 dark:bg-evergreen-950/50 dark:text-mist-400">
                        Positioning
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-sunrise-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sunrise-700 dark:bg-sunrise-500/15 dark:text-sunrise-300">
                        Premium
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <BookButton onClick={onBook} disabled={isPositioning} label={isPositioning ? 'Internal' : 'Book'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-mist-50/30 dark:bg-evergreen-950/10">
        {routes.map((r) => {
          const isPositioning = r.kind === 'positioning';
          const isMatch = (origin === 'all' || r.origin === origin) && (dest === 'all' || r.dest === dest);
          if (!isMatch) return null;
          return (
            <div key={r.id} className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-evergreen-900 ${isPositioning ? 'border-mist-200 dark:border-evergreen-700/40' : 'border-sunrise-300 dark:border-sunrise-500/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium text-mist-900 dark:text-white">{r.route}</span>
                {isPositioning ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-mist-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mist-500 dark:bg-evergreen-950/50 dark:text-mist-400">Positioning</span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-sunrise-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sunrise-700 dark:bg-sunrise-500/15 dark:text-sunrise-300">Premium</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Departs</p>
                  <Time value={r.depart} muted={isPositioning} />
                </div>
                <span className="text-mist-300 dark:text-mist-600">→</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Arrives</p>
                  <Time value={r.arrive} muted={isPositioning} />
                </div>
              </div>
              <div className="mt-4">
                <BookButton onClick={onBook} disabled={isPositioning} label={isPositioning ? 'Internal' : 'Book'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DaytimePanel({ circuits, onBook }: { circuits: typeof daytimeCircuits; onBook: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="border-b border-mist-200 px-6 py-5 dark:border-evergreen-700/40">
        <RouteSummary
          stops={['Samson Mall', 'Lake Louise Lakeshore', 'Moraine Lake', 'Samson Mall']}
          durationLabel="1h 50m"
          loop
        />
        <p className="mt-3 text-sm text-mist-500 dark:text-mist-400">
          Five loops per day from Samson Mall. Book any circuit below.
        </p>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Circuit</Th>
              <Th>Samson Mall</Th>
              <Th>Lakeshore</Th>
              <Th>Moraine</Th>
              <Th>Back to Samson</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {circuits.map((c, i) => (
              <tr
                key={c.id}
                className={`border-t border-mist-100 transition hover:bg-sunrise-50/60 dark:border-evergreen-700/20 dark:hover:bg-evergreen-800/40 ${
                  i % 2 === 1 ? 'bg-mist-50/40 dark:bg-evergreen-950/20' : ''
                }`}>
                <td className="px-5 py-3.5 font-semibold text-mist-900 dark:text-white">{c.name}</td>
                <td className="px-5 py-3.5"><Time value={c.samson} /></td>
                <td className="px-5 py-3.5"><Time value={c.lakeshore} /></td>
                <td className="px-5 py-3.5"><Time value={c.moraine} /></td>
                <td className="px-5 py-3.5"><Time value={c.returnSamson} /></td>
                <td className="px-5 py-3.5"><BookButton onClick={onBook} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-mist-50/30 dark:bg-evergreen-950/10">
        {circuits.map((c) => (
          <div key={c.id} className="rounded-xl border border-mist-200 bg-white p-4 shadow-sm dark:border-evergreen-700/40 dark:bg-evergreen-900">
            <span className="font-semibold text-mist-900 dark:text-white">{c.name}</span>
            <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Samson Mall</p>
                <Time value={c.samson} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Lakeshore</p>
                <Time value={c.lakeshore} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Moraine</p>
                <Time value={c.moraine} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Return</p>
                <Time value={c.returnSamson} />
              </div>
            </div>
            <div className="mt-5">
              <BookButton onClick={onBook} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EveningPanel({ routes, onBook }: { routes: typeof eveningRoutes; onBook: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="border-b border-mist-200 px-6 py-5 dark:border-evergreen-700/40">
        <RouteSummary stops={['Lake Louise Lakeshore', 'Banff']} durationLabel="1h 15m" />
        <p className="mt-3 text-sm text-mist-500 dark:text-mist-400">Single evening departure back to Banff. Reservations recommended.</p>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Route</Th>
              <Th>Departs</Th>
              <Th>Arrives</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className="border-t border-mist-200 dark:border-evergreen-700/30">
                <td className="px-5 py-3.5 font-medium text-mist-900 dark:text-white">{r.route}</td>
                <td className="px-5 py-3.5"><Time value={r.depart} /></td>
                <td className="px-5 py-3.5"><Time value={r.arrive} /></td>
                <td className="px-5 py-3.5"><BookButton onClick={onBook} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3 p-4 bg-mist-50/30 dark:bg-evergreen-950/10">
        {routes.map((r) => (
          <div key={r.id} className="rounded-xl border border-mist-200 bg-white p-4 shadow-sm dark:border-evergreen-700/40 dark:bg-evergreen-900">
            <span className="font-medium text-mist-900 dark:text-white">{r.route}</span>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Departs</p>
                <Time value={r.depart} />
              </div>
              <span className="text-mist-300 dark:text-mist-600">→</span>
                                                                                                                                                                                                             <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">Arrives</p>
                <Time value={r.arrive} />
              </div>
            </div>
            <div className="mt-4">
              <BookButton onClick={onBook} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
