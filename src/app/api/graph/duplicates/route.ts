import { NextResponse } from 'next/server'
import { getTeamBySlug } from '@/lib/store/local-store'
import { findDuplicateCandidates } from '@/lib/store/graph-quality'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')
  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing teamSlug' }, { status: 400 })
  }
  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }
  const candidates = await findDuplicateCandidates(team.id)
  return NextResponse.json({ candidates })
}
