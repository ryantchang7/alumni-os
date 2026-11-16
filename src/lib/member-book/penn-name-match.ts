/**
 * Joining a name Penn printed to a card in the Member Book.
 *
 * Penn's history documents print how a player was called. The Member Book
 * came from an all-time letter-winner PDF that prints how he enrolled.
 * "Rich Steingraber" and "Richard G. Steingraber" are one man and no
 * letters-only comparison will ever say so.
 *
 * This lived inside team-captains.ts until the individual-honours list
 * needed exactly the same join — "Mike Blodgett" won the 2008 Ivy
 * Championship and his card says "Michael Blodgett". Two copies of a
 * matcher this strict would drift, and the explicit bindings below are
 * worth more shared than duplicated.
 *
 * **Deliberately strict**, for the reason at the top of candidates.ts: a
 * wrong answer attaches one member's history to another, and an honour or a
 * captaincy is the most quotable thing on a card. Three rules, all of which
 * must hold:
 *
 *   1. The name matches a card's display name or a recorded alias, reduced
 *      to letters, or matches once single-letter name parts are set aside.
 *   2. The card is in the same program.
 *   3. The year falls inside the card's career span. Penn's roster archive
 *      is shorter than its letter records, so a span can be too short —
 *      but it is never too long, and the year test is what stops "Tom
 *      Wecal" from attaching to a different Wecal eighty years apart.
 *
 * A name matching two cards is dropped, never guessed at. `resolve` returns
 * null and the caller reports it.
 */

import type { MemberBookEntry } from './types'
import { memberBookEntries } from './data'
import {
  isPublicMember,
  getMemberProgram,
  getMemberStartYear,
  getMemberEndYear,
} from './helpers'
import { NAME_ALIASES } from './candidates'
import type { ProgramId } from '@/lib/teams/programs'

/**
 * Printed name -> Member Book card, for names the rules above cannot reach.
 *
 * Every row was established the same way and each one is checkable: exactly
 * one public card in the same program shares the surname, and the year
 * falls inside that card's career span. Where a surname had two cards in
 * the era the pair is NOT here — Harry and William Crosson both exist, and
 * only William's span contains 1942.
 *
 * Nothing fuzzy ships. There is no nickname expansion at runtime, only this
 * list, because applying Rich/Richard/Dick in general would merge
 * strangers. Keyed `program:printed name`, so one entry covers a player
 * Penn prints identically across several seasons and award lists.
 */
