/**
 * /api/team-travel
 *
 * POST   — founder posts a team travel/tournament stop.
 * DELETE — founder removes a stop (?id=).
 *
 * POST body: { eventName, locationText, startDate, endDate?, note?, linkUrl? (leaderboard/results), courseUrl? (course site or maps), imageUrl? (crest) }.
 * GET    — public list (the schedule is public on the Team Room).
 * PATCH  — founder edits a stop in place (full editable set each call).
 */

import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { createTravelStop, deleteTravelStop, updateTravelStop, getTeamBySlug, getTravelStops } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

function cleanHttpUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const url = v.trim()
  if (!url || url.length > 1024) return undefined
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined
    return url
  } catch {
    return undefined
  }
}

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ stops: [] })
  return NextResponse.json({ stops: await getTravelStops(team.id) })
}

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : ''
  const locationText = typeof body.locationText === 'string' ? body.locationText.trim() : ''
  const startDate = typeof body.startDate === 'string' ? body.startDate.trim() : ''
  if (!eventName) return NextResponse.json({ error: 'eventName is required.' }, { status: 400 })
  if (!locationText) return NextResponse.json({ error: 'locationText is required.' }, { status: 400 })
  if (!startDate) return NextResponse.json({ error: 'startDate is required.' }, { status: 400 })

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 })

  const stop = await createTravelStop({
    teamId: team.id,
    eventName,
    locationText,
    startDate,
    endDate: typeof body.endDate === 'string' && body.endDate.trim() ? body.endDate.trim() : undefined,
    note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined,
    linkUrl: cleanHttpUrl(body.linkUrl),
    courseUrl: cleanHttpUrl(body.courseUrl),
    imageUrl: cleanHttpUrl(body.imageUrl),
  })

  return NextResponse.json({ ok: true, stop }, { status: 201 })
}

export async function PATCH(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = typeof body.id === 'string' ? body.id : ''
  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : ''
  const locationText = typeof body.locationText === 'string' ? body.locationText.trim() : ''
  const startDate = typeof body.startDate === 'string' ? body.startDate.trim() : ''
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  if (!eventName) return NextResponse.json({ error: 'eventName is required.' }, { status: 400 })
  if (!locationText) return NextResponse.json({ error: 'locationText is required.' }, { status: 400 })
  if (!startDate) return NextResponse.json({ error: 'startDate is required.' }, { status: 400 })

  const stop = await updateTravelStop(id, {
    eventName,
    locationText,
    startDate,
    endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
    note: typeof body.note === 'string' ? body.note : undefined,
    linkUrl: cleanHttpUrl(body.linkUrl),
    courseUrl: cleanHttpUrl(body.courseUrl),
    imageUrl: cleanHttpUrl(body.imageUrl),
    resultText: typeof body.resultText === 'string' ? body.resultText.slice(0, 200) : undefined,
  })
  if (!stop) return NextResponse.json({ error: 'Stop not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, stop })
}

export async function DELETE(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const ok = await deleteTravelStop(id)
  if (!ok) return NextResponse.json({ error: 'Stop not found.' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
