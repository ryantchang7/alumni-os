/**
 * Opens the Stripe customer portal so a subscriber can update card,
 * cancel, or view invoices. Requires sign-in + an existing customer id.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/billing/stripe'
import { getAccountById } from '@/lib/store/local-store'

export async function POST() {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }
  const account = await getAccountById(session.accountId)
  if (!account?.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 })
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
  const portal = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${baseUrl}/support`,
  })
  return NextResponse.json({ url: portal.url })
}
