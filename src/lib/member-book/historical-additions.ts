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
      'Years approximate, remembered by his brother Stephen rather than confirmed by Jay. The account jdesjardins219@gmail.com was confirmed as his by Ryan Chang on 2026-11-08.',
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
  //
  // Everything from here down rests on one email, 2026-11-15, from Melissa
  // Maurer, women's captain in 2004 and 2005: roster information "to the best
  // of my knowledge, for women's players arriving at Penn in 2001 (my year)
  // or before". It is the only account anyone has of the five seasons Penn
  // went varsity without publishing a roster, and it closed two things the
  // record book had open: Stacy Kress's and Valerie Wong Fountain's seasons,
  // both of which read "not established" until it arrived.
  //
  // Her years are SEASON-END years, and that is established rather than
  // assumed. She lists herself as "2002, 2003, 2004, 2005" and says she
  // arrived in 2001, which makes those the spring ends of 2001-02 through
  // 2004-05; independently, she had already filed a correction asking for her
  // own card to read 2001-2005, which is the same career under this file's
  // convention. Stacy Kress confirms it from the other end: listed "2000"
  // for the All-Ivy she won as a freshman, and the program's first varsity
  // season was 1999-2000. So a listed year Y becomes the season (Y-1)-Y, and
  // a span is startYear = first fall, endYear = last spring.
  //
  // Her 2026-11-15 follow-up closed the two things the first email left
  // open, both asked directly and both answered: Lindsay Stern captained
  // the 1998-99 team, the last before Penn went varsity, and "less than 4
  // years next to their names would represent their entire playing career"
  // — so a one- or two-season list here is a complete career, not a
  // partial memory. Class years she still does not give, and those stay
  // null and say so.
  {
    id: 'w-lindsay-stern-ornstein',
    displayName: 'Lindsay Stern-Ornstein',
    program: 'womens',
    classYearEstimate: null,
    startYear: 1998,
    endYear: 1999,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "One season, 1998-99, and she captained it — the season BEFORE Penn women's golf went varsity in 1999-2000. Asked directly which it was, Melissa Maurer answered: \"Lindsay played and was captain for only one season which was 1998-1999.\" Penn Athletics' own all-time women's captains list agrees, opening at 1999, one season before Penn dates the programme's first varsity season. So the last club team had a captain and this is her. Class year not given.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-natasha-miller-sekkat',
    displayName: 'Natasha Miller Sekkat',
    program: 'womens',
    classYearEstimate: null,
    startYear: 1999,
    endYear: 2000,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "Captain of the 1999-2000 team, the programme's first varsity season, and that one season is her whole playing career: Melissa Maurer confirmed on 2026-11-15 that \"less than 4 years next to their names would represent their entire playing career.\" Class year not given.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-jennifer-schraut-keith',
    displayName: 'Jennifer Schraut Keith',
    program: 'womens',
    classYearEstimate: null,
    startYear: 1999,
    endYear: 2001,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      'The 1999-2000 and 2000-01 teams, captain in 2000-01, and those two seasons are her whole career — Melissa Maurer confirmed that a list of fewer than four years is a complete one. Class year not given.',
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-rachel-slosburg-kramer',
    displayName: 'Rachel Slosburg Kramer',
    program: 'womens',
    classYearEstimate: null,
    startYear: 1999,
    endYear: 2000,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      'The 1999-2000 team, and that one season is her whole playing career: Melissa Maurer confirmed on 2026-11-15 that a list of fewer than four years is complete, not partial. Class year not given.',
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-stacy-kress-politziner',
    displayName: 'Stacy Kress Politziner',
    program: 'womens',
    classYearEstimate: "C'03",
    startYear: 1999,
    endYear: 2003,
    rememberedBy:
      "Ryan Chang, from Penn Golf Board records; seasons and captaincies from Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "Four seasons, 1999-2000 through 2002-03, and captain in 2001-02 and 2002-03. The programme's first recruit: first-team All-Ivy as a freshman in the first varsity season. Penn publishes no women's roster before 2004-05, so none of this appears in Penn's own archive. Two independent sources now agree on C'03.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-laura-dolan',
    displayName: 'Laura Dolan',
    program: 'womens',
    classYearEstimate: null,
    startYear: 2000,
    endYear: 2002,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      'The 2000-01 and 2001-02 teams, her whole career — Melissa Maurer confirmed a short list is a complete one. Written "Laura M. Dolan" in the source; the middle initial is dropped on the card and kept as a claim alias, because an initial in a display name has already hidden one Penn captain from his own card. Class year not given.',
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-jessica-penzell',
    displayName: 'Jessica Penzell',
    program: 'womens',
    classYearEstimate: null,
    startYear: 2000,
    endYear: 2002,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      'The 2000-01 and 2001-02 teams, her whole career — Melissa Maurer confirmed a short list is a complete one. Written "Jessica J. Penzell" in the source; initial kept as a claim alias only. Class year not given.',
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-victoria-entine',
    displayName: 'Victoria Entine',
    program: 'womens',
    classYearEstimate: null,
    startYear: 2001,
    endYear: 2002,
    rememberedBy: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      'The 2001-02 team, and that one season is her whole playing career — Melissa Maurer confirmed on 2026-11-15 that a list of fewer than four years is complete. Class year not given.',
    sourceRecordType: 'womens_pre_2004_recollection',
  },
  {
    id: 'w-valerie-wong-fountain',
    displayName: 'Valerie Wong Fountain',
    program: 'womens',
    classYearEstimate: null,
    startYear: 2000,
    endYear: 2003,
    rememberedBy:
      "Ryan Chang, from Penn Golf Board records; seasons from Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "Three seasons, 2000-01 through 2002-03. Wharton alumna, recorded as a women's golf letter winner and a Golf Board member. Penn published no women's roster for those seasons, so the seasons are recollection and no letter is asserted on this card. Class year not given.",
    sourceRecordType: 'womens_pre_2004_recollection',
  },
]

export const historicalAdditions: readonly MemberBookEntry[] = ADDITIONS.map(toEntry)

/** True for a card that came from recollection rather than a Penn record. */
export function isHistoricalAddition(m: MemberBookEntry): boolean {
  return m.membershipStatus === 'historical_addition'
}
