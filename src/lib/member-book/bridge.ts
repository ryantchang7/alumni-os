// Bridge: Member Book entry <-> team-store person.
//
// The Member Book is the historical registry (read-only JSON archive).
// The team-store is the live database of editable profiles.
// Many people exist in both; this helper joins them by normalized name.

import type { MemberBookEntry } from './types'
import { memberBookEntries } from './data'
import { isPublicMember } from './helpers'

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

export interface BridgeStorePerson {
  id: string
  canonicalName: string
}

/**
 * Find the team-store person record for a Member Book entry, if one exists.
 * Matches by normalized canonical name (lowercase, alpha-only).
 */
export function findTeamStorePersonForBookEntry<
  P extends BridgeStorePerson,
>(entry: MemberBookEntry, people: readonly P[]): P | null {
  const target = normalizeName(entry.displayName)
  return people.find((p) => normalizeName(p.canonicalName) === target) ?? null
}

/**
 * Find the Member Book entry for a team-store person record, if one exists
 * in the public Member Book (managers excluded).
 */
export function findBookEntryForTeamStorePerson(
  canonicalName: string,
): MemberBookEntry | null {
  const target = normalizeName(canonicalName)
  return (
    memberBookEntries.find(
      (m) => isPublicMember(m) && normalizeName(m.displayName) === target,
    ) ?? null
  )
}
