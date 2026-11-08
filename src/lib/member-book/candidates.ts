/**
 * Candidates for "who is this account, probably?" — for human review only.
 *
 * Deliberately NOT a change to findBookEntryForTeamStorePerson. That
 * function joins a live person record to a historical card and is used
 * where a wrong answer silently attaches one member's history to another,
 * so it stays exact. This returns a ranked list with the evidence for
 * each, and nothing here may ever auto-link, auto-claim or auto-approve.
 *
 * Why it exists, measured 2026-11-08 against the ten accounts that signed
 * in after the November 3 board meeting and were all reported "no match":
 *
 *   Richard G. Steingraber, mens 1972-1976, a letter winner and the 1976
 *   captain, IS in the Member Book. His account name is "Richard
 *   Steingraber". normalizeName keeps letters and drops punctuation, so
 *   "richardgsteingraber" never equalled "richardsteingraber". One middle
 *   initial hid a captain.
 *
 *   Melissa Aylor, womens 2004-2005, IS in the Member Book. Her account
 *   has no name at all, because an emailed sign-in link carries no Google
 *   profile. Her address is melissa.aylor@gmail.com, whose local part
 *   matches her card exactly. We had the answer and never looked at it.
 *
 * The other eight are genuinely absent, and for three different reasons
 * that the product had collapsed into one. See GAPS below.
 */

import type { MemberBookEntry } from './types'
import { memberBookEntries } from './data'
import { isPublicMember, getMemberProgram, getMemberStartYear, getMemberEndYear } from './helpers'

/** Letters only, the same reduction findBookEntryForTeamStorePerson uses. */
const letters = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '')

/** Letters only, with single-letter name parts (middle initials) removed. */
const withoutInitials = (s: string): string =>
  letters(
    s
      .toLowerCase()
      .split(/\s+/)
      .filter(part => part.replace(/[^a-z]/g, '').length > 1)
      .join(' '),
  )

/** Word-ish pieces of an email local part: "melissa.aylor" -> [melissa, aylor] */
const localParts = (email: string): string[] =>
  email
    .split('@')[0]
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(t => t.length > 1)

/**
 * Names a card is also known by: maiden and married names, and the formal
 * version of a name the record holds as a nickname.
 *
 * Hand-curated and deliberately small. These are not guesses: each one is
 * a person whose two names are known to be the same person. Fuzzy
 * nickname expansion (Rich/Richard/Dick) applied in general would merge
 * strangers, so a name only appears here when somebody established it.
 */
export const NAME_ALIASES: Record<string, string[]> = {
  'w-melissa-aylor': ['Melissa Maurer'],
  'club-rich-furman': ['Richard Furman'],
  'w-stacy-kress-politziner': ['Stacy Kress', 'Stacy Politziner'],
}

export type CandidateBasis =
  | 'exact-name'
  | 'name-without-initials'
  | 'known-alias'
  | 'email-local-part'

export interface CardCandidate {
  entry: MemberBookEntry
  basis: CandidateBasis
  /** What a reviewer needs to see to agree or disagree, in one line. */
  evidence: string
  program: string
  startYear: number | null
  endYear: number | null
}

const BASIS_RANK: Record<CandidateBasis, number> = {
  'exact-name': 0,
  'known-alias': 1,
  'name-without-initials': 2,
  'email-local-part': 3,
}

/**
 * Ranked possibilities for an account, strongest first. An empty list means
 * "we do not know", which is a legitimate and common answer: it is true for
 * every player of the men's 1982-1992 club seasons and every woman who
 * played before 2004, because Penn published no roster for either.
 *
 * Never returns a decision. Two people can share a name, a shared surname
 * in an address proves nothing, and a reviewer has to say yes.
 */
export function findCardCandidates(input: {
  name?: string | null
  email?: string | null
}): CardCandidate[] {
  const pub = memberBookEntries.filter(isPublicMember)
  const found = new Map<string, CardCandidate>()

  const add = (entry: MemberBookEntry, basis: CandidateBasis, evidence: string) => {
    const existing = found.get(entry.id)
    if (existing && BASIS_RANK[existing.basis] <= BASIS_RANK[basis]) return
    found.set(entry.id, {
      entry,
      basis,
      evidence,
      program: getMemberProgram(entry),
      startYear: getMemberStartYear(entry),
      endYear: getMemberEndYear(entry),
    })
  }

  const name = input.name?.trim()
  if (name) {
    const exact = letters(name)
    const loose = withoutInitials(name)
    for (const e of pub) {
      const aliases = NAME_ALIASES[e.id] ?? []
      if (letters(e.displayName) === exact) {
        add(e, 'exact-name', `Account name "${name}" matches the card exactly.`)
      } else if (aliases.some(a => letters(a) === exact)) {
        add(
          e,
          'known-alias',
          `"${name}" is a recorded alternate name for "${e.displayName}".`,
        )
      } else if (loose && withoutInitials(e.displayName) === loose) {
        add(
          e,
          'name-without-initials',
          `Account name "${name}" matches "${e.displayName}" once middle initials are set aside.`,
        )
      }
    }
  }

  const email = input.email?.trim()
  if (email) {
    const parts = localParts(email)
    // Two or more pieces that all appear in the name, so "melissa.aylor"
    // counts and "rkramer" does not. A single token is a surname at best
    // and matches far too many people to put in front of a reviewer.
    if (parts.length >= 2) {
      for (const e of pub) {
        const names = [e.displayName, ...(NAME_ALIASES[e.id] ?? [])]
        const dn = names.map(letters).join('|')
        if (parts.every(p => dn.includes(p))) {
          add(
            e,
            'email-local-part',
            `Every part of "${email.split('@')[0]}" appears in "${e.displayName}". The account carries no name, so this is the only signal.`,
          )
        }
      }
    }
  }

  return [...found.values()].sort(
    (a, b) =>
      BASIS_RANK[a.basis] - BASIS_RANK[b.basis] ||
      a.entry.displayName.localeCompare(b.entry.displayName),
  )
}

/**
 * Where the Member Book has nothing to find, measured from the book itself
 * rather than asserted. A person whose years fall in one of these was not
 * missed by the matcher; Penn published no roster for them.
 *
 * Note the men's club gap is 1982-1992 in the book. Penn Athletics' own
 * captains document describes the club era as 1982-1991, and
 * CLUB_YEARS_FIRST in the program-history module says 1983. Three sources,
 * three answers, and this file does not get to pick: it reports what the
 * book actually lacks.
 */
export interface BookGap {
  program: 'mens' | 'womens'
  from: number
  to: number
  why: string
}

export const GAPS: BookGap[] = [
  {
    program: 'mens',
    from: 1982,
    to: 1992,
    why: 'Penn dropped the men’s team to club status and published no roster. Players from these seasons exist and have no card.',
  },
  {
    program: 'mens',
    from: 1943,
    to: 1945,
    why: 'Wartime. No roster published.',
  },
  {
    program: 'womens',
    from: 1999,
    to: 2003,
    why: 'The women’s program went varsity in 1999 but the earliest roster Penn publishes is 2004-05, so its first five seasons are missing entirely.',
  },
]

/** The gap a class year or playing season falls into, if any. */
export function gapFor(program: 'mens' | 'womens', year: number | null): BookGap | null {
  if (!year) return null
  return GAPS.find(g => g.program === program && year >= g.from && year <= g.to) ?? null
}
