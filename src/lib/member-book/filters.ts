import type { MemberBookEntry, MemberBookFilters, EraFilter, SortMode } from './types'
import {
  memberMatchesSearch,
  memberMatchesRole,
  memberMatchesLetter,
  memberMatchesEra,
  memberMatchesYear,
  sortMembers,
  isPublicMember,
} from './helpers'

export function filterMembers(
  members: readonly MemberBookEntry[],
  filters: MemberBookFilters,
): MemberBookEntry[] {
  const filtered = members.filter(
    (m) =>
      m.includeInMemberBook &&
      memberMatchesSearch(m, filters.search) &&
      memberMatchesRole(m, filters.role) &&
      memberMatchesLetter(m, filters.letter) &&
      memberMatchesEra(m, filters.era) &&
      memberMatchesYear(m, filters.year),
  )
  return sortMembers(filtered, filters.sort)
}

export const DEFAULT_FILTERS: MemberBookFilters = {
  search: '',
  role: 'all',
  letter: 'all',
  era: 'all',
  year: null,
  sort: 'most_recent',
}

// ── Public Member Book filters (managers hidden by default) ──────────────────

export interface PublicMemberFilters {
  search: string
  era: EraFilter
  sort: SortMode
}

export const DEFAULT_PUBLIC_FILTERS: PublicMemberFilters = {
  search: '',
  era: 'all',
  sort: 'most_recent',
}

export function filterPublicMembers(
  members: readonly MemberBookEntry[],
  filters: PublicMemberFilters,
): MemberBookEntry[] {
  const filtered = members.filter(
    (m) =>
      isPublicMember(m) &&
      memberMatchesSearch(m, filters.search) &&
      memberMatchesEra(m, filters.era),
  )
  return sortMembers(filtered, filters.sort)
}
