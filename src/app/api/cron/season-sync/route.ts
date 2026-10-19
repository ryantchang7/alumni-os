/**
 * The season keeping itself up to date, on a schedule.
 *
 * The work lives in @/lib/season/run-sync so this and the stale-page-view
 * trigger cannot drift apart. See that file for what a pass actually does.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session so it can
 * be run by hand. `?dryRun=1` reports what it would do and writes nothing.
 *
 * `?reparse=<stop id or part of an event name>` re-reads one finished
 * event's recap and overwrites the result already on it. Normal passes never
 * touch a result that is already set, which is right nearly always and wrong
 * in one case: the parser itself wrote a bad value and has since been fixed.
 * That happened — a match-play margin, "finished 5 down", was stored as 5th
 * for St Andrews, where Penn actually finished 4th. This is the way to
 * correct it from the source rather than by retyping. One stop at a time,
 * and it refuses a name that matches none or several.
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
  const reparse = req.nextUrl.searchParams.get('reparse')?.trim() || undefined

  const { getTeamBySlug } = await import('@/lib/store/local-store')
  const teamSlug = req.nextUrl.searchParams.get('teamSlug') ?? TEAM_SLUG
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const report = await runSeasonSync(team.id, { dryRun, reparse })
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
