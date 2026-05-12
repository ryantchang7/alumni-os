import { NextResponse } from 'next/server'
import { getTeamBySlug, getPeopleForTeam, getTeamMembershipsForTeam } from '@/lib/store/local-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const [people, memberships] = await Promise.all([
    getPeopleForTeam(team.id),
    getTeamMembershipsForTeam(team.id),
  ])

  return NextResponse.json({ people, memberships })
}
