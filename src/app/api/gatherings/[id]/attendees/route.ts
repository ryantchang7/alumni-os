/**
 * GET /api/gatherings/[id]/attendees — list of approved members who have
 * RSVP'd to this gathering. Approved-members-only (we don't leak attendee
 * names to the public).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readStore } from '@/lib/store/local-store'
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
    const person = account?.linkedPersonId
      ? store.people.find(p => p.id === account.linkedPersonId)
      : undefined
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    return {
      requestId: r.id,
      accountId: account?.id ?? null,
      personId: person?.id ?? null,
      bookId: bookEntry?.id ?? null,
      name: person?.canonicalName ?? r.fromName,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt,
    }
  })

  return NextResponse.json({ attendees })
}
