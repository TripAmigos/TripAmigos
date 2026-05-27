/**
 * Stripe client for TripAmigos
 * Server-side only — do not import in client components
 *
 * Lazy initialisation to avoid build-time errors when
 * the env var isn't available during static page collection.
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    _stripe = new Stripe(key)
  }
  return _stripe
}
