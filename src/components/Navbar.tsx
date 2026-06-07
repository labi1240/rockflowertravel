'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBookingModal } from '@/store/booking-modal';
import AccountNav from '@/components/AccountNav';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Edmonton',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export default function Navbar() {
  const [mountainTime, setMountainTime] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openBooking = useBookingModal((s) => s.open);

  useEffect(() => {
    const update = () => setMountainTime(TIME_FORMATTER.format(new Date()));
    update();
    const interval = setInterval(update, 30_000);

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Lock body scroll while the mobile menu is open so the page behind doesn't move.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'border-b border-mist-200 bg-mist-50/80 shadow-[var(--shadow-card)] backdrop-blur-2xl backdrop-saturate-200 py-1'
        : 'border-transparent bg-transparent py-4'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="group flex items-center transition-transform hover:scale-[1.02] active:scale-95"
          aria-label="Rock Flower Travels Inc. — home"
        >
          <Image
            src="/main_logo.png"
            alt="Rock Flower Travels Inc."
            width={400}
            height={195}
            priority
            className="h-10 w-auto drop-shadow-md transition-all duration-300 group-hover:drop-shadow-lg sm:h-12"
          />
        </Link>

        <nav className="hidden items-center rounded-full border border-mist-200 bg-mist-100 px-2 py-1.5 shadow-inner md:flex md:gap-1">
          <NavLink href="/#routes">All Routes</NavLink>
          <NavLink href="/#schedule">Schedules</NavLink>
          <NavLink href="/#tracker">Live Tracker</NavLink>
          <NavLink href="/#map">Route Map</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openBooking()}
            className="hidden md:inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sunrise-400 to-sunrise-500 px-5 py-2 text-sm font-bold text-evergreen-950 shadow-[0_0_15px_hsla(41,80%,58%,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_hsla(41,80%,58%,0.5)] active:scale-95"
          >
            Book Shuttle
          </button>

          <div className="h-6 w-px bg-mist-200 hidden md:block mx-1" />

          <AccountNav />

          <div className="group relative ml-1 hidden items-center gap-2 rounded-full border border-mist-200 bg-mist-100 px-3 py-1.5 text-xs backdrop-blur-md transition-all hover:border-sunrise-400/30 hover:bg-mist-200 lg:inline-flex cursor-default">
            <span aria-hidden className="relative flex size-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sunrise-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-sunrise-500 shadow-[0_0_8px_hsla(41,80%,58%,0.8)]"></span>
            </span>
            <span className="font-semibold uppercase tracking-widest text-mist-500 transition-colors group-hover:text-mist-700">Banff</span>
            <span className="font-display font-bold tabular-nums text-mist-900">{mountainTime || '—:—'}</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="inline-flex size-10 items-center justify-center rounded-full border border-mist-200 bg-mist-100 text-mist-900 transition-colors hover:bg-mist-200 active:scale-95 md:hidden"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-evergreen-950/20 backdrop-blur-sm"
          />
          <nav className="absolute inset-x-0 top-full z-50 mx-3 mt-2 flex flex-col gap-1 rounded-2xl border border-mist-200 bg-mist-50/95 p-3 shadow-[var(--shadow-card)] backdrop-blur-2xl">
            <MobileLink href="/#routes" onClick={() => setMenuOpen(false)}>All Routes</MobileLink>
            <MobileLink href="/#schedule" onClick={() => setMenuOpen(false)}>Schedules</MobileLink>
            <MobileLink href="/#tracker" onClick={() => setMenuOpen(false)}>Live Tracker</MobileLink>
            <MobileLink href="/#map" onClick={() => setMenuOpen(false)}>Route Map</MobileLink>
            <MobileLink href="/my-trips" onClick={() => setMenuOpen(false)}>My Trips</MobileLink>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openBooking();
              }}
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sunrise-400 to-sunrise-500 px-5 py-3 text-sm font-bold text-evergreen-950 shadow-[0_0_15px_hsla(41,80%,58%,0.3)] transition-all active:scale-95"
            >
              Book Shuttle
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-4 py-3 text-base font-semibold text-mist-800 transition-colors hover:bg-mist-100 hover:text-evergreen-700 active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative rounded-full px-4 py-2 text-sm font-medium text-mist-700 transition-all duration-300 hover:text-evergreen-700 hover:bg-mist-100 active:scale-95"
    >
      {children}
    </Link>
  );
}
