// Season utilities for historical roster imports.

/**
 * Parse the start year from a season string like '2025-26' or '1999-00'.
 * Returns undefined if the input is not a valid season string.
 * Use assertValidSeason() when you need a hard failure on invalid input.
 */
export function parseSeasonStart(season: string): number | undefined {
  const m = season.match(/^(\d{4})-(\d{2})$/)
  if (!m) return undefined
  return parseInt(m[1], 10)
}

/**
 * Throw a descriptive error if the season string is not in YYYY-YY format.
 * Use at API boundaries where an invalid season string indicates a caller bug.
 */
export function assertValidSeason(season: string): void {
  if (!/^\d{4}-\d{2}$/.test(season)) {
    throw new Error(
      `Invalid season string: "${season}". Expected format YYYY-YY (e.g. "2025-26").`,
    )
  }
}

/**
 * Format a start year into a season string, e.g. 2025 → '2025-26', 1999 → '1999-00'.
 */
export function formatSeason(startYear: number): string {
  const end = (startYear + 1) % 100
  const endStr = end.toString().padStart(2, '0')
  return `${startYear}-${endStr}`
}

/**
 * Build a roster URL for a given season.
 * Current season (most recent): uses the base URL as-is.
 * Historical seasons: appends '/{seasonYear}' to the base URL.
 */
export function buildRosterSeasonUrl(baseUrl: string, seasonYear: string, currentSeasonYear: string): string {
  if (seasonYear === currentSeasonYear) return baseUrl
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/${seasonYear}`
}

/**
 * Generate a list of season strings from earliestStartYear up to and including
 * currentStartYear, in descending order (newest first).
 *
 * e.g. generateSeasonPlan(2023, 2025) → ['2025-26', '2024-25', '2023-24']
 */
export function generateSeasonPlan(earliestStartYear: number, currentStartYear: number): string[] {
  const seasons: string[] = []
  for (let y = currentStartYear; y >= earliestStartYear; y--) {
    seasons.push(formatSeason(y))
  }
  return seasons
}

/**
 * Infer the current season start year from today's date.
 * College sports seasons typically start in the fall, so:
 *   - If month >= 8 (August), current season start = this year
 *   - Otherwise, current season start = last year
 */
export function currentSeasonStartYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-based
  return month >= 8 ? now.getFullYear() : now.getFullYear() - 1
}

/**
 * Try to infer a season string from a page title.
 * Looks for a YYYY-YY pattern where the end suffix is exactly startYear+1 mod 100.
 * e.g. "2025-26 Men's Golf Roster" → "2025-26"
 *      "Men's Golf Roster"         → undefined
 */
export function inferSeasonFromTitle(title?: string): string | undefined {
  if (!title) return undefined
  const m = title.match(/\b(\d{4})-(\d{2})\b/)
  if (!m) return undefined
  const startYear = parseInt(m[1], 10)
  const endSuffix = parseInt(m[2], 10)
  if (endSuffix !== (startYear + 1) % 100) return undefined
  return `${m[1]}-${m[2]}`
}
