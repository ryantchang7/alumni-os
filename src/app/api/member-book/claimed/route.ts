/**
 * Which Member Book cards have been claimed.
 *
 * Public, and deliberately minimal: Member Book ids and nothing else. No
 * names, no person ids, no account ids, no dates. The book already publishes
 * every name on it; this adds only the fact that a card has an owner.
 *
 * It exists because the grid asked "Is this you?" on every card, including
 * cards belonging to members who had already claimed them. `/api/player/
 * profiles`, the only source the grid had, answers with an empty list to
 * anyone not approved, so a signed-out visitor could never be told which
 * cards were taken.
 */

import { NextResponse } from 'next/server'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { readStore } = await import('@/lib/store/local-store')
  const store = await readStore()

  const bookIds = new Set<string>()
  for (const account of store.accounts) {
    if (!account.linkedPersonId) continue
    const person = store.people.find(p => p.id === account.linkedPersonId)
    if (!person) continue
    const entry = findBookEntryForTeamStorePerson(person.canonicalName)
    if (entry) bookIds.add(entry.id)
  }

  return NextResponse.json({ bookIds: [...bookIds] })
}
