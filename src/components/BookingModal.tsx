'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { getStripe } from '@/lib/stripe-client';
import { absoluteUrl } from '@/lib/seo';
import { useBookingModal } from '@/store/booking-modal';
import {
  TIERS,
  formatCents,
  isSaleActive,
  effectiveUnitPrice,
  quote,
  type FareId,
  type FareAddOn,
} from '@/lib/fares';
import { useFares } from '@/components/FaresProvider';

// Apple Wallet "Add to Wallet" button is gated off until pass signing is wired
// up (see src/app/api/wallet/apple/[reference]/route.ts). Flip
// NEXT_PUBLIC_WALLET_ENABLED=true once the Pass Type ID cert + key are in place.
const WALLET_ENABLED = process.env.NEXT_PUBLIC_WALLET_ENABLED === 'true';

const DAYTIME_TIMES: { value: string; label: string }[] = [
  { value: '7:00 AM',  label: '7:00 AM — Circuit 1' },
  { value: '9:00 AM',  label: '9:00 AM — Circuit 2' },
  { value: '11:00 AM', label: '11:00 AM — Circuit 3' },
  { value: '1:30 PM',  label: '1:30 PM — Circuit 4' },
  { value: '3:30 PM',  label: '3:30 PM — Circuit 5' },
];

const TIME_OPTIONS: Record<FareId, { value: string; label: string }[]> = {
  'sunrise-banff-moraine': [{ value: '4:30 AM', label: '4:30 AM — Banff → Moraine Lake' }],
  'daytime-samson-ll':     DAYTIME_TIMES,
  'daytime-ll-moraine':    DAYTIME_TIMES,
  'daytime-moraine-samson': DAYTIME_TIMES,
  'evening-ll-banff': [{ value: '6:00 PM', label: '6:00 PM — Lake Louise → Banff' }],
};

type Step = 1 | 2 | 3 | 4;

