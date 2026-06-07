import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ShuttleTracker from '@/components/ShuttleTracker';
import SocialProof from '@/components/SocialProof';
import ScheduleDashboard from '@/components/ScheduleDashboard';
import RouteMap from '@/components/RouteMap';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import JsonLd from '@/components/JsonLd';
import { faqSchema } from '@/lib/seo';

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
        <RouteMap />
        <Faq />
      </main>

      <Footer />

      <BookingModal />
    </>
  );
}
