/**
 * Stripe client wrapper. Lazy-initialized; returns null if STRIPE_SECRET_KEY
 * isn't set so the build still works in local dev / Vercel preview without
 * billing configured.
 */

import Stripe from 'stripe'

let _client: Stripe | null | undefined

export function getStripe(): Stripe | null {
  if (_client !== undefined) return _client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    _client = null
    return null
  }
  _client = new Stripe(key, {
    // Pin a recent API version so behavior is deterministic.
    apiVersion: '2025-08-27.basil',
    typescript: true,
  })
  return _client
}

export const MEMBER_PRICE_USD_CENTS = 1000  // $10 / month
export const FOUNDING_PRICE_USD_CENTS = 2000  // $20 / month
export const TEAM_SHARE = 0.5  // 50% goes to Penn Men's Golf, 50% keeps the Clubhouse running

export type SubscriptionTier = 'member' | 'founding'

export function isBillingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID
}

export function isFoundingTierConfigured(): boolean {
  return !!process.env.STRIPE_FOUNDING_PRICE_ID
}

export function priceIdForTier(tier: SubscriptionTier): string | undefined {
  return tier === 'founding'
    ? process.env.STRIPE_FOUNDING_PRICE_ID
    : process.env.STRIPE_PRICE_ID
}
