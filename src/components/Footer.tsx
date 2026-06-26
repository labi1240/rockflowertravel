import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/#schedule', label: 'Schedules' },
  { href: '/#tracker', label: 'Live shuttle tracker' },
  { href: '/#map', label: 'Route map' },
  { href: '/#booking', label: 'Book shuttle' },
];

// TODO: confirm the Facebook URL — using the matching handle as a default.
const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/rockflowertravels/', icon: InstagramIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/rockflowertravels', icon: FacebookIcon },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-mist-100 text-mist-700">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-sunrise-500/40 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-14 sm:gap-12 sm:px-6 sm:pb-12 sm:pt-20 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
        <div>
          <Link href="/" aria-label="Rock Flower Travels Inc. — home" className="inline-block">
            <Image
              src="/main_logo.png"
              alt="Rock Flower Travels Inc."
              width={400}
              height={195}
              className="h-20 w-auto"
            />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-mist-700">
            Premium transportation across the Canadian Rockies. Experience Banff, Lake Louise,
            and Moraine Lake in comfort on our luxury shuttle coaches.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`RockFlower Travels on ${label}`}
                className="grid size-10 place-items-center rounded-full bg-white text-mist-700 ring-1 ring-mist-200 transition hover:bg-sunrise-500 hover:text-evergreen-950 hover:ring-sunrise-500"
              >
                <Icon />
              </a>
            ))}
          </div>
          <p className="mt-6 text-xs text-mist-500">
            Schedule Draft&nbsp;v1.2 · prepared May&nbsp;03,&nbsp;2026
          </p>
        </div>

        <FooterColumn title="Quick links">
          {QUICK_LINKS.map((l) => (
            <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact">
          <li>
            <a href="mailto:rockflowertravels@gmail.com" className="font-display text-base font-bold text-mist-900 transition hover:text-sunrise-700">
              rockflowertravels@gmail.com
            </a>
          </li>
          <li>
            <a href="tel:+14379903860" className="font-display text-base font-bold text-mist-900 transition hover:text-sunrise-700 tabular-nums">
              +1&nbsp;(437)&nbsp;990-3860
            </a>
          </li>
          <li className="text-sm text-mist-500">Banff Visitor Center</li>
        </FooterColumn>

        <FooterColumn title="Legal">
          <FooterLink href="/privacy-policy">Privacy policy</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-mist-200">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-mist-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} RockFlower Travels Inc. All rights reserved.</p>
          <p className="italic">Buses depart strictly on time — arrive 10 minutes early.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-mist-500">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-mist-700 transition hover:text-evergreen-700"
      >
        {children}
      </Link>
    </li>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
