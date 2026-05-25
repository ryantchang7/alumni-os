import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  // Member-only — only an approved (linked) account can RSVP.
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card to RSVP.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const teamSlug = typeof body.teamSlug === 'string' ? body.teamSlug : 'penn-mens-golf'
  const gatheringId = typeof body.gatheringId === 'string' ? body.gatheringId.trim() : ''
  const fromName = typeof body.fromName === 'string' ? body.fromName.trim() : ''
  const fromEmail = typeof body.fromEmail === 'string' ? body.fromEmail.trim() : undefined
  const note = typeof body.note === 'string' ? body.note.trim() : undefined

  if (!gatheringId) return NextResponse.json({ error: 'gatheringId required' }, { status: 400 })
  if (!fromName) return NextResponse.json({ error: 'fromName required' }, { status: 400 })
  if (fromName.length > 100) return NextResponse.json({ error: 'fromName too long' }, { status: 400 })
  if (note && note.length > 500) return NextResponse.json({ error: 'note too long' }, { status: 400 })

  const { getTeamBySlug, getClubhouseGatheringById, createClubhouseGatheringRequest } =
    await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const gathering = await getClubhouseGatheringById(gatheringId)
  if (!gathering || gathering.teamId !== team.id) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }
  if (gathering.status !== 'open') {
    return NextResponse.json({ error: 'Gathering is not open' }, { status: 409 })
  }

  const req = await createClubhouseGatheringRequest({
    gatheringId,
    teamId: team.id,
    fromName,
    fromEmail,
    note,
  })

  return NextResponse.json({ request: req }, { status: 201 })
}
