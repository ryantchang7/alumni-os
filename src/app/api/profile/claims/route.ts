import { NextResponse } from 'next/server'
import { getProfileClaimRequestsForTeam, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 500 })
  }

  const claims = await getProfileClaimRequestsForTeam(team.id)
  return NextResponse.json({ claims })
}
