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
 * Three layers, strongest first:
 *
 *   1. A runtime entry (store), which Ryan types from a card.
 *   2. Penn's own published all-time captains lists, in penn-captains.ts,
 *      matched to cards by the rules below.
 *   3. Recollection, in RECOLLECTED below, for seasons Penn never printed.
 *
 * Penn's lists arriving on 2026-11-15 changed what this file is. It started
 * as seven hand-entered rows and is now mostly a matching problem, because
 * Penn prints every men's captain from 1912 and every women's captain from
 * 1999. Melissa's five turned out to be in Penn's document too, all five
 * exactly as she remembered them, which is worth saying out loud: she
 * reconstructed from memory a list that matches a published record she had
 * not seen.
 *
 * Years are SEASON-END years everywhere: 2005 means the 2004-05 season.
 */

import type { ProgramId } from '@/lib/teams/programs'
import type { MemberBookEntry } from './types'
import { memberBookEntries } from './data'
import {
  isPublicMember,
  getMemberProgram,
  getMemberStartYear,
  getMemberEndYear,
} from './helpers'
import { matchPennName } from './penn-name-match'
import { PENN_CAPTAIN_NAMES, type PennCaptainName } from './penn-captains'

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

/** Season-end year to the season it ends: 2005 -> "2004-05". */
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

// ── Matching Penn's names to cards ─────────────────────────────────────
//
// The rules and the explicit bindings now live in penn-name-match.ts,
// because the individual-honours list needs exactly the same join and two
// copies of a matcher this strict would drift apart.

/** Letters only, for comparing a printed name to a card's display name. */
const letters = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '')

interface Matched {
  years: number[]
  shared: boolean
  names: Set<string>
}

/** Built once at module load: card id -> the Penn captaincies it owns. */
const PENN_BY_MEMBER = new Map<string, Matched>()
const UNMATCHED: PennCaptainName[] = []
const AMBIGUOUS: Array<{ cap: PennCaptainName; ids: string[] }> = []

for (const cap of PENN_CAPTAIN_NAMES) {
  const found = matchPennName({ name: cap.name, program: cap.program, year: cap.year })
  if (!found.entry) {
    if (found.ambiguousWith) AMBIGUOUS.push({ cap, ids: found.ambiguousWith })
    UNMATCHED.push(cap)
    continue
  }
  const id = found.entry.id
  const row = PENN_BY_MEMBER.get(id) ?? { years: [], shared: false, names: new Set() }
  row.years.push(cap.year)
  // Shared if ANY of this person's seasons was shared, which is what the
  // chip has to say when someone captained alone one year and not the next.
  row.shared = row.shared || cap.shared
  row.names.add(cap.name)
  PENN_BY_MEMBER.set(id, row)
}

for (const row of PENN_BY_MEMBER.values()) row.years.sort((a, b) => a - b)

/**
 * Penn captains with no card, in Penn's order.
 *
 * Mostly men who captained before the records the Member Book was built
 * from: the men's book came from an all-time letter-winner PDF, and a
 * captain who never won a varsity letter, or whose letter years Penn never
 * digitised, has no card to attach to. A name here is a person Penn says
 * captained its golf team and whom the Clubhouse cannot show. That is the
 * to-do list, and it is why this is exported rather than silently dropped.
 */
export function unmatchedCaptains(): readonly PennCaptainName[] {
  return UNMATCHED
}

/** Names that matched more than one card. Never guessed at; always reported. */
export function ambiguousCaptains(): ReadonlyArray<{
  cap: PennCaptainName
  ids: string[]
}> {
  return AMBIGUOUS
}

/** What Penn's lists say about one card, if anything. */
export function pennCaptaincyFor(memberId: string): TeamCaptaincy | null {
  const row = PENN_BY_MEMBER.get(memberId)
  if (!row) return null
  const entry = memberBookEntries.find(e => e.id === memberId)
  if (!entry) return null
  const printed = [...row.names]
  // Penn prints maiden names for most of the early women. Saying so on the
  // card is the difference between a reader believing the record and
  // wondering whether we matched the wrong person.
  const asPrinted =
    printed.some(n => letters(n) !== letters(entry.displayName))
      ? ` Printed by Penn as ${printed.join(', ')}.`
      : ''
  return {
    memberId,
    program: getMemberProgram(entry),
    years: row.years,
    shared: row.shared || undefined,
    source: `Penn Athletics' all-time captains list, published 27 April 2026`,
    uncertain: asPrinted.trim() || undefined,
  }
}

// ── Recollection, for seasons Penn never printed ───────────────────────

const RECOLLECTED: TeamCaptaincy[] = [
  {
    memberId: 'club-gregory-weinstein',
    program: 'mens',
    years: [],
    source: 'David Posnick, 2026-11-04',
    uncertain:
      'Remembered as captain for several seasons somewhere in the 1983 to 1987 window. Penn’s own captains list prints no name for 1983-91, saying only that Penn played as a club program, so no year can be attached and none is guessed at.',
  },
]

const RECOLLECTED_BY_MEMBER = new Map(RECOLLECTED.map(c => [c.memberId, c]))

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
 * The captaincy to show on a card, strongest source first.
 *
 * A runtime entry wins because it is typed when the published record is
 * wrong or silent; Penn's list wins over recollection because it is the
 * record. A runtime entry with no years and no note is a deletion, so a
 * captaincy added by mistake can be taken back without a deploy — and so
 * that a Penn row matched to the wrong person can be suppressed.
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
  return pennCaptaincyFor(memberId) ?? RECOLLECTED_BY_MEMBER.get(memberId) ?? null
}

/**
 * The committed captaincy for a card, with no store read. This is what the
 * Member Book list uses: that list has never read the store, and buying it
 * a store read per visit is what suspended the database in August.
 */
export function getStaticCaptaincy(memberId: string): TeamCaptaincy | undefined {
  return pennCaptaincyFor(memberId) ?? RECOLLECTED_BY_MEMBER.get(memberId)
}

/** Every card with a captaincy, most recent season first. */
export function getCaptaincies(program?: ProgramId): readonly TeamCaptaincy[] {
  const rows = [
    ...[...PENN_BY_MEMBER.keys()].map(id => pennCaptaincyFor(id)!),
    ...RECOLLECTED,
  ].filter(c => !program || c.program === program)
  return rows.sort((a, b) => Math.max(0, ...b.years) - Math.max(0, ...a.years))
}
