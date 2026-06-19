import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How RockFlower Travels Inc. collects, uses, and protects your personal information when you book and travel with our shuttle service.',
  alternates: { canonical: '/privacy-policy' },
};

const EFFECTIVE_DATE = 'May 23, 2026';
const CONTACT_EMAIL = 'rockflowertravels@gmail.com';
const COMPANY = 'RockFlower Travels Inc.';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="main-content mx-auto w-full max-w-3xl px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-36">
      <header className="border-b border-mist-200 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-evergreen-700">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-mist-900 sm:text-4xl lg:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-mist-500">
          Effective {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="prose-rockflower mt-10 space-y-10 text-[15px] leading-relaxed text-mist-700">
        <Section title="1. Who we are">
          <p>
            {COMPANY} (&ldquo;RockFlower&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a
            daily shuttle service between Banff, Lake Louise, and Moraine Lake. This policy
            explains what personal information we collect, how we use it, and the choices you
            have.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-mist-900">Booking details</strong> — your
              name, email, phone number, travel date, route, pickup location, and number of
              passengers.
            </li>
            <li>
              <strong className="text-mist-900">Payment information</strong> — card
              data is collected and processed directly by Stripe. We receive only a payment
              reference, the last four digits, card brand, and billing postal code.
            </li>
            <li>
              <strong className="text-mist-900">Account information</strong> — if
              you sign in, your authentication identifier from Clerk and any profile fields you
              choose to provide.
            </li>
            <li>
              <strong className="text-mist-900">Technical data</strong> — IP
              address, device type, browser, and pages viewed, captured through standard server
              logs and privacy-respecting analytics.
            </li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your booking, including confirmations and reminders.</li>
            <li>To process payments, refunds, and any disputes.</li>
            <li>To send service messages such as schedule changes or delay alerts.</li>
            <li>To detect fraud, abuse, and to keep our service secure.</li>
            <li>To comply with legal, accounting, and tax obligations in Alberta and Canada.</li>
          </ul>
        </Section>

        <Section title="4. Service providers we share data with">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-mist-900">Stripe</strong> — payment
              processing. Subject to Stripe&rsquo;s privacy policy.
            </li>
            <li>
              <strong className="text-mist-900">Clerk</strong> — account
              authentication if you choose to sign in.
            </li>
            <li>
              <strong className="text-mist-900">Vercel</strong> — application
              hosting, edge network, and operational logs.
            </li>
            <li>
              <strong className="text-mist-900">Email and SMS providers</strong> —
              to send booking confirmations and delay alerts.
            </li>
          </ul>
          <p>
            We do not sell or rent your personal information. We share data with these providers
            only as needed to deliver the service.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We keep booking and payment records for seven (7) years to meet Canadian tax and
            accounting requirements. Account profile data is kept until you delete your account.
            Server and security logs are retained for up to 90 days.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You may request access to, correction of, or deletion of your personal information by
            contacting us at the address below. We will respond within 30 days. You can also
            withdraw consent to optional communications at any time using the unsubscribe link in
            our emails.
          </p>
        </Section>

        <Section title="7. International transfers">
          <p>
            Some of our service providers, including Stripe and Vercel, process data in the United
            States. We rely on contractual safeguards to protect your information during these
            transfers.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            Our service is intended for adults booking travel. We do not knowingly collect
            personal information directly from children under 13. If you believe a child has
            provided us information, please contact us and we will delete it.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy from time to time. The effective date at the top of the page
            reflects the most recent change. Material changes will be highlighted on the booking
            page for 30 days.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions or requests? Email us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-evergreen-700 underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>

      <div className="mt-12 border-t border-mist-200 pt-8">
        <Link
          href="/"
          className="text-sm font-semibold text-evergreen-700 transition hover:text-evergreen-800"
        >
          ← Back to home
        </Link>
      </div>
      </main>

      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold tracking-tight text-mist-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
