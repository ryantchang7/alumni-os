/**
 * Stripe webhook for billing events. Updates subscription state on the
 * account and records one-time donations.
 *
 * Configure in Stripe: webhook endpoint URL = /api/billing/webhook,
 * events: checkout.session.completed, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted.
 * Then set STRIPE_WEBHOOK_SECRET on Vercel.
 *
 * NOTE: Next.js App Router needs the raw body for Stripe signature
 * verification — we read the request as text and pass to constructEvent.
 */

import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe'
import {
  getAccountByStripeCustomerId,
  getAccountById,
  setAccountStripeCustomerId,
  updateAccountSubscription,
  recordDonation,
  getTeamBySlug,
} from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature') ?? ''
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ error: `Bad signature: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const kind = s.metadata?.kind
        const accountId = s.metadata?.accountId
        const teamId = s.metadata?.teamId

        if (kind === 'subscription' && accountId && typeof s.customer === 'string') {
          await setAccountStripeCustomerId(accountId, s.customer)
        }

        if (kind === 'donation') {
          const team = await getTeamBySlug(TEAM_SLUG)
          if (team) {
            await recordDonation({
              teamId: teamId ?? team.id,
              accountId: accountId || undefined,
              donorEmail: s.customer_details?.email ?? s.customer_email ?? 'unknown@unknown',
              donorName: s.customer_details?.name ?? undefined,
              amountCents: s.amount_total ?? Number(s.metadata?.amountCents ?? 0),
              currency: s.currency ?? 'usd',
              stripeCheckoutSessionId: s.id,
              stripePaymentIntentId:
                typeof s.payment_intent === 'string' ? s.payment_intent : undefined,
            })
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        let account = await getAccountByStripeCustomerId(customerId)
        // Fallback: subscription metadata may have the account id.
        if (!account && sub.metadata?.accountId) {
          account = await getAccountById(sub.metadata.accountId)
          if (account) await setAccountStripeCustomerId(account.id, customerId)
        }
        if (!account) break

        if (event.type === 'customer.subscription.deleted') {
          await updateAccountSubscription(account.id, null)
        } else {
          const item = sub.items.data[0]
          const status = sub.status as
            | 'active'
            | 'trialing'
            | 'past_due'
            | 'canceled'
            | 'incomplete'
          // `current_period_end` lives on the subscription's first item in
          // recent API versions; fall back to (sub as any) for older shapes.
          const subAny = sub as unknown as { current_period_end?: number }
          const periodEndSeconds =
            (item as unknown as { current_period_end?: number }).current_period_end ??
            subAny.current_period_end
          await updateAccountSubscription(account.id, {
            status,
            priceId: item?.price.id ?? '',
            currentPeriodEnd: periodEndSeconds
              ? new Date(periodEndSeconds * 1000).toISOString()
              : undefined,
            canceledAt: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : undefined,
          })
        }
        break
      }

      default:
        // Ignore unhandled event types.
        break
    }
  } catch (e) {
    console.error('[billing-webhook] handler failed:', e)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
