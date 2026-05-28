import type {
  MemberBookEntry,
  MemberBadge,
  EraFilter,
  RoleFilter,
  LetterFilter,
  SortMode,
} from './types'
import { hometownToStateCode } from '@/lib/map/state-lookup'

// Letter years are ENDING years. 2004 means the 2003-04 season.
export const LETTER_YEAR_NOTE =
  'Letter years are ending years; 2004 refers to the 2003-04 season.'

export function getMemberStartYear(m: MemberBookEntry): number | null {
  return m.career.startYear ?? m.letterWinner.firstYear ?? null
}

export function getMemberEndYear(m: MemberBookEntry): number | null {
  return m.career.finishYear ?? m.letterWinner.lastYear ?? null
}

export function getMemberEra(m: MemberBookEntry): EraFilter {
  const ref = getMemberEndYear(m) ?? getMemberStartYear(m)
  if (!ref) return 'all'
  if (ref >= 2020) return '2020s'
  if (ref >= 2010) return '2010s'
  if (ref >= 2000) return '2000s'
  if (ref >= 1990) return '1990s'
  if (ref >= 1980) return '1980s'
  if (ref >= 1970) return '1970s'
  if (ref >= 1960) return '1960s'
  if (ref >= 1950) return '1950s'
  if (ref >= 1940) return '1940s'
  return '1930s'
}

export function hasLetterWinnerYears(m: MemberBookEntry): boolean {
  return m.letterWinner.isLetterWinner && m.letterWinner.years.length > 0
}

export function hasRosterSeasons(m: MemberBookEntry): boolean {
  return m.career.verifiedRosterSeasonCount > 0
}

export function isActiveMember(m: MemberBookEntry): boolean {
  return m.membershipStatus === 'active_2025_26'
}

export function getMemberDisplaySeasons(m: MemberBookEntry): readonly string[] {
  if (m.career.displaySeasons.length > 0) return m.career.displaySeasons
  if (m.career.verifiedRosterSeasons.length > 0) return m.career.verifiedRosterSeasons
  return m.career.inferredLetterSeasons
}

export function getMemberYearRange(m: MemberBookEntry): string | null {
  const start = getMemberStartYear(m)
  const end = getMemberEndYear(m)
  if (start == null && end == null) return null
  if (start && end && start !== end) return `${start}–${String(end).slice(-2)}`
  return String(start ?? end)
}

export function formatLetterYears(years: readonly number[]): string {
  if (years.length === 0) return ''
  if (years.length === 1) return String(years[0])
  if (years.length <= 4) return years.join(' · ')
  return `${years[0]}–${years[years.length - 1]} (${years.length})`
}

export function formatSeasons(seasons: readonly string[]): string {
  if (seasons.length === 0) return ''
  if (seasons.length === 1) return seasons[0]
  if (seasons.length <= 3) return seasons.join(' · ')
  return `${seasons[0]} – ${seasons[seasons.length - 1]}`
}

export function getMemberBadges(m: MemberBookEntry): MemberBadge[] {
  const badges: MemberBadge[] = []
  if (m.role === 'manager') {
    badges.push({ kind: 'manager', label: 'Manager', tone: 'navy' })
  }
  if (m.letterWinner.isLetterWinner) {
    badges.push({ kind: 'letter_winner', label: 'Letter Winner', tone: 'red' })
  }
  if (isActiveMember(m)) {
    badges.push({ kind: 'active', label: 'Current Roster', tone: 'green' })
  }
  if (hasRosterSeasons(m)) {
    badges.push({ kind: 'roster_verified', label: 'Roster Verified', tone: 'green' })
  }
  if (m.review.needsRosterCheck) {
    badges.push({ kind: 'needs_roster_check', label: 'Needs Roster Check', tone: 'tan' })
  }
  return badges
}

