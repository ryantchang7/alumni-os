import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getProfileClaimRequestsForTeam, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 500 })
  }

  const claims = await getProfileClaimRequestsForTeam(team.id)
  return NextResponse.json({ claims })
}
