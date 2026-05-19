import type { MemberBookEntry, MemberBookFilters } from './types'
import {
  memberMatchesSearch,
  memberMatchesRole,
  memberMatchesLetter,
  memberMatchesEra,
  memberMatchesYear,
  sortMembers,
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
