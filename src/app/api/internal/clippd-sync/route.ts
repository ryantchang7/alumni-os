/**
 * Fill in exact Clippd leaderboard links on the season schedule.
 *
 * The schedule's fallback was a bare link to scoreboard.clippd.com, which
 * lands on the national homepage. This resolves each stop to its real
 * Clippd tournament and stores the link on the stop, so the Team Room shows
 * "View leaderboard" pointing at Penn's actual event.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session so it can
 * be re-run by hand when the schedule changes.
 *
 * GET  — dry run. Reports what it would set, writes nothing.
 * POST — writes. `?force=1` also overwrites links that are already set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { resolveStopLinks } from '@/lib/clippd/penn-tournaments'

const TEAM_SLUG = 'penn-mens-golf'

async function run(req: NextRequest, write: boolean) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = req.nextUrl.searchParams.get('force') === '1'
  const { getTeamBySlug, getTravelStops, updateTravelStop } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const stops = await getTravelStops(team.id)
  const targets = stops.filter(s => force || !s.linkUrl)
  const resolved = await resolveStopLinks(targets)

  const changes: Array<Record<string, unknown>> = []
  for (const stop of targets) {
    const hit = resolved.get(stop.id)
    if (!hit) {
      changes.push({ eventName: stop.eventName, matched: false })
      continue
    }
    changes.push({
      eventName: stop.eventName,
      matched: true,
      clippdName: hit.tournamentName,
      url: hit.url,
      previous: stop.linkUrl ?? null,
    })
    if (write) {
      // PATCH semantics replace the editable set, so every field is echoed
      // back; only linkUrl actually changes here.
      await updateTravelStop(stop.id, {
        eventName: stop.eventName,
        locationText: stop.locationText,
        startDate: stop.startDate,
        endDate: stop.endDate,
        note: stop.note,
        linkUrl: hit.url,
        courseUrl: stop.courseUrl,
        imageUrl: stop.imageUrl,
        resultText: stop.resultText,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun: !write,
    force,
    stopsTotal: stops.length,
    considered: targets.length,
    matched: changes.filter(c => c.matched).length,
    changes,
  })
}

export async function GET(req: NextRequest) {
  return run(req, false)
}

export async function POST(req: NextRequest) {
  return run(req, true)
}
