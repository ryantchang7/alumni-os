/**
 * Daily news refresh cron. Pulls the Penn Athletics RSS feed for men's
 * golf and upserts new items (dedupe by sourceUrl).
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (header-only, constant-time
 * compared). Vercel Cron handles this header automatically when CRON_SECRET
 * is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'

export async function GET(req: NextRequest) {
  // Cron secret OR a founder session — so news can be pulled on demand when
  // Penn Athletics posts something, instead of waiting for the daily run.
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
