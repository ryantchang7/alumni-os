import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getTeamBySlug, getExtractedEntriesForTeam } from '@/lib/store/local-store'

export async function GET(request: Request) {
  const g = await requireFounder()
  if (!g.ok) return g.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const entries = await getExtractedEntriesForTeam(team.id)
  return NextResponse.json(entries)
}