export const PENN_NAME_TO_CARD: Record<string, string> = {
  // ── From the all-time captains lists ─────────────────────────────────
  'mens:Ed Weihenmayer': 'edwin-weihenmayer',
  'mens:William Crosson, Jr.': 'william-crosson',
  'mens:Edward “Bud” Long': 'edward-long',
  'mens:Jim West': 'james-west',
  'mens:Ray McCabe': 'raymond-mccabe',
  'mens:J. Ralph Bennett': 'james-ralph-bennett',
  // Ted for Edward. One Lingenheld, and 1967 is his last season.
  'mens:Ted Lingenheld': 'edward-c-lingenheld',
  'mens:Ed L. Burke': 'edward-l-burke',
  'mens:Walt Enick': 'walter-d-enick',
  'mens:Rich Steingraber': 'richard-g-steingraber',
  'mens:Tom Wecal': 'thomas-e-wecal',
  'mens:Jeff Kiley': 'jeffrey-t-kiley',
  // The 1977 captain. Patrick O'Leary captained in 2016, thirty-nine
  // seasons later, and matches on his own name without help.
  'mens:Jim O’Leary': 'james-m-o-leary',
  'mens:Ted Michaels': 'theodore-p-michaels',
  'mens:Steve Sieg': 'steven-r-sieg',
  // Bill for William. One Neusidl.
  'mens:Bill Neusidl': 'william-b-neusidl',
  'mens:Steve Corradi': 'stephen-j-corradi',
  'mens:Rich Grabow': 'richard-b-grabow',
  'mens:Joe Cesarz': 'joseph-m-cesarz',
  'mens:Mike Russell': 'michael-j-russell',
  'mens:Mike Blodgett': 'michael-blodgett',
  /**
   * The one case where Penn's two documents disagree with each other.
   *
   * The captains list makes Tom Welsh the 1973 captain, so he played the
   * 1972-73 season. The letter-winner PDF the Member Book was built from
   * gives him 1970-1972 and stops. Captaining a season he is not recorded
   * as playing is not possible, so one of the two Penn documents is short,
   * and it is almost certainly the letter record: that is exactly the error
   * Peyton Wallace had to email in about his own four seasons.
   *
   * The captaincy is recorded because Penn prints it. His card's span is
   * NOT quietly extended to fit, because that would be this file inventing
   * a season. It wants a roster correction, which is a decision for a human
   * with the record in front of them. The other Welsh, Stanley, played
   * 1942-43 and is not a candidate.
   *
   * Because the year test is bypassed by an explicit binding, this is also
   * the only row here that reaches outside a card's recorded span, and it
   * does so knowingly.
   */
  'mens:Tom Welsh': 'thomas-mca-welsh',

  // ── From the individual-honours and Championship lists ───────────────
  //
  // Same rule, different document. Added only where the matcher actually
  // fails: most honour-list spellings differ from a card by a middle
  // initial, which rule 1 already handles ("Chad Perman" reaches "Chad L.
  // Perman" on its own).
  'mens:Rob Goldfaden': 'robert-g-goldfaden',
  'mens:Don Norbury': 'donald-norbury',
  'mens:Jerry Jacobs': 'jerome-j-jacobs',
  'mens:Don DeAngelis': 'donald-p-deangelis',
  // Also the 1974 co-captain, so this one row places three All-Ivy seasons
  // and a captaincy the captains report had listed as cardless.
  'mens:Vince Scarpetta': 'vincent-a-scarpetta-jr',
  /**
   * The one inference in this file, stated rather than hidden.
   *
   * Penn's captains list prints "Ed L. Burke" for 1971; its All-Ivy list
   * prints "Lee Burke" for the same season. The Member Book holds exactly
   * one Burke in men's golf, Edward L. Burke, 1968-1971, and 1971 is his
   * last season. Two different Burkes in one Penn golf season, one of them
   * absent from the letter record, is possible but far less likely than one
   * man Penn wrote down two ways. If that is wrong, deleting this line is
   * the whole fix.
   */
  'mens:Lee Burke': 'edward-l-burke',
  /**
   * Burt McHugh's card has no years at all — it came from David Posnick's
   * recollection of the club era, and Penn published no roster for it. So
   * the year test cannot pass and only an explicit binding reaches him.
   *
   * His own card note already said he was "remembered as All-Ivy in 1984
   * and 1986, which sits inside the supposed club era. Either the dates or
   * the club-era span is wrong." Penn's All-Ivy list prints both seasons,
   * which settles it: neither was wrong, because a club team still played
   * the Ivy Championship. Posnick remembered correctly.
   *
   * Those two honours also prove he played 1983-84 and 1985-86, which is
   * more than his empty span says. Setting years from that is a human's
   * call, not this file's, the same way Tom Welsh's span is left alone.
   * Brett T. McHugh, 1994-1997, is a different man.
   */
  'mens:Burt McHugh': 'club-burt-mchugh',
}

const letters = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '')

const withoutInitials = (s: string): string =>
  letters(
    s
      .toLowerCase()
      .split(/\s+/)
      .filter(part => part.replace(/[^a-z]/g, '').length > 1)
      .join(' '),
  )

export interface PennNameRef {
  name: string
  program: ProgramId
  /** Season-end year, used for the span test. */
  year: number
}

export interface MatchResult {
  entry: MemberBookEntry | null
  /** Set when the name hit more than one card, so a caller can report it. */
  ambiguousWith?: string[]
}

/**
 * The single card a printed name belongs to, or null with the reason.
 *
 * An explicit binding is the strongest signal there is, because somebody
 * checked it. It still has to resolve to a real, public card in the right
 * program, so a card-id typo fails loudly in the integrity test rather
 * than silently dropping an honour.
 */
export function matchPennName(ref: PennNameRef): MatchResult {
  const bound = PENN_NAME_TO_CARD[`${ref.program}:${ref.name}`]
  if (bound) {
    const e = memberBookEntries.find(x => x.id === bound)
    if (e && isPublicMember(e) && getMemberProgram(e) === ref.program) {
      return { entry: e }
    }
    return { entry: null }
  }

  const want = letters(ref.name)
  const wantLoose = withoutInitials(ref.name)
  const exact: MemberBookEntry[] = []
  const loose: MemberBookEntry[] = []
  for (const e of memberBookEntries) {
    if (!isPublicMember(e)) continue
    if (getMemberProgram(e) !== ref.program) continue
    const start = getMemberStartYear(e)
    const end = getMemberEndYear(e)
    if (start == null || end == null) continue
    if (ref.year < start || ref.year > end) continue
    const names = [e.displayName, ...(NAME_ALIASES[e.id] ?? [])]
    if (names.some(n => letters(n) === want)) exact.push(e)
    else if (wantLoose && names.some(n => withoutInitials(n) === wantLoose)) loose.push(e)
  }
  // An exact hit beats a loose one, and only then is a single answer safe.
  const hits = exact.length > 0 ? exact : loose
  if (hits.length === 1) return { entry: hits[0] }
  if (hits.length > 1) return { entry: null, ambiguousWith: hits.map(h => h.id) }
  return { entry: null }
}

/** Convenience for callers that only want the card. */
export function cardForPennName(ref: PennNameRef): MemberBookEntry | null {
  return matchPennName(ref).entry
}
