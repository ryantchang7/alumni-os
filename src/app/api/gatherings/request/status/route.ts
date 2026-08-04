import { NextRequest, NextResponse } from 'next/server'
import { requireApprovedMember, requireCaptain } from '@/lib/auth/guards'

const VALID_STATUSES = ['accepted', 'declined', 'closed'] as const

export async function POST(request: NextRequest) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : ''
  const status = body.status as string

  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { updateClubhouseGatheringRequestStatus, getClubhouseGatheringById, readStore } =
    await import('@/lib/store/local-store')

  // Ownership: only the gathering's host may accept/decline/close RSVPs to it.
  // Captains may act on any gathering. Resolve request → gathering → host.
  const store = await readStore()
  const rsvp = store.clubhouseGatheringRequests.find(r => r.id === requestId)
  if (!rsvp) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const gathering = await getClubhouseGatheringById(rsvp.gatheringId)
  if (!gathering) return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })

  if (gathering.hostPersonId !== g.session.linkedPersonId) {
    const captain = await requireCaptain()
    if (!captain.ok) {
      return NextResponse.json(
        { error: 'Only the host or a captain can respond to this RSVP' },
        { status: 403 },
      )
    }
  }

  const updated = await updateClubhouseGatheringRequestStatus(
    requestId,
    status as (typeof VALID_STATUSES)[number],
  )

  if (!updated) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  // Tell the guest. The host answering was previously invisible to the person
  // who asked in — the same silent-loop pattern as the Ask flow.
  if (updated.fromAccountId && (status === 'accepted' || status === 'declined')) {
    try {
      const { notify } = await import('@/lib/notifications/notify')
      await notify(updated.fromAccountId, {
        type: 'request',
        title:
          status === 'accepted'
            ? `You're on the sheet — ${gathering.title}`
            : `${gathering.title} is full`,
        body:
          status === 'accepted'
            ? `${gathering.dateText}${gathering.venue ? ` · ${gathering.venue}` : ''}`
            : 'The host passed this time. Plenty more on the board.',
        href: `/gatherings/${gathering.id}`,
      })
    } catch (e) {
      console.warn('[rsvp-status-notify] failed:', e)
    }
  }

  return NextResponse.json({ request: updated })
}
