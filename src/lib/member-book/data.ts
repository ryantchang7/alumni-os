import rawData from '../../../data/member-book/penn-mgolf-member-book.json'
import type { MemberBookData, MemberBookEntry } from './types'

const data = rawData as unknown as MemberBookData

export const memberBook: MemberBookData = data
export const memberBookEntries: readonly MemberBookEntry[] = data.members
export const memberBookCounts = data.counts
export const memberBookVersion = data.version

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

export function verifyMemberBook(): MemberBookVerification {
  const members = memberBookEntries
  const counts = memberBookCounts

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
