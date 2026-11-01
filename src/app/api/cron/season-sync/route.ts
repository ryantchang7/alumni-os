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
import { livePrograms } from '@/lib/teams/programs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * One pass per live program. Each program syncs from its own Penn Athletics
 * schedule page and RSS feed, so the women's board never picks up a men's
 * result and vice versa.
 *
 * A program whose team row does not exist yet is skipped and reported, not
 * treated as a failure: the women's row is created separately, and until it
 * is there is simply nothing to sync.
 *
 * `?teamSlug=` still runs exactly one program, which is what `?reparse=`
 * needs, since a reparse targets one stop on one board.
 */
async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const reparse = req.nextUrl.searchParams.get('reparse')?.trim() || undefined
  const onlySlug = req.nextUrl.searchParams.get('teamSlug')?.trim() || undefined

  const { getTeamBySlug } = await import('@/lib/store/local-store')

  const targets = onlySlug
    ? livePrograms().filter((p) => p.slug === onlySlug)
    : livePrograms()
  if (onlySlug && targets.length === 0) {
    return NextResponse.json({ error: 'Unknown team slug' }, { status: 404 })
  }
  if (reparse && targets.length > 1) {
    return NextResponse.json(
      { error: 'reparse needs one program; pass teamSlug=' },
      { status: 400 },
    )
  }

  const programs: Record<string, unknown> = {}
  const skipped: string[] = []
  for (const prog of targets) {
    const team = await getTeamBySlug(prog.slug)
    if (!team) {
      skipped.push(prog.slug)
      continue
    }
    programs[prog.id] = await runSeasonSync(team.id, { dryRun, reparse, program: prog.id })
  }

  if (Object.keys(programs).length === 0) {
    return NextResponse.json(
      { ok: false, error: 'No live program has a team row yet', skipped },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true, dryRun, skipped, programs })
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
