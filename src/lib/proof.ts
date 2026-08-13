/**
 * Public proof numbers — the case for joining, made with facts that are
 * already public record.
 *
 * These come from the static Member Book JSON, not the live store, which is
 * the entire point: on launch day the store has a handful of rows, so live
 * counts ("2 on the wall") undersell the thing badly. Book numbers are true
 * on day one and never read zero.
 */

import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers, getPublicMemberStats } from '@/lib/member-book/helpers'

const publicMembers = getPublicMembers(memberBookEntries)
const stats = getPublicMemberStats(publicMembers)

/** Distinct hometown states/countries ON RECORD. Only some members have a
 *  hometown, so copy must say "in the book", never "our alumni live in". */
const regions = new Set(
  publicMembers
    .map(m => m.profile.hometown?.split(',').pop()?.trim())
    .filter((r): r is string => !!r && r.length > 0),
)

export const BOOK_PROOF = {
  members: stats.members,
  earliestYear: stats.earliestYear,
  latestYear: stats.latestYear,
  generations: stats.generations,
  letterYears: stats.letterYears,
  regions: regions.size,
} as const

export interface ProofStat {
  label: string
  value: string | number
}

/**
 * The year Penn first put a golf team on the course.
 *
 * The site said 1899 for a while, which does not appear to be right. Penn was
 * one of five schools invited to the first intercollegiate championship in
 * 1897 but did not send a team until 1901, so 1901 is the first year there is
 * a Penn side on record.
 *
 * One constant, used everywhere the year appears, so confirming it with the
 * program is a one-line change and cannot leave two different years on two
 * different pages.
 */
export const FOUNDED_YEAR = 1901

export const BOOK_PROOF_STATS: ProofStat[] = [
  { label: 'Members', value: BOOK_PROOF.members },
  { label: 'Playing since', value: FOUNDED_YEAR },
  { label: 'Letter years', value: BOOK_PROOF.letterYears },
]

/**
 * Live store counts are only convincing once there's something to count.
 * Below this, a room shows the Member Book numbers instead of advertising
 * that it's empty. One constant so the rule lives in one place.
 */
export const COUNT_REVEAL_THRESHOLD = 12

/** Keep live stats only if at least two of them clear the bar. */
export function revealedStats(live: ProofStat[]): ProofStat[] {
  const strong = live.filter(s => Number(s.value) >= COUNT_REVEAL_THRESHOLD)
  return strong.length >= 2 ? strong : BOOK_PROOF_STATS
}
