/**
 * Who captained the team, which is not the same thing as who runs the site.
 *
 * `src/lib/captains.ts` is a permission: an email in that list can see
 * /internal/claims and approve a claim. It says nothing about history, and
 * nobody who played in 1976 is in it. Until now the Clubhouse had no other
 * idea of the word, so a real captaincy had nowhere to go: Melissa Maurer
 * sent five of them on 2026-11-15 and they could only be written as prose
 * inside a `review.notes` string that no page renders. The placeholder text
 * in the roster-years form even reads "Four seasons, captain my senior
 * year" — we were inviting the fact and then dropping it.
 *
 * Years here are SEASON-END years, the same convention as the rest of the
 * Member Book: 2005 means the 2004-05 season. `years` may be empty, which
 * means somebody remembers the captaincy but not when, and that is a
 * legitimate record rather than a reason to omit the person.
 *
 * Every row carries a source. These are not inferences from a letter count
 * or a four-season career; a captaincy is a thing somebody has to say.
 *
 * This file is the committed layer. A captaincy Ryan enters from a card at
 * /member-book/<id> is stored at runtime instead and read on top of this
 * (see getTeamCaptaincies in the store), so he never has to wait for a
 * deploy to record one. Same split as roster-year corrections, and with
 * the same consequence: the overlay shows on the card immediately, while
 * the Member Book list only picks it up when it lands in this file.
 */

import type { ProgramId } from '@/lib/teams/programs'

export interface TeamCaptaincy {
  /** Member Book card this belongs to. */
  memberId: string
  program: ProgramId
  /**
   * Season-END years captained. 2005 = the 2004-05 season. Empty when the
   * captaincy is remembered and the year is not.
   */
  years: readonly number[]
  /**
   * One of two or more captains that season. Penn golf has used co-captains
   * for most of its history and the distinction is not cosmetic: a card
   * reading "Team Captain" for a shared job overstates it, and a reader who
   * knows the season will notice.
   */
  shared?: boolean
  /** Who stands behind it. Attribution is the only provenance there is. */
  source: string
  /** What is NOT established, in plain words. Rendered, never hidden. */
  uncertain?: string
}

/** The chip and the sentence, so they can never disagree. */
export function captainLabel(shared?: boolean): string {
  return shared ? 'Team Co-Captain' : 'Team Captain'
}

export function captainSentence(
  years: readonly number[],
  shared?: boolean,
): string {
  const verb = shared ? 'Co-captained' : 'Captained'
  const seasons = formatCaptainSeasons(years)
  return seasons ? `${verb} the team in ${seasons}.` : `${verb} the team.`
}

/**
 * Season-end year to the season it ends: 2005 -> "2004-05".
 */
export function seasonForEndYear(endYear: number): string {
  return `${endYear - 1}-${String(endYear).slice(-2)}`
}

/**
 * The seasons line for a card. Consecutive years stay separate rather than
 * collapsing into a span: two captaincies in a row is a fact about two
 * seasons, and "2001-02 and 2002-03" reads like what happened in a way
 * "2001-03" does not.
 */
export function formatCaptainSeasons(years: readonly number[]): string {
  const seasons = [...years].sort((a, b) => a - b).map(seasonForEndYear)
  if (seasons.length === 0) return ''
  if (seasons.length === 1) return seasons[0]
  if (seasons.length === 2) return `${seasons[0]} and ${seasons[1]}`
  return `${seasons.slice(0, -1).join(', ')} and ${seasons[seasons.length - 1]}`
}