export function memberMatchesSearch(m: MemberBookEntry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [
    m.displayName,
    m.sortName,
    m.profile.hometown ?? '',
    m.profile.highSchool ?? '',
    m.profile.classYearEstimate ?? '',
    m.career.startSeason ?? '',
    m.career.endSeason ?? '',
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

export function memberMatchesRole(m: MemberBookEntry, role: RoleFilter): boolean {
  if (role === 'all') return true
  return m.role === role
}

export function memberMatchesLetter(m: MemberBookEntry, letter: LetterFilter): boolean {
  if (letter === 'all') return true
  if (letter === 'letter_winner') return m.letterWinner.isLetterWinner
  return !m.letterWinner.isLetterWinner
}

export function memberMatchesEra(m: MemberBookEntry, era: EraFilter): boolean {
  if (era === 'all') return true
  return getMemberEra(m) === era
}

export function memberMatchesYear(m: MemberBookEntry, year: number | null): boolean {
  if (year == null) return true
  return m.letterWinner.years.includes(year)
}

export function sortMembers(
  members: readonly MemberBookEntry[],
  mode: SortMode,
): MemberBookEntry[] {
  const arr = [...members]
  switch (mode) {
    case 'first_letter_year':
      return arr.sort((a, b) => {
        const ay = a.letterWinner.firstYear ?? getMemberStartYear(a) ?? Infinity
        const by = b.letterWinner.firstYear ?? getMemberStartYear(b) ?? Infinity
        if (ay !== by) return ay - by
        return a.sortName.localeCompare(b.sortName)
      })
    case 'last_letter_year':
      return arr.sort((a, b) => {
        const ay = a.letterWinner.lastYear ?? getMemberEndYear(a) ?? -Infinity
        const by = b.letterWinner.lastYear ?? getMemberEndYear(b) ?? -Infinity
        if (ay !== by) return ay - by
        return a.sortName.localeCompare(b.sortName)
      })
    case 'most_recent':
      return arr.sort((a, b) => {
        const ay = getMemberEndYear(a) ?? a.letterWinner.lastYear ?? -Infinity
        const by = getMemberEndYear(b) ?? b.letterWinner.lastYear ?? -Infinity
        if (ay !== by) return by - ay
        return a.sortName.localeCompare(b.sortName)
      })
    case 'alphabetical':
    default:
      return arr.sort((a, b) => a.sortName.localeCompare(b.sortName))
  }
}

export interface MemberBookStats {
  total: number
  letterWinners: number
  managers: number
  totalLetterYears: number
  rosterOnly: number
  active: number
}

export function getMemberBookStats(members: readonly MemberBookEntry[]): MemberBookStats {
  let letterWinners = 0
  let managers = 0
  let totalLetterYears = 0
  let rosterOnly = 0
  let active = 0
  for (const m of members) {
    if (m.letterWinner.isLetterWinner) {
      letterWinners++
      totalLetterYears += m.letterWinner.years.length
    } else {
      rosterOnly++
    }
    if (m.role === 'manager') managers++
    if (isActiveMember(m)) active++
  }
  return { total: members.length, letterWinners, managers, totalLetterYears, rosterOnly, active }
}

export function getAllLetterYears(members: readonly MemberBookEntry[]): number[] {
  const set = new Set<number>()
  for (const m of members) {
    for (const y of m.letterWinner.years) set.add(y)
  }
  return Array.from(set).sort((a, b) => b - a)
}

export function getMembersForLetterYear(
  members: readonly MemberBookEntry[],
  year: number,
): MemberBookEntry[] {
  return members.filter((m) => m.letterWinner.years.includes(year))
}

// ── Public-facing helpers ─────────────────────────────────────────────────────
// Managers stay in the data, but never surface on public registry/map.

export function isPublicMember(m: MemberBookEntry): boolean {
  // Coaches show in the public registry alongside players. Managers are
  // intentionally excluded — they live in the data but never surface here.
  return m.includeInMemberBook && (m.role === 'player' || m.role === 'coach')
}

export function getPublicMembers(
  members: readonly MemberBookEntry[],
): MemberBookEntry[] {
  return members.filter(isPublicMember)
}

export function getMemberPennGolfYears(m: MemberBookEntry): string | null {
  const start = getMemberStartYear(m)
  const end = getMemberEndYear(m)
  if (start == null && end == null) return null
  if (start && end && start !== end) return `Penn Golf ${start}–${String(end).slice(-2)}`
  return `Penn Golf ${start ?? end}`
}

export function getMemberHometownLabel(m: MemberBookEntry): string | null {
  return m.profile.hometown?.trim() || null
}

export function getMemberStateCode(m: MemberBookEntry): string | null {
  return hometownToStateCode(m.profile.hometown ?? undefined)
}

export interface PublicMemberStats {
  members: number
  letterYears: number
  earliestYear: number | null
  latestYear: number | null
  generations: number
}

export function getPublicMemberStats(
  members: readonly MemberBookEntry[],
): PublicMemberStats {
  const decades = new Set<number>()
  let letterYears = 0
  let earliest: number | null = null
  let latest: number | null = null
  for (const m of members) {
    letterYears += m.letterWinner.years.length
    const s = getMemberStartYear(m)
    const e = getMemberEndYear(m)
    if (s != null) {
      decades.add(Math.floor(s / 10) * 10)
      if (earliest == null || s < earliest) earliest = s
    }
    if (e != null) {
      decades.add(Math.floor(e / 10) * 10)
      if (latest == null || e > latest) latest = e
    }
  }
  return {
    members: members.length,
    letterYears,
    earliestYear: earliest,
    latestYear: latest,
    generations: decades.size,
  }
}
