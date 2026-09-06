/**
 * The season keeping itself up to date, on a schedule.
 *
 * The work lives in @/lib/season/run-sync so this and the stale-page-view
 * trigger cannot drift apart. See that file for what a pass actually does.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session so it can
 * be run by hand. `?dryRun=1` reports what it would do and writes nothing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { alertFounders } from '@/lib/ops/alert'
import { runSeasonSync } from '@/lib/season/run-sync'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TEAM_SLUG = 'penn-mens-golf'

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'

  const { getTeamBySlug } = await import('@/lib/store/local-store')
  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? TEAM_SLUG
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const report = await runSeasonSync(team.id, { dryRun })
  return NextResponse.json({ ok: true, dryRun, ...report })
}

export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    await alertFounders(
      'season sync',
      String(e instanceof Error ? (e.stack ?? e.message) : e),
    )
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
