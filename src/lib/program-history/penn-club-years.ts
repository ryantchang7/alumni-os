/**
 * The years Penn Golf has no roster for.
 *
 * The Member Book is built from Penn Athletics' own published records. Those
 * records have a hole in them: no member in the book has a career touching
 * **1983 through 1992**, ten consecutive seasons. Every year on either side is
 * covered. The hole is not an oversight in the scraping; Penn did not publish
 * rosters for those seasons.
 *
 * David Posnick (W'88) raised it on 4 November 2026, unprompted, after being
 * shown the Clubhouse: the men's team was dropped to club status in that era
 * and the people who played then "don't appear in the records." He is right,
 * and the gap in the data matches what he described almost exactly.
 *
 * Everything below is someone's recollection, credited to the person who
 * offered it. **None of it is verified against a Penn record**, because no
 * Penn record of these seasons has been found. That is the whole point: this
 * list is a call for corrections, not a roster. It is deliberately kept apart
 * from the Member Book, which only carries what a published source supports.
 */

export interface ClubYearName {
  name: string
  /** Class year or playing span, exactly as it was given to us. */
  detail?: string
  /** Who remembered this person. Attribution is the only provenance there is. */
  rememberedBy: string
  /** Set when the person who gave it flagged their own uncertainty. */
  uncertain?: string
}

/** The gap, measured from the Member Book rather than asserted. */
export const CLUB_YEARS_FIRST = 1983
export const CLUB_YEARS_LAST = 1992

export const CLUB_YEARS_NAMES: ClubYearName[] = [
  {
    name: 'David Posnick',
    detail: 'W’88, played 1986 to 1988',
    rememberedBy: 'David Posnick',
  },
  {
    name: 'Rich Furman',
    detail: 'W’88, on the team before David',
    rememberedBy: 'David Posnick',
  },
  {
    name: 'Stephen DesJardins',
    detail: 'W’90, played 1986 to 1990',
    rememberedBy: 'David Posnick, confirmed by Stephen DesJardins',
  },
  {
    name: 'Jay DesJardins',
    detail: 'Played 1981 to 1985',
    rememberedBy: 'Stephen DesJardins',
  },
  {
    name: 'Greg Weinstein',
    detail: 'C’87, captain for several seasons in the 1983 to 1987 window',
    rememberedBy: 'David Posnick',
  },
  {
    name: 'Eric Cockman',
    detail: 'C’87',
    rememberedBy: 'David Posnick',
    uncertain: 'Spelling unconfirmed.',
  },
  {
    name: 'Burt McHugh',
    detail: 'Class of 1986, All-Ivy in 1984 and 1986',
    rememberedBy: 'David Posnick',
    uncertain: 'Class year unconfirmed.',
  },
]

/**
 * Things that do not yet add up, kept in the open rather than smoothed over.
 *
 * A page that quietly resolved these would be inventing history, and the
 * people who can actually settle them are the ones reading it.
 */
export const CLUB_YEARS_OPEN_QUESTIONS: Array<{ question: string; why: string }> = [
  {
    question: 'When exactly did the team lose varsity status, and when did it come back?',
    why:
      'The Member Book’s gap runs 1983 to 1992. David Posnick put the club era at roughly 1982 to 1991 and said so himself with a “I believe”. Nobody has produced a date either way.',
  },
  {
    question: 'How was Burt McHugh All-Ivy in 1984 and 1986?',
    why:
      'Both years fall inside the gap. Either the team was still in Ivy play for part of it, or the club era started later than remembered, or the award years are off. Any of the three would change the range above.',
  },
  {
    question: 'Was there a women’s team in these years, and what happened to it?',
    why:
      'The men’s demotion is described as a consequence of Title IX. Penn women’s golf did not become varsity until 1999, and its first five seasons are also unpublished. The two gaps may be the same story told from opposite ends.',
  },
]

/** Loose name match, same normalisation the Member Book bridge uses. */
function norm(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Is this person one of the club-years players?
 *
 * Needed because they have no Member Book card and never will: Penn
 * published no roster for 1983-1992, so a name-against-the-book check
 * reports them as "not a Penn golfer", which is the opposite of true.
 * Anything that writes to or classifies an unmatched person has to ask
 * this before deciding what they are.
 */
export function findClubYearsName(name: string | null | undefined): ClubYearName | null {
  if (!name) return null
  const target = norm(name)
  if (!target) return null
  return CLUB_YEARS_NAMES.find(n => norm(n.name) === target) ?? null
}