export default function BookingModal() {
  const isOpen = useBookingModal((s) => s.isOpen);
  const initialRoute = useBookingModal((s) => s.initialRoute);
  const initialDate = useBookingModal((s) => s.initialDate);
  const initialPassengers = useBookingModal((s) => s.initialPassengers);
  const closeModal = useBookingModal((s) => s.close);

  const [step, setStep] = useState<Step>(1);
  const [route, setRoute] = useState<FareId>('daytime-samson-ll');
  const [time, setTime] = useState<string>('');
  // nowMs is stable from context, so we can use it to derive today's date without hydration mismatch
  const { fares, byTier, nowMs, getFare, pauseBookings, pauseMessage } = useFares();
  
  const todayStr = new Date(nowMs).toISOString().split('T')[0];
  const minDateStr = todayStr < '2026-06-25' ? '2026-06-25' : todayStr;

  const [date, setDate] = useState<string>(() => minDateStr);
  const [passengers, setPassengers] = useState<number>(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  // Seats remaining per departure time for the selected route+date (drives the slot
  // picker's sold-out state and the surge preview). Empty/unknown = fail-open.
  const [slotSeats, setSlotSeats] = useState<Record<string, number>>({});
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [ticketRef, setTicketRef] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [holdExpiresAt, setHoldExpiresAt] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');


  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    // getFare proves the id exists in the live catalog (admin-authored ids are plain
    // strings, so a separate isFareId check would add nothing).
    const initialFare = getFare(initialRoute);
    if (initialFare) {
      setRoute(initialRoute);
      setTime(initialFare.defaultTime);
      setSelectedAddOns([]);
    }
    if (initialDate) setDate(initialDate);
    if (typeof initialPassengers === 'number' && initialPassengers >= 1 && initialPassengers <= 8) {
      setPassengers(initialPassengers);
    }
  }, [initialRoute, initialDate, initialPassengers, isOpen, getFare]);
  // Keep the route *state* in sync with the displayed fallback fare: if the selected id
  // no longer resolves (e.g. it was deactivated), adopt fares[0] so checkout submits the
  // same fare the rider sees rather than a stale id.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && !getFare(route) && fares[0] && route !== fares[0].id) {
      setRoute(fares[0].id);
      setTime(fares[0].defaultTime);
    }
  }, [isOpen, route, fares, getFare]);
  // Live seat availability for EVERY departure on the selected route+date. Drives both the
  // slot picker's sold-out state and the surge preview for the chosen slot. The checkout
  // endpoint re-reads and re-prices authoritatively; this only keeps the UI honest.
  // Fail-open: on error the map stays empty → no slot is blocked and no surge is shown.
  useEffect(() => {
    if (!isOpen || !route || !date) return;
    const f = getFare(route);
    const opts = TIME_OPTIONS[route] ?? (f ? [{ value: f.defaultTime, label: f.defaultTime }] : []);
    const times = opts.map((o) => o.value);
    if (!times.length) return;
    let cancelled = false;
    setSlotSeats({});
    const params = new URLSearchParams({ route, date, times: times.join(',') });
    fetch(`/checkout/availability?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !Array.isArray(d.slots)) return;
        const map: Record<string, number> = {};
        for (const s of d.slots) {
          if (s && typeof s.time === 'string' && typeof s.seatsRemaining === 'number') {
            map[s.time] = s.seatsRemaining;
          }
        }
        setSlotSeats(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, route, date, getFare]);

  // Auto-advance: if the selected slot can't seat the party (sold out / not enough left),
  // hop to the next departure that can. Unknown counts are treated as available (fail-open).
  useEffect(() => {
    if (!isOpen) return;
    const opts = TIME_OPTIONS[route] ?? [];
    if (!opts.length) return;
    const fits = (v: string) => {
      const r = slotSeats[v];
      return r == null || r >= passengers;
    };
    if (time && fits(time)) return;
    const next = opts.find((o) => fits(o.value));
    if (next && next.value !== time) setTime(next.value);
  }, [isOpen, route, slotSeats, passengers, time]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Resolve the selected fare from the DB-backed catalog, falling back to the first fare
  // if the stored id is missing (e.g. a deactivated/removed fare).
  const fare = getFare(route) ?? fares[0];
  // Seats left on the chosen slot (null = unknown/loading) → feeds the surge preview.
  const seatsRemaining = time && slotSeats[time] != null ? slotSeats[time] : null;
  const q = fare ? quote(fare, passengers, nowMs, selectedAddOns, seatsRemaining) : null;
  const fareSubtotal = (q?.fareCents ?? 0) / 100; // effective fare × passengers
  const toll = (q?.tollCents ?? 0) / 100; // Moraine toll × passengers
  const addOnLines = q?.selectedAddOns ?? []; // resolved, charge-authoritative add-ons
  const tax = (q?.gstCents ?? 0) / 100;
  const total = (q?.totalCents ?? 0) / 100;
  const onSale = q?.onSale ?? false;
  const surged = q?.surged ?? false; // demand surge active on the seat fare
  const surgePct = Math.round((q?.surgeRate ?? 0) * 100);
  const basePerSeat = (q?.baseUnitPriceCents ?? fare?.priceCents ?? 0) / 100; // pre-surge per seat
  const seatsLeft = q?.seatsRemaining ?? null;
  const perSeat = (q?.unitPriceCents ?? fare?.priceCents ?? 0) / 100;
  const originalPerSeat = (fare?.priceCents ?? 0) / 100;
  const timeOptions =
    TIME_OPTIONS[route] ?? (fare ? [{ value: fare.defaultTime, label: fare.defaultTime }] : []);

  // Per-slot picker state. Unknown counts (still loading / fetch failed) stay selectable.
  const slotInfo = (value: string): { disabled: boolean; suffix: string } => {
    const r = slotSeats[value];
    if (r == null) return { disabled: false, suffix: '' };
    if (r <= 0) return { disabled: true, suffix: ' — Sold out' };
    if (r < passengers) return { disabled: true, suffix: ` — only ${r} left` };
    if (r <= 4) return { disabled: false, suffix: ` — ${r} left` };
    return { disabled: false, suffix: '' };
  };
  const selectedSlotFull = !!time && slotSeats[time] != null && slotSeats[time] < passengers;
  const allSlotsFull =
    timeOptions.length > 0 &&
    timeOptions.every((o) => slotSeats[o.value] != null && slotSeats[o.value] < passengers);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotFull) return; // sold out for this party size — blocked + messaged below
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setSubmitError('Please fill out all contact fields.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, date, time, passengers, name, email, phone, selectedAddOns }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Payment setup failed' }));
        throw new Error(error || 'Payment setup failed');
      }
      const data = await res.json() as { clientSecret: string; reference: string; holdExpiresAt: string };
      setClientSecret(data.clientSecret);
      setTicketRef(data.reference);
      setHoldExpiresAt(data.holdExpiresAt);
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not start payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep(4);
  };

  const handleClose = () => {
    setStep(1); setName(''); setEmail(''); setPhone('');
    setClientSecret(''); setTicketRef(''); setHoldExpiresAt(''); setSubmitError('');
    closeModal();
  };

  const handleRouteChange = (next: FareId) => {
    setRoute(next);
    setSelectedAddOns([]); // add-ons are fare-specific — clear when switching routes
    const f = getFare(next);
    if (f) setTime(f.defaultTime);
  };

  const toggleAddOn = (key: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mist-950/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative my-4 flex h-[90vh] min-h-[480px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-elevated)] ring-1 ring-mist-200 sm:my-8 sm:h-[85vh] sm:max-h-[760px] sm:min-h-[560px]"
          >
        <button
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 z-20 grid size-9 place-items-center rounded-full bg-white/90 text-mist-500 shadow-sm ring-1 ring-mist-200 backdrop-blur transition hover:bg-white hover:text-mist-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        {/* Internal scroll region: content scrolls here while the panel (and its close button) stay fixed. */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
        {pauseBookings ? (
          <div className="flex min-h-full flex-col items-center justify-center p-8 text-center sm:p-12">
            <span className="grid size-16 place-items-center rounded-full bg-sunrise-100 text-sunrise-700 shadow-sm ring-8 ring-sunrise-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">
              Bookings are paused
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-mist-600">
              {pauseMessage || 'New checkouts are temporarily suspended. Please try again later.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-xl bg-evergreen-700 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-evergreen-850"
              >
                Close Window
              </button>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-mist-300 bg-white px-5 py-3 text-sm font-semibold text-mist-700 shadow-sm transition hover:bg-mist-50 hover:text-mist-900"
              >
                Contact Support
              </a>
            </div>
          </div>
        ) : step < 4 ? (
          <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
            {/* Form column */}
            <div className="bg-white">
              <StepIndicator step={step as 1 | 2 | 3} />

              <div className="p-4 sm:p-6 lg:p-9">
                {step === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-6">
                    <header>
                      <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">
                        Configure your shuttle
                      </h2>
                      <p className="mt-1.5 text-sm text-mist-500">
                        Pick your service, departure and party size.
                      </p>
                    </header>

                    <Field label="Route" htmlFor="modal-route">
                      <Select id="modal-route" value={route} onChange={(v) => handleRouteChange(v as FareId)}>
                        {TIERS.map((tier) => (
                          <optgroup key={tier.key} label={tier.label}>
                            {byTier[tier.key].map((f) => {
                              const eff = effectiveUnitPrice(f, nowMs);
                              const sale = isSaleActive(f, nowMs);
                              return (
                                <option key={f.id} value={f.id}>
                                  {f.label} — {formatCents(eff)}
                                  {sale ? ` (was ${formatCents(f.priceCents)})` : ''}
                                  {f.tollCents > 0 ? ` +${formatCents(f.tollCents)} toll` : ''}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </Select>
                    </Field>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Travel date" htmlFor="modal-date">
                        <input
                          type="date"
                          id="modal-date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={minDateStr}
                          className={INPUT_CLASS}
                        />
                        {minDateStr === '2026-06-25' && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600">
                            Note: All departures before June 25th are completely sold out.
                          </p>
                        )}
                      </Field>
                      <Field label="Passengers" htmlFor="modal-pax">
                        <Select id="modal-pax" value={String(passengers)} onChange={(v) => setPassengers(parseInt(v))}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <Field label="Departure time" htmlFor="modal-time">
                      <Select id="modal-time" value={time} onChange={setTime}>
                        {timeOptions.map((opt) => {
                          const info = slotInfo(opt.value);
                          return (
                            <option key={opt.value} value={opt.value} disabled={info.disabled}>
                              {opt.label}{info.suffix}
                            </option>
                          );
                        })}
                      </Select>
                      {allSlotsFull ? (
                        <p className="mt-1.5 text-xs font-semibold text-red-600">
                          Every departure is full on this date for {passengers} {passengers === 1 ? 'guest' : 'guests'} — please choose another date.
                        </p>
                      ) : selectedSlotFull ? (
                        <p className="mt-1.5 text-xs font-semibold text-red-600">
                          This departure can’t seat {passengers} guests — pick another time.
                        </p>
                      ) : seatsRemaining != null && seatsRemaining <= 4 ? (
                        <p className="mt-1.5 text-xs font-semibold text-sunrise-700">
                          Hurry — only {seatsRemaining} {seatsRemaining === 1 ? 'seat' : 'seats'} left on this departure.
                        </p>
                      ) : null}
                    </Field>

                    {seatsLeft !== null && seatsLeft > 0 && seatsLeft <= 6 && (
                      <div
                        className={`flex items-start gap-3 rounded-xl p-4 ring-1 ${
                          surged ? 'bg-sunrise-50 ring-sunrise-500/30' : 'bg-mist-50 ring-mist-200'
                        }`}
                      >
                        <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sunrise-100 text-sunrise-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
                        </span>
                        <p className="text-xs leading-relaxed text-mist-700">
                          <strong className="text-mist-900">Only {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</strong> on this departure.
                          {surged && <> Peak-demand pricing (+{surgePct}%) is applied to the seat fare.</>}
                        </p>
                      </div>
                    )}

                    {fare && fare.addOns.length > 0 && (
                      <fieldset className="space-y-2.5">
                        <legend className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                          Add to your trip
                        </legend>
                        {fare.addOns.map((addon) => {
                          const checked = selectedAddOns.includes(addon.key);
                          return (
                            <label
                              key={addon.key}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                                checked
                                  ? 'border-evergreen-500 bg-evergreen-50 ring-1 ring-evergreen-500/30'
                                  : 'border-mist-200 bg-white hover:border-mist-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAddOn(addon.key)}
                                className="size-4 shrink-0 accent-evergreen-700"
                              />
                              <span className="flex-1">
                                <span className="block text-sm font-semibold text-mist-900">{addon.label}</span>
                                {addon.description && (
                                  <span className="mt-0.5 block text-xs text-mist-500">{addon.description}</span>
                                )}
                              </span>
                              <span className="shrink-0 text-sm font-bold tabular-nums text-evergreen-700">
                                +{formatCents(addon.priceCents)}
                                <span className="ml-1 text-[10px] font-medium text-mist-400">/ guest</span>
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    )}

                    <button
                      type="submit"
                      disabled={selectedSlotFull || allSlotsFull}
                      className={`${CTA_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {selectedSlotFull || allSlotsFull ? 'Sold out — choose another time' : 'Continue to contact'}
                      <span aria-hidden>→</span>
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-6">
                    <header>
                      <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">
                        Who&apos;s travelling?
                      </h2>
                      <p className="mt-1.5 text-sm text-mist-500">
                        We&apos;ll send your ticket and any delay alerts here.
                      </p>
                    </header>

                    <Field label="Primary passenger" htmlFor="modal-name">
                      <input
                        type="text"
                        id="modal-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>

                    <Field label="Email" htmlFor="modal-email">
                      <input
                        type="email"
                        id="modal-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>

                    <Field label="Mobile (for delay alerts)" htmlFor="modal-phone">
                      <input
                        type="tel"
                        id="modal-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (437) 990-3860"
                        className={INPUT_CLASS}
                        required
                      />
                    </Field>

                    <div className="flex items-start gap-3 rounded-xl border-l-4 border-l-evergreen-500 bg-evergreen-50 p-4">
                      <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-evergreen-100 text-evergreen-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      </span>
                      <p className="text-xs leading-relaxed text-mist-700">
                        Buses depart strictly on schedule. Arrive at your loading area
                        <strong className="text-mist-900"> 10 minutes early</strong>.
                      </p>
                    </div>

                    {submitError && (
                      <p role="alert" className="text-sm font-medium text-red-600">
                        {submitError}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-mist-500 transition hover:text-mist-900"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`${CTA_CLASS} flex-1 disabled:cursor-wait disabled:opacity-70`}
                      >
                        {submitting ? 'Preparing payment…' : 'Continue to payment →'}
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && clientSecret && (
                  <PaymentStep
                    clientSecret={clientSecret}
                    total={total}
                    email={email}
                    holdExpiresAt={holdExpiresAt}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handleClose}
                    onExpire={() => { setStep(2); setClientSecret(''); setHoldExpiresAt(''); setSubmitError('Your reservation hold expired. Please try again.'); }}
                  />
                )}
              </div>
            </div>

            {/* Trip summary column */}
            <TripSummary
              routeName={fare?.label ?? '—'}
              perSeat={perSeat}
              originalPerSeat={originalPerSeat}
              onSale={onSale}
              surged={surged}
              surgePct={surgePct}
              basePerSeat={basePerSeat}
              tollPerSeat={(fare?.tollCents ?? 0) / 100}
              note={fare?.note ?? undefined}
              date={date}
              time={time}
              passengers={passengers}
              fareSubtotal={fareSubtotal}
              toll={toll}
              addOns={addOnLines}
              tax={tax}
              total={total}
            />
          </div>
        ) : (
          <div className="min-h-full animate-fade-in p-4 sm:p-6 lg:p-10">
            <header className="flex flex-col items-center gap-3 text-center">
              <span
                className="relative grid size-14 place-items-center rounded-full bg-evergreen-700 text-white shadow-[0_0_0_8px_hsl(168_55%_16%/0.08)]"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-7">
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
              </span>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">
                Reservation confirmed
              </h2>
              <p className="text-sm text-mist-500">
                Confirmation sent to <strong className="text-mist-900">{email}</strong>
              </p>
            </header>

            <div className="mx-auto mt-7 max-w-md">
              <ConfirmedTicket
                name={name}
                routeName={fare?.label ?? '—'}
                date={date}
                time={time}
                passengers={passengers}
                ticketRef={ticketRef}
                total={total}
              />

              <button onClick={handleClose} className={`${CTA_CLASS} mt-6`}>
                Done — close
              </button>
            </div>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}

const INPUT_CLASS =
  'w-full rounded-xl border border-mist-200 bg-white px-4 py-3.5 text-sm font-medium text-mist-900 outline-none transition placeholder:text-mist-400 focus:border-evergreen-500 focus:bg-white focus:ring-2 focus:ring-evergreen-500/25';

const CTA_CLASS =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sunrise-500 px-5 py-4 font-display text-sm font-bold text-evergreen-950 shadow-[var(--shadow-glow-sunrise)] transition hover:bg-sunrise-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunrise-500 focus-visible:ring-offset-2 focus-visible:ring-offset-mist-50';

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="border-b border-mist-200 px-6 py-4 sm:px-9">
      <div className="flex items-center gap-3">
        <Step n={1} label="Route"   active={step >= 1} />
        <div className={`h-0.5 flex-1 rounded-full ${step >= 2 ? 'bg-evergreen-700' : 'bg-mist-200'}`} />
        <Step n={2} label="Contact" active={step >= 2} />
        <div className={`h-0.5 flex-1 rounded-full ${step >= 3 ? 'bg-evergreen-700' : 'bg-mist-200'}`} />
        <Step n={3} label="Pay"     active={step >= 3} />
      </div>
    </div>
  );
}

function TripSummary({
  routeName, perSeat, originalPerSeat, onSale, surged, surgePct, basePerSeat, tollPerSeat, note, date, time, passengers, fareSubtotal, toll, addOns, tax, total,
}: {
  routeName: string;
  perSeat: number;
  originalPerSeat: number;
  onSale: boolean;
  surged: boolean;
  surgePct: number;
  basePerSeat: number;
  tollPerSeat: number;
  note?: string;
  date: string;
  time: string;
  passengers: number;
  fareSubtotal: number;
  toll: number;
  addOns: FareAddOn[];
  tax: number;
  total: number;
}) {
  return (
    <aside className="relative flex flex-col justify-between gap-8 overflow-hidden border-t border-mist-200 bg-mist-100 p-6 text-mist-900 sm:border-l sm:border-t-0 sm:p-9">
      {/* Subtle decorative ridge */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_right,hsl(41_78%_50%/0.18),transparent_55%)]" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.18em] text-evergreen-700">
            <span aria-hidden>🌸</span> Your trip
          </span>
          <span className="rounded-full bg-sunrise-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sunrise-700 ring-1 ring-sunrise-500/30">
            Live preview
          </span>
        </div>

        <div>
          <p className="font-display text-xl font-extrabold leading-tight tracking-tight text-evergreen-800">{routeName}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">Route</p>
          {note && <p className="mt-2 text-xs leading-relaxed text-mist-600">{note}</p>}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <SummaryCell label="Date" value={date} />
          <SummaryCell label="Departs" value={time || '—'} highlight />
          <SummaryCell label="Passengers" value={`${passengers}`} />
          <div>
            <p className="font-display text-sm font-bold leading-snug text-mist-900">
              ${perSeat.toFixed(2)}
              {surged ? (
                <span className="ml-1.5 text-[11px] font-semibold text-mist-400 line-through">
                  ${basePerSeat.toFixed(2)}
                </span>
              ) : onSale ? (
                <span className="ml-1.5 text-[11px] font-semibold text-mist-400 line-through">
                  ${originalPerSeat.toFixed(2)}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
              Per seat{surged ? ` · Peak +${surgePct}%` : onSale ? ' · Sale' : ''}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-mist-200">
          <div className="flex items-center justify-between text-xs text-mist-700">
            <span>Fare × {passengers}</span>
            <span className="tabular-nums">${fareSubtotal.toFixed(2)}</span>
          </div>
          {toll > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-xs text-mist-700">
              <span>Moraine Lake toll (${tollPerSeat.toFixed(2)} × {passengers})</span>
              <span className="tabular-nums">${toll.toFixed(2)}</span>
            </div>
          )}
          {addOns.map((addon) => (
            <div key={addon.key} className="mt-1.5 flex items-center justify-between text-xs text-mist-700">
              <span>{addon.label} (${(addon.priceCents / 100).toFixed(2)} × {passengers})</span>
              <span className="tabular-nums">${((addon.priceCents * passengers) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center justify-between text-xs text-mist-700">
            <span>Alberta GST (5%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <div className="mt-3 border-t border-mist-200 pt-3">
            <div className="flex items-end justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                Total · CAD
              </span>
              <span className="font-display text-3xl font-extrabold tabular-nums text-evergreen-800 sm:text-[2rem]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ul className="relative space-y-2.5 text-xs text-mist-700">
        <TrustItem>Secure payment via Stripe · 128-bit SSL</TrustItem>
        <TrustItem>Free cancellation up to 24h before departure</TrustItem>
        <TrustItem>Confirmation by email and SMS</TrustItem>
      </ul>
    </aside>
  );
}

function SummaryCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`font-display text-sm font-bold leading-snug ${highlight ? 'text-sunrise-700' : 'text-mist-900'}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">{label}</p>
    </div>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sunrise-100 text-sunrise-700">
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-2.5"><path d="M13 4.5 6 11.5 3 8.5l1-1L6 9.5l6-6z" /></svg>
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function Step({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
          active
            ? 'bg-evergreen-700 text-white'
            : 'bg-mist-200 text-mist-500'
        }`}
      >
        {n}
      </span>
      <span className="text-xs font-semibold text-mist-700">{label}</span>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS}>
      {children}
    </select>
  );
}

type TicketProps = {
  name: string;
  routeName: string;
  date: string;
  time: string;
  passengers: number;
  ticketRef: string;
  total: number;
};

// Boarding pass + the "save / share" toolbar. Owns the capture ref so the PNG
// and print views snapshot exactly what's on screen (QR included).
function ConfirmedTicket(props: TicketProps) {
  const passRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={passRef}>
        <BoardingPass {...props} />
      </div>
      <TicketActions passRef={passRef} {...props} />
    </>
  );
}

function TicketActions({
  passRef, routeName, date, time, passengers, ticketRef,
}: TicketProps & { passRef: React.RefObject<HTMLDivElement | null> }) {
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null);
  const [copied, setCopied] = useState(false);

  const ticketUrl = absoluteUrl(`/my-trips/${encodeURIComponent(ticketRef)}`);

  async function capturePng(): Promise<string | null> {
    if (!passRef.current) return null;
    return toPng(passRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' });
  }

  async function handleSavePng() {
    setBusy('png');
    try {
      const dataUrl = await capturePng();
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `rockflower-${ticketRef}.png`;
        a.click();
      }
    } catch (err) {
      console.error('[ticket] PNG export failed', err);
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    setBusy('pdf');
    // Open the window synchronously (still inside the click gesture) so popup
    // blockers don't kill it during the async capture below.
    const win = window.open('', '_blank');
    try {
      const dataUrl = await capturePng();
      if (win && dataUrl) {
        win.document.write(
          `<!doctype html><html><head><title>RockFlower ticket ${ticketRef}</title>` +
            `<meta name="viewport" content="width=device-width, initial-scale=1">` +
            `<style>@page{margin:14mm}html,body{margin:0}body{display:flex;justify-content:center;padding:16px;background:#fff}img{width:340px;max-width:100%;height:auto}</style>` +
            `</head><body><img src="${dataUrl}" alt="RockFlower Travels boarding pass ${ticketRef}" onload="window.focus();window.print()"></body></html>`,
        );
        win.document.close();
      } else if (win) {
        win.close();
      }
    } catch (err) {
      console.error('[ticket] print failed', err);
      win?.close();
    } finally {
      setBusy(null);
    }
  }

  function handleCalendar() {
    const ics = buildTripIcs({ ticketRef, routeName, date, time, passengers, url: ticketUrl });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `rockflower-${ticketRef}.ics`;
    a.click();
    URL.revokeObjectURL(href);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ticket] copy link failed', err);
    }
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5">
      <ActionButton onClick={handleCalendar} icon={<CalendarIcon />}>
        Add to calendar
      </ActionButton>
      <ActionButton onClick={handlePrint} busy={busy === 'pdf'} icon={<PrinterIcon />}>
        {busy === 'pdf' ? 'Preparing…' : 'Save as PDF'}
      </ActionButton>
      <ActionButton onClick={handleSavePng} busy={busy === 'png'} icon={<ImageIcon />}>
        {busy === 'png' ? 'Saving…' : 'Save image'}
      </ActionButton>
      <ActionButton onClick={handleCopy} icon={<LinkIcon />}>
        {copied ? 'Link copied!' : 'Copy link'}
      </ActionButton>
    </div>
  );
}

