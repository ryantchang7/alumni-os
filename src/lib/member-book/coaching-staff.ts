/**
 * Coaching staff who are not in either generated book.
 *
 * The men's book came from a letter-winner PDF and the women's from
 * published player rosters, so neither import had a place for a coach.
 * Clay White, the men's head coach, was added by hand into the men's data
 * long ago with `sources.primary: 'manual_admin_entry'`. Mark Anderson,
 * who has coached the women since 2008, was never added at all, so the
 * head coach of a live Penn program had no card in his own Clubhouse.
 *
 * Kept separate from historical-additions because the provenance is
 * different in kind: those are people nobody has a record of, recorded
 * from recollection. A sitting coach is on Penn Athletics' own staff
 * directory. Separate file, separate source line, same merge.
 *
 * Deliberately plain, matching the Clay White entry: a coach has no
 * playing years here, and inventing some to fill the field would put a
 * fake roster span on a real person. The role lives in profile.currentRole.
 */

import type { MemberBookEntry } from './types'

export const coachingStaff: readonly MemberBookEntry[] = [
  {
    id: 'w-mark-anderson',
    program: 'womens',
    displayName: 'Mark Anderson',
    sortName: 'Anderson, Mark',
    role: 'coach',
    isManager: false,
    includeInMemberBook: true,
    membershipStatus: 'active_2025_26',
    sourceRecordType: 'manual_admin_entry',
    career: {
      startSeason: null,
      endSeason: null,
      startYear: null,
      finishYear: null,
      yearSource: 'unknown',
      verifiedRosterSeasons: [],
      verifiedRosterSeasonCount: 0,
      inferredLetterSeasons: [],
      displaySeasons: [],
    },
    letterWinner: {
      isLetterWinner: false,
      years: [],
      seasons: [],
      firstYear: null,
      lastYear: null,
      count: 0,
      rawPdfName: null,
    },
    profile: {
      classYearEstimate: null,
      latestRosterClass: null,
      hometown: null,
      highSchool: null,
      currentRole: "Head Coach, Penn Women's Golf",
      currentCompany: 'University of Pennsylvania',
      city: 'Philadelphia, PA',
      helpTopics: null,
      contactPreference: null,
    },
    review: {
      needsRosterCheck: false,
      hasVerifiedRosterArchiveRecord: false,
      hasAllTimeLetterWinnerRecord: false,
      oldCaptainReviewStatus: null,
      legacySourceStatus: null,
      nameMatchMethod: null,
      notes:
        "Head coach since August 2008. Ivy League Coach of the Year 2022-23, the first Penn coach to win it. Coached Penn's Ivy women's title and the 2009 ECAC team title.",
    },
    sources: {
      primary: 'Penn Athletics staff directory',
      sourceUrls: ['https://pennathletics.com/staff-directory/mark-anderson/208'],
      tags: ['coach', 'current_staff'],
    },
  },
]
