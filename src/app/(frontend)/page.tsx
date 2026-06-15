import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ShuttleTracker from '@/components/ShuttleTracker';
import SocialProof from '@/components/SocialProof';
import ScheduleDashboard from '@/components/ScheduleDashboard';
import AllFares from '@/components/AllFares';
import RouteMap from '@/components/RouteMap';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import JsonLd from '@/components/JsonLd';
import { faqSchema } from '@/lib/seo';

// Render per request so admin-edited fare prices/sales (ScheduleDashboard + AllFares read
// the live catalog via getActiveFares) show immediately, instead of being frozen into the
// build-time static HTML. Matches the route landing pages, which are force-dynamic too.
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <JsonLd schema={faqSchema} />
      <Navbar />

      <main className="main-content">
        <Hero />
        <ShuttleTracker />
        <SocialProof />
        <ScheduleDashboard />
        <AllFares />
        <RouteMap />
        <Faq />
      </main>

      <Footer />

      <BookingModal />
    </>
  );
}