function ActionButton({
  onClick, children, icon, busy = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-mist-200 bg-white px-3 py-2.5 text-xs font-semibold text-mist-700 transition-colors hover:border-evergreen-800/40 hover:text-evergreen-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-evergreen-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden className="text-mist-400">{icon}</span>
      {children}
    </button>
  );
}

// Builds an RFC 5545 calendar event for the departure, pinned to
// America/Edmonton (Mountain) via an embedded VTIMEZONE so the time stays
// correct regardless of the traveller's device timezone.
function buildTripIcs({
  ticketRef, routeName, date, time, passengers, url,
}: {
  ticketRef: string;
  routeName: string;
  date: string;
  time: string;
  passengers: number;
  url: string;
}): string {
  const day = date.replace(/-/g, ''); // 2026-05-21 -> 20260521
  const start = `${day}T${time24(time)}`; // -> 20260521T070000
  const origin = routeName.split(/→|->/)[0]?.trim() || 'RockFlower Travels';
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RockFlower Travels//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:America/Edmonton',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0700',
    'TZOFFSETTO:-0600',
    'TZNAME:MDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0700',
    'TZNAME:MST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${ticketRef}@rockflowertravels.ca`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;TZID=America/Edmonton:${start}`,
    'DURATION:PT2H',
    `SUMMARY:${esc(`RockFlower Shuttle — ${routeName}`)}`,
    `LOCATION:${esc(origin)}`,
    `DESCRIPTION:${esc(
      `Booking reference ${ticketRef} · ${passengers} passenger${passengers === 1 ? '' : 's'}.\nArrive 10 minutes early and present your pass.\nView booking: ${url}`,
    )}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Your RockFlower shuttle departs in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// "7:00 AM" -> "070000", "4:30 AM" -> "043000", "3:30 PM" -> "153000".
function time24(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '090000';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}${min}00`;
}

