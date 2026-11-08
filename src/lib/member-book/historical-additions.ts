/**
 * A third source for the Member Book: people Penn never published.
 *
 * The two generated books are provenance-locked and must stay that way.
 * The men's book came from an all-time letter-winner PDF and carries a
 * checksum, so it is never edited in place. The women's book states on
 * its face that it was "built only from rosters Penn Athletics
 * publishes". Adding a club-era player to the first would assert a
 * varsity letter he never received; adding a pre-2004 woman to the second
 * would contradict the file's own description of itself. Either would
 * destroy the thing that makes those files trustworthy.
 *
 * So the people Penn has no record of live here, hand-curated, each
 * carrying who remembered them. Every entry is `isLetterWinner: false`
 * and `yearSource: 'recollection'`. These are real Penn golfers with real
 * cards they can claim; they are not, and must never be rendered as,
 * verified Penn records.
 *
 * Three holes in the published record, measured from the books:
 *   mens   1982-1992  club status, no roster published
 *   mens   1943-1945  wartime
 *   womens 1999-2003  varsity from 1999, earliest published roster 2004-05
 *
 * Anything added here needs a name, a program, a source, and a person who
 * stands behind it. Where a detail is uncertain, say so in review.notes
 * rather than rounding it off. Penn Athletics' captains document, David
 * Posnick's recollection and CLUB_YEARS_FIRST disagree about when the
 * men's club era began (1982, 1982, 1983); none of them is overwritten.
 */

import type { MemberBookEntry } from './types'
import type { ProgramId } from '@/lib/teams/programs'

interface AdditionInput {
  id: string
  displayName: string
  program: ProgramId
  classYearEstimate: string | null
  startYear: number | null
  endYear: number | null
  /** Who stands behind this entry. Attribution is the only provenance. */
  rememberedBy: string
  /** What is NOT known, in plain words. Rendered, never hidden. */
  uncertain?: string
  sourceRecordType: 'club_era_recollection' | 'womens_pre_2004_recollection'
}

function toEntry(a: AdditionInput): MemberBookEntry {
  const seasons =
    a.startYear && a.endYear
      ? a.startYear === a.endYear
        ? [`${a.startYear}`]
        : [`${a.startYear}-${a.endYear}`]
      : []
  const [first = '', ...rest] = a.displayName.trim().split(/\s+/)
  return {
    id: a.id,
    program: a.program,
    displayName: a.displayName,
    sortName: `${rest.join(' ')}, ${first}`.trim(),
    role: 'player',
    isManager: false,
    includeInMemberBook: true,
    membershipStatus: 'historical_addition',
    sourceRecordType: a.sourceRecordType,
    career: {
      startSeason: null,
      endSeason: null,
      startYear: a.startYear,
      finishYear: a.endYear,
      // Not a roster and not inferred from letters. Someone remembered it.
      yearSource: 'unknown',
      verifiedRosterSeasons: [],
      verifiedRosterSeasonCount: 0,
      inferredLetterSeasons: [],
      displaySeasons: seasons,
    },
    letterWinner: {
      // The whole point. Penn published no letters for these seasons, so
      // nobody here is recorded as having won one.
      isLetterWinner: false,
      years: [],
      seasons: [],
      firstYear: null,
      lastYear: null,
      count: 0,
      rawPdfName: null,
    },
    profile: {
      classYearEstimate: a.classYearEstimate,
      latestRosterClass: null,
      hometown: null,
      highSchool: null,
      currentRole: null,
      currentCompany: null,
      city: null,
      helpTopics: null,
      contactPreference: null,
    },
    review: {
      needsRosterCheck: true,
      hasVerifiedRosterArchiveRecord: false,
      hasAllTimeLetterWinnerRecord: false,
      oldCaptainReviewStatus: null,
      legacySourceStatus: null,
      nameMatchMethod: null,
      notes: a.uncertain ?? null,
    },
    sources: {
      primary: `Recollection, ${a.rememberedBy}. Penn published no roster for these seasons.`,
      sourceUrls: [],
      tags: ['historical-addition', a.sourceRecordType],
    },
  }
}

const ADDITIONS: AdditionInput[] = [
  // ── Men's club era, 1982-1992 ────────────────────────────────────────
  {
    id: 'club-david-posnick',
    displayName: 'David Posnick',
    program: 'mens',
    classYearEstimate: "W'88",
    startYear: 1986,
    endYear: 1988,
    rememberedBy: 'David Posnick, from his own playing years',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-rich-furman',
    displayName: 'Rich Furman',
    program: 'mens',
    classYearEstimate: "W'88",
    startYear: null,
    endYear: null,
    rememberedBy: 'David Posnick',
    uncertain: 'Seasons not established. Remembered as being on the team before David Posnick.',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-stephen-desjardins',
    displayName: 'Stephen DesJardins',
    program: 'mens',
    classYearEstimate: "W'90",
    startYear: 1986,
    endYear: 1990,
    rememberedBy: 'David Posnick, confirmed by Stephen DesJardins',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-jay-desjardins',
    displayName: 'Jay DesJardins',
    program: 'mens',
    classYearEstimate: null,
    startYear: 1981,
    endYear: 1985,
    rememberedBy: 'Stephen DesJardins, his brother',
    uncertain:
      'Years approximate and not confirmed by Jay himself. The account jdesjardins219@gmail.com has NOT been verified as belonging to him.',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-gregory-weinstein',
    displayName: 'Gregory Weinstein',
    program: 'mens',
    classYearEstimate: "C'87",
    startYear: null,
    endYear: null,
    rememberedBy: 'David Posnick',
    uncertain: 'Remembered as a captain somewhere in 1983-1987. Seasons not established.',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-eric-cockman',
    displayName: 'Eric Cockman',
    program: 'mens',
    classYearEstimate: "C'87",
    startYear: null,
    endYear: null,
    rememberedBy: 'David Posnick',
    uncertain: 'Spelling of the surname is uncertain. Seasons not established.',
    sourceRecordType: 'club_era_recollection',
  },
  {
    id: 'club-burt-mchugh',
    displayName: 'Burt McHugh',
    program: 'mens',
    classYearEstimate: null,
    startYear: null,
    endYear: null,
    rememberedBy: 'David Posnick',
    uncertain:
      'Believed class of 1986 and remembered as All-Ivy in 1984 and 1986, which sits inside the supposed club era. Either the dates or the club-era span is wrong; both are left as recorded.',
    sourceRecordType: 'club_era_recollection',
  },

  // ── Women's pre-2004 ─────────────────────────────────────────────────
  {
    id: 'w-stacy-kress-politziner',
    displayName: 'Stacy Kress Politziner',
    program: 'womens',
    classYearEstimate: "C'03",
    startYear: null,
    endYear: null,
    rememberedBy: 'Ryan Chang, from Penn Golf Board records',
    uncertain:
      "Seasons not established. Penn publishes no women's roster before 2004-05, five years after the program went varsity.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-valerie-wong-fountain',
    displayName: 'Valerie Wong Fountain',
    program: 'womens',
    classYearEstimate: null,
    startYear: null,
    endYear: null,
    rememberedBy: 'Ryan Chang, from Penn Golf Board records',
    uncertain:
      "Wharton alumna, recorded as a women's golf letter winner and a Golf Board member. Letter years not established, and no published women's roster exists for her era, so no letter is asserted on this card.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
]

export const historicalAdditions: readonly MemberBookEntry[] = ADDITIONS.map(toEntry)

/** True for a card that came from recollection rather than a Penn record. */
export function isHistoricalAddition(m: MemberBookEntry): boolean {
  return m.membershipStatus === 'historical_addition'
}
