/**
 * POST /api/me/follow-team
 *
 * An approved member follows/unfollows the current team. Followers get notified
 * (in-app + web push) when a new season update/result is posted.
 * Body: { value: boolean }.
 */

import { NextResponse } from 'next/server'
import { setFollowsTeam } from '@/lib/store/local-store'
import { requireApprovedMember } from '@/lib/auth/guards'

export async function POST(request: Request) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (typeof body.value !== 'boolean') {
    return NextResponse.json({ error: 'value (boolean) is required.' }, { status: 400 })
  }

  await setFollowsTeam(gate.session.accountId!, body.value)
  return NextResponse.json({ ok: true, value: body.value })
}