const CAPTAINCIES: TeamCaptaincy[] = [
  // ── Men's ────────────────────────────────────────────────────────────
  //
  // Penn Athletics keeps a captains document. It is the source for the one
  // men's captaincy below and for the claim that the club era ran 1982-1991;
  // it is not in this repository, and transcribing the rest of it is the
  // single biggest thing that would fill this list out.
  {
    memberId: 'richard-g-steingraber',
    program: 'mens',
    years: [1976],
    shared: true,
    source:
      "Ryan Chang, 2026-11-12, who calls him “Penn Golf co-captain in 1976” in the Clubhouse post about Lisette Williamson; Penn Athletics' captains document also has him in 1976",
    uncertain:
      'Co-captain, so there is at least one other 1976 captain this list cannot yet name. His four letter years are 1973 through 1976 and the captaincy is recorded for the last of them, which is what the sources give rather than a statement that he captained no other season.',
  },
  {
    memberId: 'club-gregory-weinstein',
    program: 'mens',
    years: [],
    source: 'David Posnick, 2026-11-04',
    uncertain:
      'Remembered as captain for several seasons somewhere in the 1983 to 1987 window. Penn published no roster for the club era, so no year can be attached and none is guessed at.',
  },

  // ── Women's ──────────────────────────────────────────────────────────
  //
  // All five come from one email, 2026-11-15, from Melissa Maurer, who
  // captained in 2004 and 2005. It is the only account anyone has of the
  // programme's first five varsity seasons, and it is the reason the
  // women's side of this list is more complete than the men's: for
  // 1999-2005 a teammate wrote it down, and for the men nobody has yet.
  {
    memberId: 'w-lindsay-stern-ornstein',
    program: 'womens',
    years: [1999],
    source: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "Under this book's season-end convention her year reads 1998-99, the season BEFORE Penn women's golf went varsity in 1999-2000. So either she captained the club team in its last pre-varsity season or this one entry is counted differently from the rest of the list. Left exactly as given rather than moved a year to fit.",
  },
  {
    memberId: 'w-natasha-miller-sekkat',
    program: 'womens',
    years: [2000],
    source: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain: "Captain in the programme's first varsity season.",
  },
  {
    memberId: 'w-jennifer-schraut-keith',
    program: 'womens',
    years: [2001],
    source: "Melissa Maurer, women's captain 2004 and 2005",
  },
  {
    memberId: 'w-stacy-kress-politziner',
    program: 'womens',
    years: [2002, 2003],
    source: "Melissa Maurer, women's captain 2004 and 2005",
    uncertain:
      "Two seasons as captain, in a four-season career Penn's own roster archive does not contain: it begins in 2004-05.",
  },
  {
    memberId: 'w-melissa-aylor',
    program: 'womens',
    years: [2004, 2005],
    source: 'Melissa Maurer, from her own playing years, 2026-11-15',
    uncertain:
      "Penn published no women's roster for three of her four seasons and no All-Ivy selection list for 2005, so neither her captaincy nor that honour has a Penn page behind it.",
  },
]

const BY_MEMBER = new Map(CAPTAINCIES.map(c => [c.memberId, c]))

export const teamCaptaincies: readonly TeamCaptaincy[] = CAPTAINCIES

/** The committed captaincy for a card, if there is one. */
export function getStaticCaptaincy(memberId: string): TeamCaptaincy | undefined {
  return BY_MEMBER.get(memberId)
}

/** Every captaincy in a program, most recent season first. */
export function getCaptaincies(program?: ProgramId): readonly TeamCaptaincy[] {
  const rows = program ? CAPTAINCIES.filter(c => c.program === program) : CAPTAINCIES
  return [...rows].sort((a, b) => Math.max(0, ...b.years) - Math.max(0, ...a.years))
}

/**
 * A captaincy entered at runtime, as the store holds it. Declared here so
 * the resolver below does not have to import the store into client code.
 */
export interface CaptaincyOverride {
  years: readonly number[]
  shared?: boolean
  note?: string
  setByEmail: string
}

/**
 * The captaincy to show on a card: an entry Ryan typed wins over the
 * committed one, because he types it when the committed one is wrong or
 * missing. A runtime entry with no years and no note is a deletion, so a
 * captaincy added by mistake can be taken back without a deploy.
 */
export function resolveCaptaincy(
  memberId: string,
  program: ProgramId,
  overrides?: Map<string, CaptaincyOverride> | null,
): TeamCaptaincy | null {
  const override = overrides?.get(memberId)
  if (override) {
    if (override.years.length === 0 && !override.note) return null
    return {
      memberId,
      program,
      years: override.years,
      shared: override.shared,
      source: `Entered by ${override.setByEmail}`,
      uncertain: override.note,
    }
  }
  return BY_MEMBER.get(memberId) ?? null
}
