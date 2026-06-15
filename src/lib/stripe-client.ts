import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    // No apiVersion here: the browser SDK uses the account default + the PaymentIntent's
    // version. Pinning it on the client makes Elements/PaymentElement fail to mount.
    // The API version is pinned server-side in src/lib/stripe.ts instead.
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
