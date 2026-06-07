import Stripe from 'stripe'

let client: Stripe | null = null

function getClient(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment')
  // Pin the API version so request/response shapes match the installed SDK's types.
  client = new Stripe(key, { apiVersion: '2026-04-22.dahlia', typescript: true })
  return client
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})
