/**
 * A member's own honours, on their own card.
 *
 * All 116 men's honours and the women's documented seasons render on
 * /hall-of-fame, grouped by year. That is the right shape for reading the
 * programme's history and the wrong shape for the question a member
 * actually asks, which is about themselves. Ryan Chang's card did not
 * mention his 2026 All-America Scholar award. Tom Wecal's did not mention
 * three straight GCAA All-America honourable mentions, 1973 to 1975.
 *
 * Both record books are the source; nothing is entered here. This file only
 * joins them to cards, through the strict matcher in penn-name-match.ts,
 * and reports what it could not place.
 *
 * Years are season-END years throughout, as everywhere else: 2026 means the
 * 2025-26 season.
 */

import type { MemberBookEntry } from './types'
import { getMemberProgram } from './helpers'
import { matchPennName } from './penn-name-match'
import { MENS_HONOR_ROWS } from '@/lib/program-history/penn-mens-golf-honors'
import { PENN_WOMENS_GOLF_HONORS } from '@/lib/program-history/penn-womens-golf'
import type { ProgramId } from '@/lib/teams/programs'

export interface MemberHonor {
  year: number
  /** "First-Team All-Ivy", "GCAA All-America Scholar". */
  honor: string
  /** Finish, average or context, where the record book gives one. */
  detail?: string
  /** The name the record book prints, when it differs from the card's. */
  printedAs?: string
}

interface FlatHonor {
  name: string
  program: ProgramId
  year: number
  honor: string
  detail?: string
}

/**
 * Both books, flattened to one shape.
 *
 * The women's book is a list of seasons with named entries rather than flat
 * rows, because for the women no complete tally exists and the seasons that
 * ARE documented are the point. Flattening it here does not change that.
 */
const ALL: FlatHonor[] = [
  ...MENS_HONOR_ROWS.map(r => ({
    name: r.name,
    program: 'mens' as ProgramId,
    year: r.year,
    honor: r.honor,
    detail: r.detail,
  })),
  ...PENN_WOMENS_GOLF_HONORS.flatMap(season =>
    season.entries.map(e => ({
      name: e.name,
      program: 'womens' as ProgramId,
      year: season.year,
      honor: e.honor,
      detail: e.detail,
    })),
  ),
]

const BY_MEMBER = new Map<string, MemberHonor[]>()
const UNPLACED: FlatHonor[] = []
const AMBIGUOUS: Array<{ honor: FlatHonor; ids: string[] }> = []

for (const h of ALL) {
  const m = matchPennName({ name: h.name, program: h.program, year: h.year })
  if (!m.entry) {
    if (m.ambiguousWith) AMBIGUOUS.push({ honor: h, ids: m.ambiguousWith })
    UNPLACED.push(h)
    continue
  }
  const list = BY_MEMBER.get(m.entry.id) ?? []
  list.push({
    year: h.year,
    honor: h.honor,
    detail: h.detail,
    printedAs:
      h.name.toLowerCase().replace(/[^a-z]/g, '') !==
      m.entry.displayName.toLowerCase().replace(/[^a-z]/g, '')
        ? h.name
        : undefined,
  })
  BY_MEMBER.set(m.entry.id, list)
}

// Newest season first, and within a season the order the book lists them,
// which puts All-Ivy above the academic awards.
for (const list of BY_MEMBER.values()) list.sort((a, b) => b.year - a.year)

/**
 * This member's honours, newest first. Empty for most cards, which is the
 * normal and correct answer: 427 cards and 116 men's honours.
 */
export function honorsForMember(memberId: string): readonly MemberHonor[] {
  return BY_MEMBER.get(memberId) ?? []
}

export function hasHonors(entry: MemberBookEntry): boolean {
  return (BY_MEMBER.get(entry.id)?.length ?? 0) > 0
}

/**
 * Honours in a record book that no card could be found for.
 *
 * Mostly players the Member Book has no card for at all, which for the
 * men means someone who never won a varsity letter or whose letter years
 * Penn never digitised. Exported rather than dropped, because a name here
 * is a Penn golfer Penn says was honoured and the Clubhouse cannot show.
 */
export function unplacedHonors(): readonly FlatHonor[] {
  return UNPLACED
}

export function ambiguousHonors(): ReadonlyArray<{ honor: FlatHonor; ids: string[] }> {
  return AMBIGUOUS
}

/** How many cards carry at least one honour. For the integrity test. */
export function honoredCardCount(): number {
  return BY_MEMBER.size
}

/**
 * The headline honour for a card, for a one-line summary where there is no
 * room for the list. Prefers a championship or a first team over an
 * academic award, then the most recent.
 */
export function topHonorFor(memberId: string): MemberHonor | null {
  const list = BY_MEMBER.get(memberId)
  if (!list || list.length === 0) return null
  const rank = (h: MemberHonor): number => {
    const s = h.honor.toLowerCase()
    if (s.includes('medalist') || s.includes('champion')) return 0
    if (s.includes('player of the year') || s.includes('coach of the year')) return 1
    if (s.includes('first-team') || s.includes('first team')) return 2
    if (s.includes('all-america') && !s.includes('scholar')) return 3
    if (s.includes('all-ivy')) return 4
    if (s.includes('all-championship') || s.includes('all-region')) return 5
    return 6
  }
  return [...list].sort((a, b) => rank(a) - rank(b) || b.year - a.year)[0]
}

/** Season-end year to the season it ends: 2026 -> "2025-26". */
export function honorSeason(year: number): string {
  return `${year - 1}-${String(year).slice(-2)}`
}

export type { ProgramId }
