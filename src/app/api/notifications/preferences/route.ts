/**
 * POST /api/notifications/preferences — update the caller's notification
 * preferences. Currently just the community-updates mute.
 * Body: { mutedCommunity: boolean }
 *
 * Scoped to the caller's own account. Personal notifications (a request
 * addressed to you, your claim approved) ignore this flag — only community
 * broadcasts (new member, new moment) honor it.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { setMutedCommunityNotifications } from '@/lib/store/local-store'

export async function POST(request: Request) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: { mutedCommunity?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.mutedCommunity !== 'boolean') {
    return NextResponse.json({ error: 'mutedCommunity must be a boolean' }, { status: 400 })
  }

  const account = await setMutedCommunityNotifications(g.session.accountId!, body.mutedCommunity)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    mutedCommunity: account.mutedCommunityNotifications === true,
  })
}
