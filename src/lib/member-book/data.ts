import rawMens from '../../../data/member-book/penn-mgolf-member-book.json'
import rawWomens from '../../../data/member-book/penn-wgolf-member-book.json'
import type { MemberBookData, MemberBookEntry } from './types'
import { historicalAdditions } from './historical-additions'
import { coachingStaff } from './coaching-staff'

/**
 * Two books, one registry.
 *
 * The men's book came from an all-time letter-winner PDF and carries a
 * checksum over its members array, so it is never edited in place. The
 * women's book was built separately from the season rosters Penn Athletics
 * publishes, which begin in 2004-05 — five seasons after the program went
 * varsity in 1999. Each file therefore verifies against its own counts, and
 * `memberBookEntries` is the merged view every page reads.
 *
 * Women's entries carry `program: 'womens'`. Men's entries predate the field
 * and are read through getMemberProgram(), which defaults to 'mens'.
 */
const mens = rawMens as unknown as MemberBookData
const womens = rawWomens as unknown as MemberBookData

export const memberBookMens: MemberBookData = mens
export const memberBookWomens: MemberBookData = womens

/** Back-compat: the men's book, which is still the one with the checksum. */
export const memberBook: MemberBookData = mens

/**
 * The merged registry every page reads.
 *
 * Third source added 2026-11-08: people Penn never published. The two
 * generated books stay byte-identical to their imports, because the men's
 * carries a checksum and the women's states it was built only from
 * published rosters. Club-era men and pre-2004 women are real Penn
 * golfers with no Penn record, so they get cards from
 * historicalAdditions, each marked isLetterWinner:false and carrying who
 * remembered them. Nothing here is a Penn record and nothing may be
 * rendered as one.
 */
export const memberBookEntries: readonly MemberBookEntry[] = [
  ...mens.members,
  ...womens.members,
  ...historicalAdditions,
  ...coachingStaff,
]

export const memberBookCounts = mens.counts
export const memberBookWomensCounts = womens.counts
export const memberBookVersion = mens.version

export function getMemberById(id: string): MemberBookEntry | null {
  return memberBookEntries.find((m) => m.id === id) ?? null
}

// Domain note: letterWinner.years are ending years. 2004 means 2003-04.
export interface MemberBookVerification {
  ok: boolean
  errors: string[]
  warnings: string[]
  checks: {
    membersTotal: { expected: number; actual: number; ok: boolean }
    letterWinnerEntries: { expected: number; actual: number; ok: boolean }
    managers: { expected: number; actual: number; ok: boolean }
    rosterOnly: { expected: number; actual: number; ok: boolean }
    letterYearRows: { expected: number; actual: number; ok: boolean }
    uniqueIds: { duplicates: string[]; ok: boolean }
  }
}

export function verifyMemberBook(
  book: MemberBookData = mens,
): MemberBookVerification {
  const members = book.members
  const counts = book.counts

  const letterWinnerCount = members.filter((m) => m.letterWinner.isLetterWinner).length
  const managerCount = members.filter((m) => m.role === 'manager').length
  const rosterOnlyCount = members.filter(
    (m) => m.sourceRecordType === 'verified_roster_only_no_letter_in_pdf',
  ).length
  let letterYearRows = 0
  for (const m of members) letterYearRows += m.letterWinner.years.length

  const idSet = new Set<string>()
  const duplicates: string[] = []
  for (const m of members) {
    if (idSet.has(m.id)) duplicates.push(m.id)
    else idSet.add(m.id)
  }

  const checks = {
    membersTotal: {
      expected: counts.membersTotal,
      actual: members.length,
      ok: members.length === counts.membersTotal,
    },
    letterWinnerEntries: {
      expected: counts.allTimeLetterWinnerEntriesIncluded,
      actual: letterWinnerCount,
      ok: letterWinnerCount === counts.allTimeLetterWinnerEntriesIncluded,
    },
    managers: {
      expected: counts.managersIncluded,
      actual: managerCount,
      ok: managerCount === counts.managersIncluded,
    },
    rosterOnly: {
      expected: counts.rosterOnlyNoLetterInPdf,
      actual: rosterOnlyCount,
      ok: rosterOnlyCount === counts.rosterOnlyNoLetterInPdf,
    },
    letterYearRows: {
      expected: counts.letterYearRows,
      actual: letterYearRows,
      ok: letterYearRows === counts.letterYearRows,
    },
    uniqueIds: {
      duplicates,
      ok: duplicates.length === 0,
    },
  }

  const errors: string[] = []
  const warnings: string[] = []
  if (!checks.membersTotal.ok)
    warnings.push(
      `Member count mismatch: expected ${checks.membersTotal.expected}, got ${checks.membersTotal.actual}`,
    )
  if (!checks.letterWinnerEntries.ok)
    warnings.push(
      `Letter-winner entry count mismatch: expected ${checks.letterWinnerEntries.expected}, got ${checks.letterWinnerEntries.actual}`,
    )
  if (!checks.managers.ok)
    warnings.push(
      `Manager count mismatch: expected ${checks.managers.expected}, got ${checks.managers.actual}`,
    )
  if (!checks.rosterOnly.ok)
    warnings.push(
      `Roster-only count mismatch: expected ${checks.rosterOnly.expected}, got ${checks.rosterOnly.actual}`,
    )
  if (!checks.letterYearRows.ok)
    warnings.push(
      `Letter-year row count mismatch: expected ${checks.letterYearRows.expected}, got ${checks.letterYearRows.actual}`,
    )
  if (!checks.uniqueIds.ok) errors.push(`Duplicate member IDs: ${duplicates.join(', ')}`)

  return { ok: errors.length === 0, errors, warnings, checks }
}