// UTC stamp in basic format: YYYYMMDDTHHMMSSZ.
function icsStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="m21 16-5-5L5 21" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function BoardingPass({
  name, routeName, date, time, passengers, ticketRef, total,
}: {
  name: string;
  routeName: string;
  date: string;
  time: string;
  passengers: number;
  ticketRef: string;
  total: number;
}) {
  // The QR resolves to the live booking page for this reference — a driver
  // (or the guest) scans it to verify status, not just to read the number.
  const ticketUrl = absoluteUrl(`/my-trips/${encodeURIComponent(ticketRef)}`);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white text-mist-900 shadow-[var(--shadow-elevated)] ring-1 ring-mist-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-mist-100 px-5 py-3.5">
        <span className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-mist-900">
          <span aria-hidden>🌸</span> RockFlower Travels
        </span>
        <span className="rounded-full bg-sunrise-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sunrise-700 ring-1 ring-sunrise-500/30">
          Boarding pass
        </span>
      </div>

      {/* Main — value-first hierarchy: data leads, labels support */}
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="font-display text-xl font-extrabold leading-tight tracking-tight text-mist-900">{name || '—'}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">Passenger</p>
        </div>

        <div>
          <p className="font-display text-base font-bold leading-snug text-mist-900">{routeName}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">Route</p>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-4">
          <PassCell label="Date" value={date} />
          <PassCell label="Departs" value={time} highlight />
          <PassCell label="Pax" value={`${passengers}`} />
        </div>
      </div>

      {/* Perforation — book: Overlap elements to create layers; classic ticket motif */}
      <div className="relative">
        <span aria-hidden className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-white" />
        <span aria-hidden className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-white" />
        <div className="border-t border-dashed border-mist-300" />
      </div>

      {/* Stub */}
      <div className="bg-mist-50 p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-base font-bold tracking-[0.16em] text-sunrise-700">{ticketRef}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">Reference</p>
          </div>
          <div className="text-right">
            <p className="font-display text-base font-bold tabular-nums text-mist-900">${total.toFixed(2)}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">Paid · CAD</p>
          </div>
        </div>

        {/* Real, scannable QR. Encodes the live booking URL so a driver scan
            opens the current status for this reference. `level="M"` tolerates
            ~15% damage (creased printouts / screen glare). */}
        <div className="mt-4 flex flex-col items-center rounded-lg bg-white p-4 ring-1 ring-mist-200">
          <QRCodeSVG
            value={ticketUrl}
            size={132}
            level="M"
            marginSize={0}
            title={`RockFlower Travels boarding pass ${ticketRef}`}
          />
          <p className="mt-3 font-mono text-[10px] font-bold tracking-[0.22em] text-mist-700">
            {ticketRef}
          </p>
          <p className="mt-1 text-[10px] text-mist-500">Scan to view your live booking</p>
        </div>

        {WALLET_ENABLED && (
          <a
            href={absoluteUrl(`/api/wallet/apple/${encodeURIComponent(ticketRef)}`)}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-mist-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Add to Apple Wallet
          </a>
        )}

        <p className="mt-4 text-xs leading-relaxed text-mist-700">
          Arrive <strong className="text-mist-900">10 minutes</strong> before departure and present this pass to the driver.
        </p>
      </div>
    </div>
  );
}

