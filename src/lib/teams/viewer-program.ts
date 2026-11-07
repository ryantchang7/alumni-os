/**
 * Which program the signed-in member actually played for, and when.
 *
 * Both the Your Era API and the invite page hardcoded 'penn-mens-golf', so
 * the whole teammate loop was dark for a women's member: no era, no
 * teammates, nobody to invite. The derivation is also fiddly enough that
 * duplicating it a third time would guarantee the copies drift, so it lives
 * here once.
 *
 * The fiddly part: the store only holds rosters from 2000 onward, so a
 * pre-2000 alum has no roster years in it at all. Their years come from the
 * Member Book instead, which goes back to 1930. Without that fallback the one
 * feature that is personal on day one is dark for most of the people being
 * emailed.
 */

import { livePrograms, DEFAULT_PROGRAM, type Program } from '@/lib/teams/programs'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import {
  getMemberStartYear,
  getMemberEndYear,
  getMemberProgram,
} from '@/lib/member-book/helpers'
import type { MemberBookEntry } from '@/lib/member-book/types'
import type { Store, TeamMembership } from '@/lib/store/types'

export interface ViewerProgram {
  program: Program
  /** The team row for `program`, when one exists in the store. */
  teamId: string | null
  membership: TeamMembership | undefined
  canonicalName: string | null
  bookEntry: MemberBookEntry | null
  /** First and last roster year, from the store or the Member Book. */
  startYear?: number
  endYear?: number
  /** "1986" or "1986-1990". Null when no years are on file. */
  eraLabel: string | null
}

/**
 * `teamIdBySlug` is passed in rather than looked up here so the caller keeps
 * control of how it reads teams (cached, awaited in parallel, whatever).
 */
export function resolveViewerProgram(
  store: Store,
  linkedPersonId: string | null | undefined,
  teamIdBySlug: (slug: string) => string | null,
): ViewerProgram {
  const person = linkedPersonId
    ? store.people.find(p => p.id === linkedPersonId)
    : undefined
  const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null

  // A playing membership in a live program is the strongest signal: it says
  // which roster they were actually on.
  let program: Program | null = null
  let membership: TeamMembership | undefined
  let teamId: string | null = null

  for (const candidate of livePrograms()) {
    const id = teamIdBySlug(candidate.slug)
    if (!id) continue
    const found = store.teamMemberships.find(
      m =>
        m.teamId === id &&
        m.personId === linkedPersonId &&
        (m.memberRole === 'current_player' || m.memberRole === 'alumni'),
    )
    if (found) {
      program = candidate
      membership = found
      teamId = id
      break
    }
  }

  // No playing membership: fall back to whichever book the card is in. Family
  // and affiliates land in neither, and get the default program with no years,
  // which is correct - they have no era and should see no teammates.
  if (!program) {
    const bookProgramId = bookEntry ? getMemberProgram(bookEntry) : DEFAULT_PROGRAM.id
    program =
      livePrograms().find(p => p.id === bookProgramId) ??
      livePrograms()[0] ??
      DEFAULT_PROGRAM
    teamId = teamIdBySlug(program.slug)
  }

  const startYear =
    membership?.rosterStartYear ??
    membership?.rosterEndYear ??
    (bookEntry ? getMemberStartYear(bookEntry) ?? undefined : undefined)
  const endYear =
    membership?.rosterEndYear ??
    membership?.rosterStartYear ??
    (bookEntry ? getMemberEndYear(bookEntry) ?? undefined : undefined)

  return {
    program,
    teamId,
    membership,
    canonicalName: person?.canonicalName ?? null,
    bookEntry,
    startYear,
    endYear,
    eraLabel:
      startYear && endYear
        ? startYear === endYear
          ? `${startYear}`
          : `${startYear}–${endYear}`
        : null,
  }
}
