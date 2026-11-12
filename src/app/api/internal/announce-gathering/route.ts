/**
 * POST /api/internal/announce-gathering — tell the club about a gathering
 * that is already on the board.
 *
 * Notification only ever fired when a gathering was created, so posting
 * anything meant choosing between mailing everyone that second and never
 * mailing them at all. The NYC happy hour needed the third option: put it
 * up, look at it, then send.
 *
 * Founder only, dry run by default. The dry run reports exactly who would
 * receive it and whether the send is geographic or club-wide, computed
 * with the same functions the real send uses, so the preview cannot
 * disagree with what goes out.
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { selectNearbyRecipients } from '@/lib/gatherings/nearby'
import { notifyNearbyMembers } from '@/lib/gatherings/notify'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    /* empty body is a dry run */
  }
  const gatheringId = typeof body.gatheringId === 'string' ? body.gatheringId : ''
  const confirm = body.confirm === true
  if (!gatheringId) {
    return NextResponse.json({ error: 'gatheringId required' }, { status: 400 })
  }

  const { readStore } = await import('@/lib/store/local-store')
  const store = await readStore()
  const gathering = store.clubhouseGatherings.find(g => g.id === gatheringId)
  if (!gathering) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }

  // The poster is excluded from their own announcement, exactly as on
  // create. Resolved from hostPersonId when the gathering has one.
  const hostAccountId = gathering.hostPersonId
    ? (store.accounts.find(a => a.linkedPersonId === gathering.hostPersonId)?.id ?? '')
    : ''

  const picked = selectNearbyRecipients({
    accounts: store.accounts,
    enrichments: store.personEnrichments,
    memberships: store.teamMemberships,
    gathering,
    hostAccountId,
  })

  const plan = {
    gathering: {
      id: gathering.id,
      title: gathering.title,
      dateText: gathering.dateText,
      venue: gathering.venue ?? null,
      place: [gathering.city, gathering.state].filter(Boolean).join(', ') || null,
    },
    reach: picked.reach,
    recipients: picked.recipients.length,
    withEmail: picked.recipients.filter(a => a.email).length,
  }

  if (!confirm) return NextResponse.json({ ok: true, dryRun: true, wouldSend: plan })

  // Awaited rather than deferred: a founder clicking send should get the
  // outcome, not a 200 that means "probably".
  await notifyNearbyMembers(gathering, hostAccountId, 'nearby', [])
  return NextResponse.json({ ok: true, sent: plan })
}