function PassCell({
  label, value, highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className={`font-display text-sm font-bold leading-snug ${highlight ? 'text-sunrise-700' : 'text-mist-900'}`}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">{label}</p>
    </div>
  );
}

function PaymentStep({
  clientSecret, total, email, holdExpiresAt, onSuccess, onCancel, onExpire,
}: {
  clientSecret: string;
  total: number;
  email: string;
  holdExpiresAt: string;
  onSuccess: () => void;
  onCancel: () => void;
  onExpire: () => void;
}) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: 'hsl(41, 78%, 50%)',
        colorBackground: '#ffffff',
        colorText: 'hsl(220, 24%, 12%)',
        colorDanger: 'hsl(0, 75%, 50%)',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid hsl(210, 14%, 89%)',
          padding: '14px',
          fontSize: '14px',
          fontWeight: '500',
        },
        '.Input:focus': {
          border: '1px solid hsl(168, 45%, 30%)',
          boxShadow: '0 0 0 4px hsl(168 45% 30% / 0.15)',
        },
        '.Label': {
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'hsl(210, 8%, 50%)',
          marginBottom: '8px',
        },
      },
    },
  };

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentForm
        total={total}
        email={email}
        holdExpiresAt={holdExpiresAt}
        onSuccess={onSuccess}
        onCancel={onCancel}
        onExpire={onExpire}
      />
    </Elements>
  );
}

