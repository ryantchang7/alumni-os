/**
 * Lightweight status for the /support page — tells the UI whether
 * billing is configured + whether the viewer is already subscribed.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isBillingConfigured } from '@/lib/billing/stripe'
import { getAccountById } from '@/lib/store/local-store'

export async function GET() {
  const session = await auth()
  const configured = isBillingConfigured()
  let subscribed = false
  if (session?.accountId) {
    const account = await getAccountById(session.accountId)
    subscribed = account?.subscription?.status === 'active' || account?.subscription?.status === 'trialing'
  }
  return NextResponse.json({
    configured,
    signedIn: !!session?.accountId,
    subscribed,
  })
}
