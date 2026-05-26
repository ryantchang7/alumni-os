/**
 * Creates a Stripe Checkout session for a one-time donation. Amount in
 * USD comes from the request body. Open to anyone — no sign-in required
 * (lower friction for one-off gifts).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/billing/stripe'
import { getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'
const MIN_USD_CENTS = 500    // $5 minimum
const MAX_USD_CENTS = 1_000_000  // $10,000 cap to keep this sane

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Donations not configured yet — try again later.' },
      { status: 503 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const amountUsd = Number(body.amountUsd)
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: 'amountUsd required' }, { status: 400 })
  }
  const amountCents = Math.round(amountUsd * 100)
  if (amountCents < MIN_USD_CENTS) {
    return NextResponse.json({ error: 'Minimum donation is $5.' }, { status: 400 })
  }
  if (amountCents > MAX_USD_CENTS) {
    return NextResponse.json({ error: 'Donation too large for online checkout.' }, { status: 400 })
  }

  const session = await auth()
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alumni-os.vercel.app'

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: 'Penn Golf Clubhouse — Donation',
            description: 'A one-time contribution to the Penn Men’s Golf program and the Clubhouse.',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/support?status=thanks`,
    cancel_url: `${baseUrl}/support?status=canceled`,
    customer_email: session?.user?.email ?? undefined,
    metadata: {
      kind: 'donation',
      accountId: session?.accountId ?? '',
      teamId: team.id,
      amountCents: String(amountCents),
    },
  })

  return NextResponse.json({ url: checkout.url })
}
