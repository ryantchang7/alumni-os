import { NextRequest, NextResponse } from 'next/server'

// Read fresh every time. This feed changes while people are looking at the
// page, and a cached copy means a new post does not show up and a deleted
// one does not go away.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const limitRaw = req.nextUrl.searchParams.get('limit')
  const limit = limitRaw ? Math.min(20, Math.max(1, Number.parseInt(limitRaw, 10) || 8)) : 8

  const { getTeamBySlug, getRecentTeamNewsItems } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ items: [] })

  const items = await getRecentTeamNewsItems(team.id, limit)
  return NextResponse.json({ items })
}
