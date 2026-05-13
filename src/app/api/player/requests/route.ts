import { NextRequest, NextResponse } from 'next/server'
import type { PlayerAlumniRequest } from '@/lib/store/types'

const VALID_PURPOSES: PlayerAlumniRequest['purpose'][] = [
  'career_advice',
  'coffee_chat',
  'mentorship',
  'golf_connection',
]

export async function POST(request: NextRequest) {
  let body: {
    teamSlug?: string
    alumniPersonId?: string
    fromName?: string
    fromEmail?: string
    purpose?: string
    message?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, alumniPersonId, fromName, purpose, message, fromEmail } = body

  if (!teamSlug || !alumniPersonId || !fromName || !purpose || !message) {
    return NextResponse.json(
      { error: 'teamSlug, alumniPersonId, fromName, purpose, and message are required' },
      { status: 400 },
    )
  }

  if (!VALID_PURPOSES.includes(purpose as PlayerAlumniRequest['purpose'])) {
    return NextResponse.json({ error: 'Invalid purpose value' }, { status: 400 })
  }

  if (fromName.trim().length < 2) {
    return NextResponse.json({ error: 'fromName must be at least 2 characters' }, { status: 400 })
  }

  if (message.trim().length < 10) {
    return NextResponse.json({ error: 'message must be at least 10 characters' }, { status: 400 })
  }

  const {
    getTeamBySlug,
    getTeamMembershipsForTeam,
    readStore,
    createPlayerAlumniRequest,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === alumniPersonId)

  if (!membership) {
    return NextResponse.json({ error: 'Alumni not found on this team' }, { status: 404 })
  }

  if (!membership.publishedToNetwork) {
    return NextResponse.json(
      { error: 'This alumni is not available for requests' },
      { status: 403 },
    )
  }

  const store = await readStore()
  const enrichment = store.personEnrichments.find(
    e => e.personId === alumniPersonId && e.teamId === team.id,
  )

  if (enrichment?.visibleToPlayers === false) {
    return NextResponse.json(
      { error: 'This alumni is not available for requests' },
      { status: 403 },
    )
  }

  const req = await createPlayerAlumniRequest({
    teamId: team.id,
    alumniPersonId,
    fromName: fromName.trim(),
    fromEmail: fromEmail?.trim() || undefined,
    purpose: purpose as PlayerAlumniRequest['purpose'],
    message: message.trim(),
  })

  return NextResponse.json({
    request: {
      id: req.id,
      alumniPersonId: req.alumniPersonId,
      fromName: req.fromName,
      purpose: req.purpose,
      status: req.status,
      createdAt: req.createdAt,
    },
  })
}
