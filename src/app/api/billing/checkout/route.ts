/**
 * Creates a Stripe Checkout session for a Clubhouse subscription tier
 * (Member $10/mo or Founding Member $20/mo). Requires sign-in so we can
 * attach the customer id to the account on the webhook.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe, priceIdForTier, type SubscriptionTier } from '@/lib/billing/stripe'
import {
  getAccountById,
  setAccountStripeCustomerId,
} from '@/lib/store/local-store'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const tier: SubscriptionTier = body?.tier === 'founding' ? 'founding' : 'member'

  const stripe = getStripe()
  const priceId = priceIdForTier(tier)
  if (!stripe || !priceId) {
    const msg = tier === 'founding'
      ? 'Founding Member tier isn\'t configured yet. Try the Member tier or check back soon.'
      : 'Billing isn\'t configured yet. Check back soon.'
    return NextResponse.json({ error: msg }, { status: 503 })
  }

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'

  let customerId = account.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: account.email,
      name: account.name,
      metadata: { accountId: account.id, teamId: account.teamId },
    })
    customerId = customer.id
    await setAccountStripeCustomerId(account.id, customerId)
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/support?status=success`,
    cancel_url: `${baseUrl}/support?status=canceled`,
    metadata: {
      accountId: account.id,
      teamId: account.teamId,
      kind: 'subscription',
      tier,
    },
    subscription_data: {
      metadata: { accountId: account.id, teamId: account.teamId, tier },
    },
  })

  return NextResponse.json({ url: checkout.url })
}
