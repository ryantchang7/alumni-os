/**
 * Seed a program's season board with the events Penn has already played,
 * their results and their event logos.
 *
 * The hourly sync deliberately never back-fills a finished event, which is
 * right for a board that has been running all season and wrong exactly once:
 * the first time a program gets a board at all. The women's board was created
 * in November, so without this their autumn simply would not exist on the
 * site. This is the one-time pass that fixes that, and it is safe to run
 * again because of the rules below.
 *
 * What it will not do:
 *
 * - **It never overwrites a value that is already set.** A stop that has a
 *   result, a logo or a note keeps them. The only writes are to fields that
 *   are currently empty, plus creating a stop that is missing entirely.
 * - Because `updateTravelStop` replaces every field it is given, each patch
 *   is built from the stop's own current values and then adds the missing
 *   one. The venue-map backfill once rewrote all nine men's stops by
 *   assuming the opposite, so the before values are also returned in the
 *   response for every stop it touches.
 * - It matches an event to an existing stop with the same `sameEvent` the
 *   sync uses, so it cannot create a duplicate of a stop already on a board
 *   under Penn's slightly different spelling.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session.
 * `?program=` defaults to womens. `?dryRun=1` writes nothing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { PROGRAMS, type ProgramId } from '@/lib/teams/programs'
import {
  parsePennSchedule,
  parsePennScheduleRows,
  sameEvent,
  eventTokens,
} from '@/lib/season/penn-schedule'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Shared-token overlap, the same idea `sameEvent` uses for names. */
function nameMatches(a: string, b: string): boolean {
  const ta = eventTokens(a)
  const tb = eventTokens(b)
  if (ta.size === 0 || tb.size === 0) return false
  const shared = [...ta].filter((w) => tb.has(w)).length
  return shared >= Math.min(ta.size, tb.size)
}

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const raw = req.nextUrl.searchParams.get('program') ?? 'womens'
  if (raw !== 'mens' && raw !== 'womens') {
    return NextResponse.json({ error: 'program must be mens or womens' }, { status: 400 })
  }
  const program = raw as ProgramId
  if (!PROGRAMS[program].live) {
    return NextResponse.json({ error: 'program is not live' }, { status: 409 })
  }

  const { getTeamBySlug, getTravelStops, createTravelStop, updateTravelStop } =
    await import('@/lib/store/local-store')

  const team = await getTeamBySlug(PROGRAMS[program].slug)
  if (!team) {
    return NextResponse.json(
      { error: 'No team row. Run /api/cron/ensure-programs first.' },
      { status: 409 },
    )
  }

  const res = await fetch(PROGRAMS[program].scheduleUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PennGolfClubhouse/1.0)' },
    cache: 'no-store',
  })
  if (!res.ok) {
    return NextResponse.json({ error: `Penn schedule HTTP ${res.status}` }, { status: 502 })
  }
  const html = await res.text()
  const events = parsePennSchedule(html)
  const rows = parsePennScheduleRows(html)

  const created: unknown[] = []
  const filled: unknown[] = []
  const untouched: string[] = []

  for (const event of events) {
    const row = rows.find((r) => nameMatches(r.eventName, event.eventName))
    const stops = await getTravelStops(team.id)
    const existing = stops.find((s) => sameEvent(event, s))

    if (!existing) {
      const plan = {
        eventName: event.eventName,
        locationText: event.locationText,
        startDate: event.startDate,
        endDate: event.endDate !== event.startDate ? event.endDate : undefined,
        note: event.note,
        imageUrl: row?.logoUrl,
        resultText: row?.resultText,
      }
      if (!dryRun) {
        const stop = await createTravelStop({ teamId: team.id, ...plan })
        if (row?.resultText) {
          // createTravelStop has no resultText, so set it with a patch built
          // from the stop that was just written, not from a blank object.
          await updateTravelStop(stop.id, {
            eventName: stop.eventName,
            locationText: stop.locationText,
            startDate: stop.startDate,
            endDate: stop.endDate,
            note: stop.note,
            linkUrl: stop.linkUrl,
            courseUrl: stop.courseUrl,
            imageUrl: stop.imageUrl,
            resultText: row.resultText,
          })
        }
      }
      created.push(plan)
      continue
    }

    const needsLogo = !existing.imageUrl && !!row?.logoUrl
    const needsResult = !existing.resultText && !!row?.resultText
    if (!needsLogo && !needsResult) {
      untouched.push(existing.eventName)
      continue
    }

    const before = { imageUrl: existing.imageUrl, resultText: existing.resultText }
    if (!dryRun) {
      await updateTravelStop(existing.id, {
        eventName: existing.eventName,
        locationText: existing.locationText,
        startDate: existing.startDate,
        endDate: existing.endDate,
        note: existing.note,
        linkUrl: existing.linkUrl,
        courseUrl: existing.courseUrl,
        imageUrl: needsLogo ? row!.logoUrl : existing.imageUrl,
        resultText: needsResult ? row!.resultText : existing.resultText,
      })
    }
    filled.push({
      eventName: existing.eventName,
      before,
      after: {
        imageUrl: needsLogo ? row!.logoUrl : existing.imageUrl,
        resultText: needsResult ? row!.resultText : existing.resultText,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    program,
    pennEvents: events.length,
    created,
    filled,
    untouched,
  })
}

export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
