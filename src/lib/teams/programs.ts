/**
 * The Penn Golf programs the Clubhouse knows about.
 *
 * This exists because the men's team slug was written out as a string
 * literal in 126 places. That was harmless while there was one program and
 * becomes a bug the moment there are two, so new code reads a program from
 * here rather than typing the slug again.
 *
 * The store needs no schema change to hold a second program. `Team` already
 * carries `sport` and `gender`, and 26 entities already hang off `teamId`:
 * women's golf is a second row in `teams`, not a new shape. What was missing
 * was a canonical name for the two programs, which is all this file is.
 *
 * `live` is the safety catch. A program that is not live is invisible —
 * no filter option, no selector entry, no empty page — so this file can be
 * merged and deployed long before any women's data exists without putting a
 * half-built section in front of anyone. When the data lands, that boolean
 * is the switch.
 */

export type ProgramId = 'mens' | 'womens'

export interface Program {
  id: ProgramId
  /** `Team.slug` in the store. */
  slug: string
  /** `Team.teamName` in the store. */
  teamName: string
  /** `Team.gender` in the store. Capitalised to match the seeded row. */
  gender: string
  /** Full name, for page copy. */
  label: string
  /** Two or three characters, for a filter chip. */
  shortLabel: string
  websiteUrl: string
  /**
   * Whether this program has real data and may appear in the UI. Flipping
   * this to true is the deliberate act of launching a program; nothing else
   * should gate on program identity.
   */
  live: boolean
}

export const PROGRAMS: Record<ProgramId, Program> = {
  mens: {
    id: 'mens',
    slug: 'penn-mens-golf',
    teamName: "Men's Golf",
    gender: 'Men',
    label: "Penn Men's Golf",
    shortLabel: "Men's",
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    live: true,
  },
  womens: {
    id: 'womens',
    slug: 'penn-womens-golf',
    teamName: "Women's Golf",
    gender: 'Women',
    label: "Penn Women's Golf",
    shortLabel: "Women's",
    websiteUrl: 'https://pennathletics.com/sports/womens-golf/roster',
    // Not live. No roster, no seasons, no Member Book entries yet. See the
    // docblock above before changing this.
    live: false,
  },
}

/** The program everything belongs to unless it says otherwise. */
export const DEFAULT_PROGRAM_ID: ProgramId = 'mens'

export const DEFAULT_PROGRAM = PROGRAMS[DEFAULT_PROGRAM_ID]

/** The men's team slug, which most of the app still passes by hand. */
export const DEFAULT_TEAM_SLUG = DEFAULT_PROGRAM.slug

export const ALL_PROGRAMS: readonly Program[] = Object.values(PROGRAMS)

/** Programs that may be shown. One today. */
export function livePrograms(): Program[] {
  return ALL_PROGRAMS.filter(p => p.live)
}

/**
 * True once more than one program is live. Every piece of program-aware UI
 * — a Member Book filter, a selector beside the season switcher — should be
 * behind this, so none of it appears while there is only one program to
 * choose from.
 */
export function isMultiProgram(): boolean {
  return livePrograms().length > 1
}

export function getProgram(id: ProgramId): Program {
  return PROGRAMS[id]
}

export function programBySlug(slug: string): Program | null {
  return ALL_PROGRAMS.find(p => p.slug === slug) ?? null
}

/**
 * Which program a stored team row belongs to. Matches on slug first, then
 * falls back to the `gender` field, because the seeded men's row predates
 * this file and nothing has rewritten it.
 */
export function programForTeam(team: { slug?: string; gender?: string }): Program {
  if (team.slug) {
    const bySlug = programBySlug(team.slug)
    if (bySlug) return bySlug
  }
  const g = (team.gender ?? '').trim().toLowerCase()
  if (g === 'women' || g === 'w' || g === 'female') return PROGRAMS.womens
  return DEFAULT_PROGRAM
}
