/**
 * Public read of the team's own season updates.
 *
 * The Team Room already renders these to signed-out visitors, so this is the
 * same content over an API. It exists because the Clubhouse home (/player) is
 * a client component and had no way to fetch them; the founder-only route at
 * /api/internal/season is for the editor and stays gated.
 *
 * Mirrors /api/team/news: no auth, teamSlug + limit, empty list on miss.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const limitRaw = req.nextUrl.searchParams.get('limit')
  const limit = limitRaw ? Math.min(20, Math.max(1, Number.parseInt(limitRaw, 10) || 6)) : 6

  const { getTeamBySlug, getSeasonUpdatesForTeam } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ updates: [] })

  const updates = await getSeasonUpdatesForTeam(team.id)
  return NextResponse.json({ updates: updates.slice(0, limit) })
}
