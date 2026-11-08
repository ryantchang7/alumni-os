/**
 * Bootstrap the live person record behind a Member Book card.
 *
 * The Member Book is a read-only historical archive; the store holds the
 * editable profile. A card can therefore exist for decades with no store
 * row behind it, and the row has to appear the first time anybody claims
 * it or links to it.
 *
 * Extracted from /api/account/link-person so the founder-side linking in
 * /api/internal/link-account cannot drift from the self-serve path. The
 * two must agree on roster years, source urls and publication state, or
 * the same person ends up with a different record depending on which door
 * they came through.
 *
 * Operates on a mutateStore draft: it pushes rows and returns the person
 * id. It never links an account, and it never decides who somebody is.
 */

import type { MemberBookEntry } from './types'
import { findTeamStorePersonForBookEntry } from './bridge'
import type {
  Person,
  TeamMembership,
  PersonEnrichment,
  Store,
} from '@/lib/store/types'

function splitName(displayName: string): { firstName?: string; lastName?: string } {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function storeNormalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function membershipFor(
  personId: string,
  teamId: string,
  entry: MemberBookEntry,
  now: string,
): TeamMembership {
  return {
    id: crypto.randomUUID(),
    personId,
    teamId,
    memberRole: 'alumni',
    memberStatus: 'verified',
    rosterStartYear: entry.career.startYear ?? entry.letterWinner.firstYear ?? undefined,
    rosterEndYear: entry.career.finishYear ?? entry.letterWinner.lastYear ?? undefined,
    classYearEstimate: entry.profile.classYearEstimate ?? undefined,
    classLabel: entry.profile.latestRosterClass ?? undefined,
    hometown: entry.profile.hometown ?? undefined,
    highSchool: entry.profile.highSchool ?? undefined,
    bioUrls: [],
    sourceUrls: [...entry.sources.sourceUrls],
    confidence: 1,
    publishedToNetwork: true,
    publishedAt: now,
    publishedByRole: 'admin',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Resolve the store person for a card, creating the person, membership and
 * enrichment rows only where they are missing. Idempotent: running it twice
 * for the same card and team adds nothing the second time.
 *
 * Must be called inside a mutateStore callback so the resolve and every
 * push commit together under the CAS guard.
 */
export function ensurePersonForBookEntry(
  store: Store,
  entry: MemberBookEntry,
  teamId: string,
): string {
  const now = new Date().toISOString()
  const matched = findTeamStorePersonForBookEntry(entry, store.people)

  if (matched) {
    const onThisTeam = store.teamMemberships.some(
      m => m.personId === matched.id && m.teamId === teamId,
    )
    if (!onThisTeam) {
      store.teamMemberships.push(membershipFor(matched.id, teamId, entry, now))
    }
    if (!store.personEnrichments.some(e => e.personId === matched.id && e.teamId === teamId)) {
      store.personEnrichments.push({
        id: crypto.randomUUID(),
        personId: matched.id,
        teamId,
        visibleToPlayers: true,
        verificationStatus: 'unverified',
        sourceUrls: [],
        createdAt: now,
        updatedAt: now,
      })
    }
    return matched.id
  }

  const personId = crypto.randomUUID()
  const { firstName, lastName } = splitName(entry.displayName)
  const person: Person = {
    id: personId,
    canonicalName: entry.displayName,
    normalizedName: storeNormalizeName(entry.displayName),
    firstName,
    lastName,
    createdAt: now,
  }
  store.people.push(person)
  store.teamMemberships.push(membershipFor(personId, teamId, entry, now))
  store.personEnrichments.push({
    id: crypto.randomUUID(),
    personId,
    teamId,
    visibleToPlayers: true,
    verificationStatus: 'unverified',
    sourceUrls: [],
    createdAt: now,
    updatedAt: now,
  })
  return personId
}
