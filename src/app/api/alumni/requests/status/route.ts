import { NextRequest, NextResponse } from 'next/server'
import type { PlayerAlumniRequest } from '@/lib/store/types'

// TODO: Production must verify the logged-in alumni owns personId before allowing status changes.

const VALID_STATUSES: PlayerAlumniRequest['status'][] = ['requested', 'seen', 'responded', 'closed']

export async function POST(request: NextRequest) {
  let body: {
    teamSlug?: string
    personId?: string
    requestId?: string
    status?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, requestId, status } = body

  if (!teamSlug || !personId || !requestId || !status) {
    return NextResponse.json(
      { error: 'teamSlug, personId, requestId, and status are required' },
      { status: 400 },
    )
  }

  if (!VALID_STATUSES.includes(status as PlayerAlumniRequest['status'])) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const {
    getTeamBySlug,
    getTeamMembershipsForTeam,
    readStore,
    updatePlayerAlumniRequestStatus,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  // Verify person is on team
  const memberships = await getTeamMembershipsForTeam(team.id)
  if (!memberships.find(m => m.personId === personId)) {
    return NextResponse.json({ error: 'Person not found on this team' }, { status: 404 })
  }

  // Verify request belongs to this alumni
  const store = await readStore()
  const req = store.playerAlumniRequests.find(r => r.id === requestId)
  if (!req || req.teamId !== team.id || req.alumniPersonId !== personId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const updated = await updatePlayerAlumniRequestStatus(
    requestId,
    status as PlayerAlumniRequest['status'],
  )

  return NextResponse.json({ request: { id: updated!.id, status: updated!.status, updatedAt: updated!.updatedAt } })
}
