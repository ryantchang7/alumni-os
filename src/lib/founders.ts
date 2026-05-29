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
  // Dedupe purely by lowercased canonical name. The Founders Wall only
  // shows names, so two accounts that resolve to the same human (Ryan
  // signed in with both Penn + Gmail) must collapse to one row. The
  // prior version keyed on linkedPersonId-or-name, which would render
  // Ryan twice when only one of the two accounts had a linkedPersonId.
  const byKey = new Map<string, FounderEntry>()

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

    const key = name.toLowerCase().trim()
    const existing = byKey.get(key)
    const entry: FounderEntry = {
      name,
      classLabel: membership?.classLabel ?? existing?.classLabel,
      isProgramFounder:
        badges.includes('founder') || existing?.isProgramFounder === true,
      bookId: bookEntry?.id ?? existing?.bookId ?? null,
    }
    byKey.set(key, entry)
  }

  const founders = Array.from(byKey.values())
  founders.sort((a, b) => {
    if (a.isProgramFounder !== b.isProgramFounder) return a.isProgramFounder ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return founders
}

/**
 * Same shape as Founders, for Family & Affiliate tier subscribers (the
 * $15/mo "parent" tier on /support). Surfaced on the Founders Wall in a
 * sister tab so the recognition extends to the people supporting through
 * that path too.
 */
export interface FamilySupporterEntry {
  name: string
  /** "Parent of John Smith C'24" / "Affiliate since 2010" — what they
   *  entered on /parent-signup. */
  parentRelationship?: string
  bookId: string | null
}

export function computeFamilySupportersForTeam(
  store: Pick<Store, 'accounts' | 'people' | 'teamMemberships'>,
  teamId: string,
): FamilySupporterEntry[] {
  const byKey = new Map<string, FamilySupporterEntry>()

  for (const account of store.accounts) {
    if (account.teamId !== teamId) continue
    const badges = getBadgesForAccount(account)
    // Only "parent" tier subscribers — the visual recognition for the
    // Family & Affiliate plan. (Plain unsubscribed family/affiliate
    // signups don't earn this badge.)
    if (!badges.includes('parent')) continue

    const person = account.linkedPersonId
      ? store.people.find(p => p.id === account.linkedPersonId)
      : null
    const membership = person
      ? store.teamMemberships.find(m => m.personId === person.id && m.teamId === teamId)
      : null
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    const name = person?.canonicalName ?? account.name ?? 'Penn Golf Family'

    const key = name.toLowerCase().trim()
    const existing = byKey.get(key)
    byKey.set(key, {
      name,
      parentRelationship:
        membership?.parentRelationship ?? existing?.parentRelationship,
      bookId: bookEntry?.id ?? existing?.bookId ?? null,
    })
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}
