import { NextResponse } from 'next/server'
import { createProfileClaimRequest, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { memberId, requesterName, requesterEmail, pennGolfYears, note } = body as Record<string, unknown>

  if (!memberId || typeof memberId !== 'string') {
    return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
  }
  if (!requesterName || typeof requesterName !== 'string' || !requesterName.trim()) {
    return NextResponse.json({ error: 'Missing requesterName' }, { status: 400 })
  }
  if (!requesterEmail || typeof requesterEmail !== 'string' || !requesterEmail.includes('@')) {
    return NextResponse.json({ error: 'Invalid requesterEmail' }, { status: 400 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 500 })
  }

  const claim = await createProfileClaimRequest({
    teamId: team.id,
    memberId,
    requesterName: String(requesterName).trim(),
    requesterEmail: String(requesterEmail).trim().toLowerCase(),
    pennGolfYears: pennGolfYears ? String(pennGolfYears).trim() : undefined,
    note: note ? String(note).trim() : undefined,
  })

  return NextResponse.json({ claim }, { status: 201 })
}
