// Penn Men's Golf Member Book — canonical types.
//
// Domain note: letterWinner.years are ENDING years.
// Example: a letter year of 2004 means the 2003-04 season.

export type MemberRole = 'player' | 'manager'

export type SourceRecordType =
  | 'letter_winner_with_verified_roster'
  | 'letter_winner_pdf_only_roster_unverified'
  | 'verified_roster_only_no_letter_in_pdf'
  | 'manager_letter_winner_pdf'

export interface MemberCareer {
  startSeason: string | null
  endSeason: string | null
  startYear: number | null
  finishYear: number | null
  yearSource: 'verified_roster_archive' | 'inferred_from_letter_winner_years' | 'unknown'
  verifiedRosterSeasons: readonly string[]
  verifiedRosterSeasonCount: number
  inferredLetterSeasons: readonly string[]
  displaySeasons: readonly string[]
}

export interface MemberLetterWinner {
  isLetterWinner: boolean
  years: readonly number[]
  seasons: readonly string[]
  firstYear: number | null
  lastYear: number | null
  count: number
  rawPdfName: string | null
}

export interface MemberProfile {
  classYearEstimate: string | null
  latestRosterClass: string | null
  hometown: string | null
  highSchool: string | null
  currentRole: string | null
  currentCompany: string | null
  city: string | null
  helpTopics: string[] | null
  contactPreference: string | null
}

export interface MemberReview {
  needsRosterCheck: boolean
  hasVerifiedRosterArchiveRecord: boolean
  hasAllTimeLetterWinnerRecord: boolean
  oldCaptainReviewStatus: string | null
  legacySourceStatus: string | null
  nameMatchMethod: string | null
  notes: string | null
}

export interface MemberSources {
  primary: string
  sourceUrls: readonly string[]
  tags: readonly string[]
}

export interface MemberBookEntry {
  id: string
  displayName: string
  sortName: string
  role: MemberRole
  isManager: boolean
  includeInMemberBook: boolean
  membershipStatus: string
  sourceRecordType: SourceRecordType | string
  career: MemberCareer
  letterWinner: MemberLetterWinner
  profile: MemberProfile
  review: MemberReview
  sources: MemberSources
}

export interface MemberBookCounts {
  membersTotal: number
  allTimeLetterWinnerEntriesIncluded: number
  playersIncluded: number
  managersIncluded: number
  verifiedRosterArchiveRecords: number
  letterWinnerPdfOnlyRosterUnverified: number
  rosterOnlyNoLetterInPdf: number
  letterYearRows: number
}

export interface MemberBookData {
  dataset: string
  version: string
  counts: MemberBookCounts
  members: readonly MemberBookEntry[]
  verification: {
    expectedLetterYearRows: number
    actualLetterYearRows: number
    missingParsedLetterEntriesAfterMerge: readonly string[]
  }
}

// UI-facing types

export type BadgeKind =
  | 'letter_winner'
  | 'manager'
  | 'roster_verified'
  | 'needs_roster_check'
  | 'active'
  | 'recent_grad'

export interface MemberBadge {
  kind: BadgeKind
  label: string
  tone: 'navy' | 'red' | 'green' | 'tan' | 'neutral'
}

export type RoleFilter = 'all' | 'player' | 'manager'
export type LetterFilter = 'all' | 'letter_winner' | 'roster_only'
export type EraFilter =
  | 'all'
  | '2020s'
  | '2010s'
  | '2000s'
  | '1990s'
  | '1980s'
  | '1970s'
  | '1960s'
  | '1950s'
  | '1940s'
  | '1930s'
export type SortMode = 'alphabetical' | 'first_letter_year' | 'last_letter_year' | 'most_recent'

export interface MemberBookFilters {
  search: string
  role: RoleFilter
  letter: LetterFilter
  era: EraFilter
  year: number | null
  sort: SortMode
}
