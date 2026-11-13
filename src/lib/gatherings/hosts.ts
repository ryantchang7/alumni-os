/**
 * Splitting a gathering's host line into the people in it.
 *
 * `hostName` is one free-text field, because a host types what the day
 * actually looks like: "Ryan Chang & Raymond Chang", "Carter Thompson and
 * Ivana Shah", "Penn Golf Alumni". The card wants to link each real person
 * in that string to their card, which means the resolver and the renderer
 * have to agree exactly on where the boundaries are. They used to disagree:
 * both split on `&` alone, so "Carter Thompson and Ivana Shah" was one
 * fifteen-character "name" that matched nobody and linked nothing.
 *
 * One splitter, used by both, is the whole point of this file. It also
 * accepts the word "and" and commas, which is how people actually write two
 * or three names.
 *
 * `\s+and\s+` requires whitespace on both sides, so a name that merely
 * contains the letters (Alexander, Sandy, Anderson) is never cut in half.
 */

/** Capturing, so `split` hands back the separators along with the names. */
const HOST_SPLIT = /(\s*&\s*|\s+and\s+|\s*,\s*)/i

export interface HostToken {
  text: string
  /** True for a name to resolve and link, false for the glue between them. */
  isName: boolean
}

/**
 * The host line as alternating name / separator tokens. Separators keep
 * their original text, so "A & B" does not come back out as "A and B".
 */
export function hostTokens(hostName: string): HostToken[] {
  // split() with one capturing group yields [name, sep, name, sep, ...],
  // so position decides what a token is. No re-matching, no ambiguity.
  return (hostName || '')
    .split(HOST_SPLIT)
    .map((part, i) => ({
      text: i % 2 === 0 ? part.trim() : part,
      isName: i % 2 === 0,
    }))
    .filter(t => t.text.length > 0)
}

/** Just the names, for the resolver. */
export function splitHostNames(hostName: string): string[] {
  return hostTokens(hostName)
    .filter(t => t.isName)
    .map(t => t.text)
}

/**
 * Grid classes for a list of gathering cards.
 *
 * A single card in a two-column grid sits in the left cell and leaves the
 * other 636px of the row empty, which on a laptop reads as a page that
 * failed to load rather than a club with one thing on. Capping the width
 * of a lone card keeps it the same size it would be beside a sibling,
 * without the hole next to it.
 */
export function gatheringGridClass(count: number): string {
  return count === 1
    ? 'grid grid-cols-1 gap-4 max-w-[620px]'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
}
