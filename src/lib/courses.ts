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
export function normalizeCourseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bthe\b/g, ' ') // drop "the" ANYWHERE (leading, or before a 2nd course)
    .replace(/[.,;:&]+/g, ' ') // punctuation / ampersands
    .replace(/\s+/g, ' ')
    .trim()
}
