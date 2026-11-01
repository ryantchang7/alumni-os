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

/**
 * One season's individual honours, as a program published them.
 *
 * This is a list rather than a count because for the women's programme no
 * complete tally exists: Penn Athletics has published the selections for
 * some seasons and not others. Listing the seasons that are documented,
 * and saying plainly that the rest are not, is honest in a way a single
 * invented number would not be — and it tells the Board exactly which
 * seasons someone needs to go and find.
 */
export interface ProgramHonorSeason {
  year: number
  /** Short headline for the row, e.g. "Five All-Ivy, a program first". */
  title: string
  /** Named honourees, most significant first. */
  entries: Array<{
    name: string
    honor: string
    /** Finish, score or stroke average, where the source gives one. */
    detail?: string
  }>
  /** Context the row needs, where a source supports it. */
  note?: string
}
