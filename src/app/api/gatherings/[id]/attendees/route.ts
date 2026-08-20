/**
 * GET /api/gatherings/[id]/attendees — list of approved members who have
 * RSVP'd to this gathering. Approved-members-only (we don't leak attendee
 * names to the public).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  readStore,
  updateClubhouseGatheringRequestGroup,
  renameGatheringGroup,
} from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface AttendeeOut {
  requestId: string
  accountId: string | null
  personId: string | null
  bookId: string | null
  name: string
  note?: string
  status: 'requested' | 'accepted' | 'declined' | 'closed'
  groupLabel?: string
  createdAt: string
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only.' },
      { status: 403 },
    )
  }

  const { id } = await params
  const store = await readStore()
  const gathering = store.clubhouseGatherings.find(g => g.id === id)
  if (!gathering) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }

  const reqs = store.clubhouseGatheringRequests
    .filter(r => r.gatheringId === id && r.status !== 'declined' && r.status !== 'closed')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const attendees: AttendeeOut[] = reqs.map(r => {
    const account = r.fromAccountId
      ? store.accounts.find(a => a.id === r.fromAccountId)
      : undefined
    // Prefer the account's linked person; fall back to the person the host
    // named directly, which is how the roster gets on a sheet before anyone
    // has claimed a card.
    const personId = account?.linkedPersonId ?? r.fromPersonId
    const person = personId ? store.people.find(p => p.id === personId) : undefined
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    return {
      requestId: r.id,
      accountId: account?.id ?? null,
      personId: person?.id ?? null,
      bookId: bookEntry?.id ?? null,
      name: person?.canonicalName ?? r.fromName,
      note: r.note,
      status: r.status,
      groupLabel: r.groupLabel,
      createdAt: r.createdAt,
    }
  })

  return NextResponse.json({ attendees })
}

/** Keeps a label short enough to read on a card, and non-abusive. */
const MAX_LABEL = 40

/**
 * PATCH /api/gatherings/[id]/attendees — the host rearranges their tee sheet.
 *
 * Two shapes, because a host thinks in both:
 *   { requestId, groupLabel }      move one person (empty label = ungroup them)
 *   { group, renameTo }            rename a whole group (empty renameTo = dissolve it)
 *
 * Only the host of this gathering may do either. Dissolving a group never
 * removes anyone from the sheet — that stays a separate, deliberate action.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only.' }, { status: 403 })
  }

  const { id } = await params
  const store = await readStore()
  const gathering = store.clubhouseGatherings.find(g => g.id === id)
  if (!gathering) {
    return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  }
  if (!gathering.hostPersonId || gathering.hostPersonId !== session.linkedPersonId) {
    return NextResponse.json({ error: 'Only the host can change the sheet.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const clean = (v: unknown) =>
    typeof v === 'string' ? v.trim().slice(0, MAX_LABEL) : undefined

  // Shape 2: act on a whole group.
  if (typeof body.group === 'string') {
    const from = body.group.trim()
    if (!from) {
      return NextResponse.json({ error: 'Name the group to change.' }, { status: 400 })
    }
    const moved = await renameGatheringGroup(id, from, clean(body.renameTo))
    return NextResponse.json({ ok: true, moved })
  }

  // Shape 1: move one person.
  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : ''
  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 })
  }
  const rsvp = store.clubhouseGatheringRequests.find(r => r.id === requestId)
  if (!rsvp || rsvp.gatheringId !== id) {
    return NextResponse.json({ error: 'Not on this sheet.' }, { status: 404 })
  }

  const updated = await updateClubhouseGatheringRequestGroup(requestId, clean(body.groupLabel))
  if (!updated) {
    return NextResponse.json({ error: 'Not on this sheet.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, groupLabel: updated.groupLabel ?? null })
}
