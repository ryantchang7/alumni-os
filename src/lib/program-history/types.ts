/**
 * Shapes shared by every Penn Golf program's record book.
 *
 * These lived in penn-mens-golf.ts while there was one program. They moved
 * here when the women's record book was added, so that neither program's
 * file imports the other's.
 */

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
