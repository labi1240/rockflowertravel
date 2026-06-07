'use client';

import { useBookingModal, type BookingRouteId } from '@/store/booking-modal';

export default function ServiceBookButton({
  route,
  variant = 'primary',
  children,
}: {
  route: BookingRouteId;
  variant?: 'primary' | 'gold' | 'ghost';
  children: React.ReactNode;
}) {
  const open = useBookingModal((s) => s.open);

  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sunrise-400/40';
  const tone =
    variant === 'gold'
      ? 'bg-sunrise-500 text-evergreen-950 hover:bg-sunrise-400'
      : variant === 'primary'
      ? 'bg-evergreen-700 text-white hover:bg-evergreen-800'
      : 'bg-mist-100 text-evergreen-800 ring-1 ring-mist-200 hover:bg-mist-200';

  return (
    <button type="button" onClick={() => open(route)} className={`${base} ${tone}`}>
      {children}
      <span aria-hidden>→</span>
    </button>
  );
}
