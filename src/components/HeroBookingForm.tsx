'use client';

import React, { useState } from 'react';
import { useBookingModal, type BookingRouteId } from '@/store/booking-modal';
import { TIERS, formatCents, isSaleActive, effectiveUnitPrice } from '@/lib/fares';
import { useFares } from '@/components/FaresProvider';

export default function HeroBookingForm() {
  const openBooking = useBookingModal((s) => s.open);
  const { byTier, getFare, nowMs, pauseBookings } = useFares();
  // Derive the initial selection from the live catalog so we never preselect a fare id
  // that's been deactivated/removed. Falls back to the first fare in tier order.
  const firstFareId = TIERS.map((t) => byTier[t.key]?.[0]?.id).find(Boolean) ?? '';
  const [selectedRoute, setSelectedRoute] = useState<BookingRouteId>(firstFareId);

  const todayStr = new Date(nowMs).toISOString().split('T')[0];
  const minDateStr = todayStr < '2026-06-25' ? '2026-06-25' : todayStr;
  const [date, setDate] = useState(() => minDateStr);
  const [passengers, setPassengers] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against a stale selection (e.g. the fare was deactivated since mount).
    const route = getFare(selectedRoute) ? selectedRoute : firstFareId;
    openBooking(route, { date, passengers });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl bg-white backdrop-blur-xl ring-1 ring-mist-900/10 shadow-[var(--shadow-elevated)]"
    >
      <div className="p-6 sm:p-8 lg:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-evergreen-600">
          Book your shuttle
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-evergreen-800 sm:text-[28px]">
          Reserve in 30&nbsp;seconds
        </h2>

        <div className="mt-8 space-y-6">
          <Field label="Route / Service" htmlFor="route-select">
            <select
              id="route-select"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value as BookingRouteId)}
              className="w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-base font-medium text-mist-900 outline-none transition focus:border-evergreen-500 focus:bg-white focus:ring-2 focus:ring-evergreen-500/25"
            >
              {TIERS.map((tier) => (
                <optgroup key={tier.key} label={tier.label}>
                  {byTier[tier.key].map((f) => {
                    const eff = effectiveUnitPrice(f, nowMs);
                    const sale = isSaleActive(f, nowMs);
                    return (
                      <option key={f.id} value={f.id} className="bg-white text-mist-900">
                        {f.label} — {formatCents(eff)}
                        {sale ? ` (was ${formatCents(f.priceCents)})` : ''}
                        {f.tollCents > 0 ? ` +${formatCents(f.tollCents)} toll` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Travel date" htmlFor="date-input">
              <input
                type="date"
                id="date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-base font-medium text-mist-900 outline-none transition focus:border-evergreen-500 focus:bg-white focus:ring-2 focus:ring-evergreen-500/25"
                min={minDateStr}
              />
              {minDateStr === '2026-06-25' && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                  Note: All departures before June 25th are completely sold out.
                </p>
              )}
            </Field>

            <Field label="Passengers" htmlFor="passengers-input">
              <select
                id="passengers-input"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-base font-medium text-mist-900 outline-none transition focus:border-evergreen-500 focus:bg-white focus:ring-2 focus:ring-evergreen-500/25"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-white text-mist-900">
                    {n === 5 ? '5+ Passengers' : `${n} Passenger${n > 1 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={pauseBookings}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sunrise-500 px-6 py-4 font-display text-base font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] transition hover:bg-sunrise-400 focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:ring-offset-2 focus:ring-offset-mist-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pauseBookings ? 'Bookings temporarily paused' : 'Find availability & book'}
          <span aria-hidden>→</span>
        </button>

        <p className="mt-5 text-center text-xs text-mist-500">
          Please arrive 10 minutes early — buses depart strictly on schedule.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
