/**
 * Penn Women's Golf, the record book.
 *
 * Every number here comes from Penn Athletics' own published pages, checked
 * 2026-10-31: Mark Anderson's staff bio for the titles and the tournament
 * count, Penn's 2010 and 2023 releases for the two Ivy championships, and
 * Daily Pennsylvanian coverage from September 1999 for the varsity date.
 *
 * What is deliberately absent:
 *
 * - **No all-time letter-winner record.** None has been located for the
 *   women's program. That is why no woman in the Member Book is marked a
 *   letter winner, and why there is no letter-years figure here.
 * - **No individual honours tally.** The men's book carries one because the
 *   underlying list exists. No equivalent list has been found for the women,
 *   and a number nobody can source is worse than no number.
 * - **Anderson's win-loss record is not shown.** Penn's own pages have
 *   carried three different figures for it. The titles below do not conflict
 *   between sources; that record does.
 *
 * The gaps are the point. They are what the Board can close.
 */

import type {
  ProgramTradition,
  ProgramHistoryNote,
} from './types'

/**
 * Years Penn women won the Ivy League title. Single source of truth: the
 * card's number and its year line both derive from this array.
 */
export const WOMENS_IVY_CHAMPIONSHIP_YEARS = [2010, 2023] as const

/**
 * Years Penn women reached an NCAA Regional. Both followed an Ivy title,
 * and they are the program's only postseason appearances.
 */
export const WOMENS_NCAA_REGIONAL_YEARS = [2010, 2023] as const

/** The first varsity season. Men's golf went varsity in 1899. */
export const WOMENS_VARSITY_SEASON = '1999-2000'
export const WOMENS_FOUNDED_YEAR = 1999

const years = (list: readonly number[]) => list.join(' · ')

export const PENN_WOMENS_GOLF_TRADITION: ProgramTradition = {
  title: 'Penn Women’s Golf Tradition',
  subtitle:
    'Championships and postseason appearances from the Penn Women’s Golf record book, as published by Penn Athletics.',
  achievements: [
    {
      label: 'Ivy League Championships',
      value: String(WOMENS_IVY_CHAMPIONSHIP_YEARS.length),
      detail: years(WOMENS_IVY_CHAMPIONSHIP_YEARS),
      description:
        'Won by 22 strokes in 2010, then wire-to-wire in 2023, holding off Harvard by four on the final day.',
      featured: true,
    },
    {
      label: 'NCAA Regional Appearances',
      value: String(WOMENS_NCAA_REGIONAL_YEARS.length),
      detail: years(WOMENS_NCAA_REGIONAL_YEARS),
      description:
        'The program’s only postseason trips, both earned by winning the Ivy League.',
    },
    {
      label: 'Team Tournament Titles',
      value: '20',
      detail: '1999–2026',
      description:
        'Nineteen of the twenty came under Mark Anderson, head coach since August 2008.',
    },
    {
      label: 'Varsity Seasons',
      value: '27',
      detail: `${WOMENS_VARSITY_SEASON} to 2026-27`,
      description:
        'Penn women’s golf became a varsity program in 1999, a century after the men.',
    },
  ],
}

export const PENN_WOMENS_GOLF_HISTORICAL_NOTES: ProgramHistoryNote[] = [
  {
    year: 1999,
    title: 'The program went varsity',
    detail:
      'Penn women’s golf played its first varsity season in 1999-2000, becoming the sixth Ivy League school to sponsor the sport. ' +
      'Stacy Kress was the program’s first recruit and earned first-team All-Ivy as a freshman.',
  },
  {
    year: 2009,
    title: 'ECAC Championships team title',
    detail:
      'Penn won the ECAC Championships team title in October 2009, the season before the program’s first Ivy League championship.',
  },
  {
    year: 2026,
    title: 'Mark Anderson\u2019s 1,000th career victory',
    detail:
      'Anderson reached 1,000 career coaching victories at the Lady Blue Hen Invitational in Rehoboth Beach, Delaware, in October 2026. ' +
      'Juliet Oh tied for second there at one under, and Penn finished fourth in an eleven-team field.',
  },
  {
    year: 2023,
    title: 'Ivy League Coach of the Year',
    detail:
      'Mark Anderson was named Ivy League Coach of the Year for 2022-23, the first Penn golf coach to receive the award.',
  },
]

/**
 * Seasons Penn Athletics has never published a roster for. The Member Book
 * cannot show these players, and this is the list to hand anyone who asks
 * what is missing.
 */
export const WOMENS_UNPUBLISHED_SEASONS = [
  '1999-00',
  '2000-01',
  '2001-02',
  '2002-03',
  '2003-04',
] as const
