/**
 * POST /api/gatherings/[id]/attendees/add — the host puts people on the sheet.
 *
 * RSVPs come from the guest, which only works once someone has claimed a card.
 * A host organising a real round already knows who is playing, and most of the
 * roster has no account yet, so this writes the names directly with an
 * optional group label for the pairings.
 *
 * Host or founder only.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  readStore,
  addGatheringAttendees,
  WriteContentionError,
} from '@/lib/store/local-store'
import { FOUNDER_EMAILS } from '@/lib/badges'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await params
  const store = await readStore()
  const gathering = store.clubhouseGatherings.find(g => g.id === id)
  if (!gathering) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }

  const email = (session.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(email)
  const isHost =
    !!gathering.hostPersonId && gathering.hostPersonId === session.linkedPersonId
  if (!isHost && !isFounder) {
    return NextResponse.json(
      { error: 'Only the host can manage this sheet.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.people)) {
    return NextResponse.json({ error: 'people[] required' }, { status: 400 })
  }

  const people: Array<{ name: string; personId?: string; groupLabel?: string }> = []
  for (const raw of body.people as unknown[]) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 120) : ''
    if (!name) continue
    people.push({
      name,
      ...(typeof o.personId === 'string' ? { personId: o.personId } : {}),
      ...(typeof o.groupLabel === 'string'
        ? { groupLabel: o.groupLabel.trim().slice(0, 40) }
        : {}),
    })
    if (people.length >= 60) break
  }

  if (people.length === 0) {
    return NextResponse.json({ error: 'No valid people' }, { status: 400 })
  }

  try {
    const added = await addGatheringAttendees({
      gatheringId: id,
      teamId: gathering.teamId,
      people,
    })
    return NextResponse.json({ ok: true, count: added.length })
  } catch (e) {
    if (e instanceof WriteContentionError) {
      return NextResponse.json(
        { error: 'Busy right now. Try again in a moment.', retryable: true },
        { status: 503 },
      )
    }
    throw e
  }
}