function formatHold(msRemaining: number): string {
  const s = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function HoldTimer({ holdExpiresAt, onExpire }: { holdExpiresAt: string; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const deadline = new Date(holdExpiresAt).getTime();
  const remaining = deadline - now;
  const expiredRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);

  const warn = remaining < 60_000;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-4 ring-1 ${
        warn
          ? 'bg-red-50 ring-red-200'
          : 'bg-evergreen-50 ring-evergreen-200'
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
          warn
            ? 'bg-red-100 text-red-700'
            : 'bg-evergreen-100 text-evergreen-700'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>
      <div className="flex-1 text-xs leading-relaxed text-mist-700">
        <p className="font-semibold text-mist-900">
          Your reservation is being held for{' '}
          <span className="font-mono tabular-nums">{formatHold(remaining)}</span>
        </p>
        <p className="mt-0.5">
          Closing this payment dialog releases the hold and you will need to reserve again.
        </p>
      </div>
    </div>
  );
}

function PaymentForm({
  total, email, holdExpiresAt, onSuccess, onCancel, onExpire,
}: {
  total: number;
  email: string;
  holdExpiresAt: string;
  onSuccess: () => void;
  onCancel: () => void;
  onExpire: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  const handleExpire = () => {
    setExpired(true);
    onExpire();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (expired) {
      setError('Your reservation hold expired. Please start a new booking.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        receipt_email: email,
        return_url: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setError(`Unexpected payment status: ${paymentIntent?.status || 'unknown'}`);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">
          Payment
        </h2>
        <p className="mt-1.5 text-sm text-mist-500">
          Charged once. We use Stripe — your card never touches our servers.
        </p>
      </header>

      <HoldTimer holdExpiresAt={holdExpiresAt} onExpire={handleExpire} />

      <PaymentElement options={{ layout: 'tabs' }} />

      <p className="text-xs leading-relaxed text-mist-500">
        By providing your card information, you allow RockFlower Travels Inc. to charge your card
        for this booking and any related fees in accordance with our{' '}
        <Link href="/privacy-policy" className="font-semibold text-evergreen-700 underline-offset-2 hover:underline">
          privacy policy
        </Link>{' '}
        and terms.
      </p>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-mist-200 px-5 py-3.5 text-sm font-semibold text-mist-700 transition hover:border-mist-300 hover:bg-mist-50 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting || expired}
          className={`${CTA_CLASS} flex-1 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {submitting ? 'Processing…' : expired ? 'Hold expired' : `Pay now (C$${total.toFixed(2)})`}
        </button>
      </div>

      <p className="text-center text-[11px] text-mist-400">
        <span aria-hidden className="mr-1">🔒</span>
        Secured by Stripe · 128-bit SSL · PCI DSS Level 1
      </p>
    </form>
  );
}
