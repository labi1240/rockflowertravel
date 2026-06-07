import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/#schedule', label: 'Schedules' },
  { href: '/#tracker', label: 'Live shuttle tracker' },
  { href: '/#map', label: 'Route map' },
  { href: '/#booking', label: 'Book shuttle' },
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
            <a href="mailto:info@rockflowertravels.ca" className="font-display text-base font-bold text-mist-900 transition hover:text-sunrise-700">
              info@rockflowertravels.ca
            </a>
          </li>
          <li>
            <a href="tel:+14035550199" className="font-display text-base font-bold text-mist-900 transition hover:text-sunrise-700 tabular-nums">
              +1&nbsp;(403)&nbsp;555-0199
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
