/**
 * Creates a Stripe Checkout session for the $10/mo Founding Member
 * subscription. Requires sign-in (so we can attach the customer id to
 * the account on webhook). Linking-not-required: any signed-in user
 * can subscribe to support the program.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/billing/stripe'
import {
  getAccountById,
  setAccountStripeCustomerId,
} from '@/lib/store/local-store'

export async function POST() {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: 'Billing not configured yet — try again later.' },
      { status: 503 },
    )
  }

  const account = await getAccountById(session.accountId)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alumni-os.vercel.app'

  // Reuse customer id if we have one — otherwise let Stripe create one
  // (we pick it up on the webhook).
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
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/support?status=success`,
    cancel_url: `${baseUrl}/support?status=canceled`,
    metadata: { accountId: account.id, teamId: account.teamId, kind: 'subscription' },
    subscription_data: {
      metadata: { accountId: account.id, teamId: account.teamId },
    },
  })

  return NextResponse.json({ url: checkout.url })
}
