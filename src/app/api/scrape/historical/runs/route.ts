import { NextResponse } from 'next/server'
import {
  getTeamBySlug,
  getHistoricalImportRunsForTeam,
  getHistoricalSeasonResultsForRun,
} from '@/lib/store/local-store'
import { requireFounder } from '@/lib/auth/guards'

export async function GET(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const runs = await getHistoricalImportRunsForTeam(team.id)

  // Include season results for the most recent run
  const sorted = runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const latest = sorted[0]
  const latestSeasonResults = latest
    ? await getHistoricalSeasonResultsForRun(latest.id)
    : []

  return NextResponse.json({ runs: sorted, latestSeasonResults })
}
