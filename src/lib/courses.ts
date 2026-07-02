/**
 * Golf course / club name helpers.
 *
 * `homeCourse` and `favoriteCourses` are free text, so the same club shows up
 * as "The International" and "International", or "Belmont " with a stray space.
 * `normalizeCourseName` produces a stable GROUP KEY so those variants combine.
 * It is intentionally conservative — it only strips a leading "the", lowercases,
 * collapses whitespace, and trims trailing punctuation. It does NOT strip
 * "Golf Club" / "Country Club" suffixes, since "Belmont Golf Club" and
 * "Belmont Country Club" are genuinely different clubs.
 *
 * Group by the key; display a real human-typed variant (see the-course page).
 */
// Common golf-club abbreviations → their full form, so "Belmont CC" matches
// "Belmont Country Club" (but "Belmont GC" / Golf Club stays distinct). Order
// matters: the multi-word combos run before the single-token ones.
const COURSE_ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bg\s+and\s+cc\b/g, 'golf and country club'], // G&CC
  [/\bcc\b/g, 'country club'],
  [/\bg\s?c\b/g, 'golf club'], // GC / G C
  [/\bg\s+and\s+c\b/g, 'golf and country'],
  [/\bnatl\b/g, 'national'],
  [/\bintl\b/g, 'international'],
  [/\bmt\b/g, 'mount'],
]

export function normalizeCourseName(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/&/g, ' and ') // G&CC → "g and cc" before abbreviation expansion
    .replace(/\bthe\b/g, ' ') // drop "the" ANYWHERE (leading, or before a 2nd course)
    .replace(/['’.]/g, '') // apostrophes + periods: "int'l" → "intl", "G.C." → "gc"
    .replace(/[,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  for (const [re, full] of COURSE_ABBREVIATIONS) s = s.replace(re, full)
  return s.replace(/\s+/g, ' ').trim()
}
