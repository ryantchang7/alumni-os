/**
 * POST /api/push/unsubscribe — remove the caller's Web Push subscription.
 * Body: { endpoint: string }
 *
 * Scoped to the caller's account: only a subscription owned by the caller is
 * removed, so a member can't delete someone else's subscription.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { removePushSubscription } from '@/lib/store/local-store'

export async function POST(request: Request) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: { endpoint?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : ''
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
  }

  const removed = await removePushSubscription(g.session.accountId!, endpoint)
  return NextResponse.json({ ok: true, removed })
}
