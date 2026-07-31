/**
 * Tag resolution for Moments — maps a moment's tag ids to the accountIds
 * that should receive a personal "tagged you" notification.
 *
 * Book-id tags cover the whole Member Book; they resolve to an account
 * only when that member has claimed (bridged by normalized name).
 * Unclaimed tags still display on the card — they just have no inbox yet.
 */

import type { Store } from '@/lib/store/types'
import { getMemberById } from '@/lib/member-book/data'
import { findTeamStorePersonForBookEntry } from '@/lib/member-book/bridge'

export function resolveTaggedAccountIds(
  store: Store,
  taggedPersonIds: string[],
  taggedBookIds: string[],
): Set<string> {
  const personIds = new Set<string>(taggedPersonIds)
  for (const bookId of taggedBookIds) {
    const entry = getMemberById(bookId)
    if (!entry) continue
    const person = findTeamStorePersonForBookEntry(entry, store.people)
    if (person) personIds.add(person.id)
  }
  return new Set(
    store.accounts
      .filter(a => a.linkedPersonId && personIds.has(a.linkedPersonId))
      .map(a => a.id),
  )
}
