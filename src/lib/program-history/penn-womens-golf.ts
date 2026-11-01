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
 * - **No single individual-honours tally.** The men's book carries one
 *   because the underlying list exists. Penn has never published a complete
 *   one for the women, so instead of inventing a total,
 *   `PENN_WOMENS_GOLF_HONORS` below lists the seasons that *are* documented
 *   and the record says the rest are missing. The headline figure is given
 *   as a floor ("14+"), never as a total.
 * - **Anderson's win-loss record is not shown.** Penn's own pages have
 *   carried three different figures for it. The titles below do not conflict
 *   between sources; that record does.
 *
 * The gaps are the point. They are what the Board can close.
 */

import type {
  ProgramTradition,
  ProgramHistoryNote,
  ProgramHonorSeason,
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
      label: 'All-Ivy Selections',
      value: '14+',
      detail: 'Documented 2000-2026',
      description:
        'Fourteen selections Penn has published, from the first four in the 2000s to Mi Li in 2026. Several seasons were never itemised, so the real figure is higher.',
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

/**
 * The individual honours Penn Athletics has actually published, season by
 * season. Sources, all checked 2026-11-01:
 *
 *   2006, 2010  Penn's 26 April 2010 All-Ivy release, which also gives the
 *               "only four since 2000" figure the 14+ floor is built on.
 *   2015        Penn's 2023 Ivy championship release ("best finish by a Penn
 *               player since Sophia Chen was third in 2015").
 *   2023        Penn's 23 April 2023 Ivy championship release.
 *   2024        Penn's 17 April 2025 championship preview.
 *   2026        Penn's 29 April 2026 All-Ivy release and the Ivy League's
 *               own award announcement of the same date.
 *
 * Seasons absent from this list are absent because no source for them has
 * been found, not because nobody was honoured. Saying so is the point.
 */
export const PENN_WOMENS_GOLF_HONORS: ProgramHonorSeason[] = [
  {
    year: 2026,
    title: 'Mi Li, a unanimous first-team pick',
    entries: [
      {
        name: 'Mi Li',
        honor: 'First-Team All-Ivy, unanimous',
        detail: 'Team-low 73.9 average over 22 rounds, nine of them at or under par',
      },
      {
        name: 'Mi Li',
        honor: 'Ivy All-Championship Team',
        detail: 'Tied for fourth of 36, her 225 tied for the fifth-best by a Penn player at the Championship',
      },
      { name: 'Bridget O’Keefe', honor: 'Academic All-Ivy' },
    ],
    note: 'Li was low Penn player in three of the four spring events and shared medalist honors at the Rutgers Invitational.',
  },
  {
    year: 2024,
    title: 'Maggie Ni earns second team',
    entries: [{ name: 'Maggie Ni', honor: 'Second-Team All-Ivy', detail: 'Tied for seventh' }],
  },
  {
    year: 2023,
    title: 'All five Quakers earn All-Ivy, a program first',
    entries: [
      { name: 'Bridget O’Keefe', honor: 'First-Team All-Ivy', detail: 'Third, 224, one shot off the program record for an Ivy Championship total' },
      { name: 'Natalie Cao', honor: 'Second-Team All-Ivy', detail: 'Sixth, 229' },
      { name: 'Selina Li', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th, 232' },
      { name: 'Julie Shin', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th, 232, with a Championship-best eight birdies' },
      { name: 'Susan Xiao', honor: 'Second-Team All-Ivy', detail: 'Tied for 10th, 232' },
    ],
    note: 'The first time in school history that five Penn women were honored in the same year.',
  },
  {
    year: 2015,
    title: 'Sophia Chen third at the Ivy Championship',
    entries: [{ name: 'Sophia Chen', honor: 'Third at the Ivy Championship' }],
    note: 'The best finish by a Penn player at the Championship until Bridget O’Keefe matched it with third in 2023.',
  },
  {
    year: 2010,
    title: 'Three in one year for the first time',
    entries: [
      { name: 'Isabel Han', honor: 'First-Team All-Ivy', detail: 'As a freshman' },
      { name: 'Tiffany Cheung', honor: 'First-Team All-Ivy', detail: 'As a sophomore' },
      { name: 'Lisette Vitter', honor: 'Second-Team All-Ivy', detail: 'As a senior' },
    ],
    note: 'The first time three Penn women earned All-Ivy in the same season, in the same year the program won its first Ivy title.',
  },
  {
    year: 2006,
    title: 'Meg Bender and Kim Thompson',
    entries: [
      { name: 'Meg Bender', honor: 'All-Ivy' },
      { name: 'Kim Thompson', honor: 'All-Ivy' },
    ],
    note: 'Two of only four Penn women to earn All-Ivy between 2000, when the program first played the Ivy Championship, and 2010. The other two are not named in any source found so far.',
  },
]

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
    year: 2010,
    title: 'The first Ivy League championship',
    detail:
      'Penn won the program\u2019s first Ivy League title in 2010, by 22 strokes, and reached an NCAA Regional for the first time. ' +
      'Isabel Han and Tiffany Cheung were first-team All-Ivy that season and Lisette Vitter second team, the first time three Penn women were honored in one year.',
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
