/**
 * Lightweight status for the /support page — tells the UI whether
 * billing is configured + whether the viewer is already subscribed.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isBillingConfigured, isFoundingTierConfigured } from '@/lib/billing/stripe'
import { getAccountById } from '@/lib/store/local-store'

export async function GET() {
  const session = await auth()
  const configured = isBillingConfigured()
  const foundingConfigured = isFoundingTierConfigured()
  let subscribed = false
  let tier: 'member' | 'founding' | null = null
  if (session?.accountId) {
    const account = await getAccountById(session.accountId)
    subscribed = account?.subscription?.status === 'active' || account?.subscription?.status === 'trialing'
    if (subscribed) {
      const subPriceId = account?.subscription?.priceId
      if (subPriceId && subPriceId === process.env.STRIPE_FOUNDING_PRICE_ID) tier = 'founding'
      else if (subPriceId) tier = 'member'
    }
  }
  return NextResponse.json({
    configured,
    foundingConfigured,
    signedIn: !!session?.accountId,
    subscribed,
    tier,
  })
}
