/**
 * Daily news refresh cron. Pulls the Penn Athletics RSS feed for men's
 * golf and upserts new items (dedupe by sourceUrl).
 *
 * Auth: Authorization: Bearer <CRON_SECRET>. Vercel Cron handles this
 * header automatically when CRON_SECRET is set.
 */

import { NextRequest, NextResponse } from 'next/server'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const header = req.headers.get('authorization') ?? ''
  if (header === `Bearer ${secret}`) return true
  // Also accept ?secret=... so the cron can be manually triggered from a
  // browser (useful for the first run after deploy).
  return req.nextUrl.searchParams.get('secret') === secret
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const { getTeamBySlug, upsertTeamNewsItems } = await import(
    '@/lib/store/local-store'
  )
  const { fetchPennGolfNews } = await import('@/lib/news/penn-golf-feed')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const items = await fetchPennGolfNews()
  const { added, updated, total } = await upsertTeamNewsItems(team.id, items)

  return NextResponse.json({
    ok: true,
    teamSlug,
    fetched: items.length,
    added,
    updated,
    total,
  })
}
