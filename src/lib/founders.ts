/**
 * Founders Wall data layer. Computes the list of Founding Members
 * (anyone whose account either matches the hardcoded program-founder
 * email allowlist or has an active subscription on the Founding Member
 * price). Used both by `/api/founders/route.ts` (client-side fetch)
 * and by server components like `/team-room/page.tsx` that render the
 * wall directly.
 *
 * Returns name + class label only — no email, no internal ids.
 * Sorted with the program Founder first, then alphabetical by name.
 */

import type { Store } from '@/lib/store/types'
import { getBadgesForAccount } from '@/lib/badges'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

export interface FounderEntry {
  name: string
  classLabel?: string
  isProgramFounder: boolean
  bookId: string | null
}

export function computeFoundersForTeam(
  store: Pick<Store, 'accounts' | 'people' | 'teamMemberships'>,
  teamId: string,
): FounderEntry[] {
  const founders: FounderEntry[] = []

  for (const account of store.accounts) {
    if (account.teamId !== teamId) continue
    const badges = getBadgesForAccount(account)
    if (!badges.includes('founding-member') && !badges.includes('founder')) continue

    const person = account.linkedPersonId
      ? store.people.find(p => p.id === account.linkedPersonId)
      : null
    const membership = person
      ? store.teamMemberships.find(m => m.personId === person.id && m.teamId === teamId)
      : null
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    const name = person?.canonicalName ?? account.name ?? 'Penn Golf Member'

    founders.push({
      name,
      classLabel: membership?.classLabel,
      isProgramFounder: badges.includes('founder'),
      bookId: bookEntry?.id ?? null,
    })
  }

  founders.sort((a, b) => {
    if (a.isProgramFounder !== b.isProgramFounder) return a.isProgramFounder ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return founders
}
