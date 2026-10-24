export interface TraditionAchievement {
  label: string
  value: string       // the big number shown first
  detail: string      // years or subcategory line
  description: string
  featured?: boolean  // first/primary card. Penn red number accent
}

export interface ProgramTradition {
  title: string
  subtitle: string
  achievements: TraditionAchievement[]
}

/**
 * A distinction that is not a counted appearance.
 *
 * Kept separate from `achievements` on purpose. Everything in that list is a
 * tally the program can stand behind; this is for the things that belong in
 * the record book without being a number — hosting a championship, say. The
 * separation is what stops an unverified claim being quietly absorbed into a
 * count, which is the one mistake a record book cannot make.
 */
export interface ProgramHistoryNote {
  year: number
  title: string
  detail: string
}

/**
 * Years Penn teams reached the NCAA Championships. The single source of
 * truth: the card's number and its year line are both derived from this, and
 * the Hall of Fame grid reads the same array. They used to be three
 * independent literals in two files, which is a count waiting to drift.
 *
 * 1967 is here on the word of an alumnus who played in that era and noticed
 * it missing. Penn hosted that championship at Shawnee on the Delaware (see
 * PENN_GOLF_HISTORICAL_NOTES, which carries the detail). The published
 * standings list only the top ten of a thirty-nine team field, so they
 * neither confirm nor exclude Penn, and the alumnus's recollection is the
 * best source anyone has offered. If Penn Athletics ever contradicts it,
 * removing the year from this array is all it takes.
 */
export const NCAA_CHAMPIONSHIP_YEARS = [1947, 1958, 1965, 1967, 1973, 1974] as const

/** Years Penn won the Ivy League title. Same single-source rule. */
export const IVY_CHAMPIONSHIP_YEARS = [1998, 2007, 2012, 2015] as const

const years = (list: readonly number[]) => list.join(' · ')

export const PENN_GOLF_TRADITION: ProgramTradition = {
  title: 'Penn Golf Tradition',
  subtitle: 'Championships, postseason appearances, tournament wins, and individual honors from the Penn Golf record book.',
  achievements: [
    {
      label: 'Ivy League Championships',
      value: String(IVY_CHAMPIONSHIP_YEARS.length),
      detail: years(IVY_CHAMPIONSHIP_YEARS),
      description: 'Four Ivy crowns, including the 2012 playoff win over Dartmouth.',
      featured: true,
    },
    {
      label: 'NCAA Championship Team Appearances',
      value: String(NCAA_CHAMPIONSHIP_YEARS.length),
      detail: years(NCAA_CHAMPIONSHIP_YEARS),
      description: 'Penn teams have reached the national championship stage across six seasons.',
    },
    {
      label: 'NCAA Regional Appearances',
      value: '4',
      detail: '2007 · 2010 · 2012 · 2015',
      description: 'Modern postseason appearances, including team regionals in 2007, 2012, and 2015.',
    },
    {
      label: 'Team Tournament Titles',
      value: '27',
      detail: '1996–2024',
      description: 'Team wins across Ivy, Big 5, George Washington, Navy, Lehigh, and other tournament fields.',
    },
    {
      label: 'Individual Tournament Titles',
      value: '20',
      detail: '1996–2017',
      description: 'Individual wins from Adam Bradshaw through Josh Goldenberg across Ivy, Big 5, and invitational fields.',
    },
    {
      label: 'Individual Honors',
      value: '42',
      detail: 'All-America · Ivy · All-Region · Scholar',
      description: 'All-America honors, Ivy major awards, All-Region recognition, and All-America Scholar selections.',
    },
  ],
}

/**
 * Archival notes. Each one states only what a source supports; where a claim
 * is still being confirmed it is left out rather than softened.
 */
export const PENN_GOLF_HISTORICAL_NOTES: ProgramHistoryNote[] = [
  {
    year: 1967,
    title: 'Penn hosted the NCAA Championship',
    detail:
      'The national championship was played at Shawnee on the Delaware, in Pennsylvania. ' +
      'Bob Hays, a Penn Athletics Hall of Fame member, was the program’s longtime coach through this era.',
  },
]
