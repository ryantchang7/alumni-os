import { NextRequest, NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import type { PlayerAlumniRequest } from '@/lib/store/types'

const VALID_STATUSES: PlayerAlumniRequest['status'][] = [
  'seen', 'accepted', 'declined', 'suggested', 'responded', 'closed',
]

export async function POST(request: NextRequest) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: {
    teamSlug?: string
    personId?: string
    requestId?: string
    status?: string
    responseMessage?: string
    suggestedPersonId?: string
    suggestedPersonName?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, requestId, status, responseMessage, suggestedPersonId, suggestedPersonName } = body

  if (!teamSlug || !personId || !requestId || !status) {
    return NextResponse.json(
      { error: 'teamSlug, personId, requestId, and status are required' },
      { status: 400 },
    )
  }

  // Ownership: a member may only respond to requests addressed to their own
  // linked alumni profile. The request→personId match is enforced below
  // (req.alumniPersonId === personId), so binding personId to the caller
  // guarantees the request belongs to them.
  if (personId !== g.session.linkedPersonId) {
    return NextResponse.json(
      { error: 'You can only respond to requests addressed to you' },
      { status: 403 },
    )
  }

  if (!VALID_STATUSES.includes(status as PlayerAlumniRequest['status'])) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  if (responseMessage && responseMessage.trim().length > 1000) {
    return NextResponse.json({ error: 'responseMessage must be 1000 characters or fewer' }, { status: 400 })
  }

  if (status === 'suggested' && !suggestedPersonId && !suggestedPersonName) {
    return NextResponse.json(
      { error: 'suggestedPersonId or suggestedPersonName is required when status is suggested' },
      { status: 400 },
    )
  }

  const {
    getTeamBySlug,
    getTeamMembershipsForTeam,
    readStore,
    respondToPlayerAlumniRequest,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const memberships = await getTeamMembershipsForTeam(team.id)
  if (!memberships.find(m => m.personId === personId)) {
    return NextResponse.json({ error: 'Person not found on this team' }, { status: 404 })
  }

  const store = await readStore()
  const req = store.playerAlumniRequests.find(r => r.id === requestId)
  if (!req || req.teamId !== team.id || req.alumniPersonId !== personId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Validate suggestedPersonId belongs to team if provided
  if (suggestedPersonId) {
    const isMember = memberships.find(m => m.personId === suggestedPersonId)
    if (!isMember) {
      return NextResponse.json({ error: 'Suggested person not found on this team' }, { status: 404 })
    }
  }

  const updated = await respondToPlayerAlumniRequest({
    requestId,
    status: status as PlayerAlumniRequest['status'],
    responseMessage: responseMessage?.trim() || undefined,
    suggestedPersonId: suggestedPersonId || undefined,
    suggestedPersonName: suggestedPersonName?.trim() || undefined,
  })

  return NextResponse.json({
    request: {
      id: updated!.id,
      status: updated!.status,
      respondedAt: updated!.respondedAt,
      closedAt: updated!.closedAt,
      updatedAt: updated!.updatedAt,
    },
  })
}
