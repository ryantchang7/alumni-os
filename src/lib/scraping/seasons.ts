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
 * @deprecated Use buildSeasonUrlCandidates for robust multi-pattern resolution.
 */
export function buildRosterSeasonUrl(baseUrl: string, seasonYear: string, currentSeasonYear: string): string {
  if (seasonYear === currentSeasonYear) return baseUrl
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/${seasonYear}`
}

/**
 * Convert a relative href to an absolute URL given a base URL.
 * Returns null if the href is empty, a bare fragment, or javascript:.
 */
export function toAbsoluteUrl(href: string, baseUrl: string): string | null {
  if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return null
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

const _SEASON_RE = /\b(\d{4})-(\d{2})\b/

function _isValidSeason(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})$/)
  if (!m) return false
  return parseInt(m[2], 10) === (parseInt(m[1], 10) + 1) % 100
}

/**
 * Parse season URLs from roster page HTML by scanning <option> values and <a> hrefs
 * for YYYY-YY season patterns.  Returns Map<seasonYear, absoluteUrl>.
 */
export function parseSeasonUrlsFromHtml(html: string, baseUrl: string): Map<string, string> {
  const map = new Map<string, string>()

  // <option value="...">...</option>
  const optRe = /<option[^>]+value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi
  let m: RegExpExecArray | null
  while ((m = optRe.exec(html)) !== null) {
    const value = m[1]
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    const sm = value.match(_SEASON_RE) ?? text.match(_SEASON_RE)
    if (!sm || !_isValidSeason(sm[0])) continue
    const season = sm[0]
    if (value && (value.startsWith('http') || value.startsWith('/') || value.includes('?'))) {
      const abs = toAbsoluteUrl(value, baseUrl)
      if (abs && !map.has(season)) map.set(season, abs)
    }
  }

  // <a href="...">...</a>
  const aRe = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  while ((m = aRe.exec(html)) !== null) {
    const href = m[1]
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    const sm = href.match(_SEASON_RE) ?? text.match(_SEASON_RE)
    if (!sm || !_isValidSeason(sm[0])) continue
    const season = sm[0]
    if (!map.has(season)) {
      const abs = toAbsoluteUrl(href, baseUrl)
      if (abs) map.set(season, abs)
    }
  }

  return map
}

/**
 * Build a list of candidate URLs to try for a given season, in order of likelihood.
 * Pass parsedUrl (from parseSeasonUrlsFromHtml) if available — it will be tried first.
 * Covers SideArm Sports (?roster_year=), generic query params, and path-based patterns.
 */
export function buildSeasonUrlCandidates(baseUrl: string, season: string, parsedUrl?: string): string[] {
  const base = baseUrl.replace(/\/$/, '')
  const [startYear, endSuffix] = season.split('-')
  const fullEndYear = `${startYear.slice(0, 2)}${endSuffix}`
  const raw: string[] = [
    ...(parsedUrl ? [parsedUrl] : []),
    `${base}?roster_year=${season}`,
    `${base}?season=${season}`,
    `${base}?roster=${season}`,
    `${base}?year=${startYear}`,
    `${base}/${season}`,
    `${base}/${startYear}-${fullEndYear}`,
  ]
  return [...new Set(raw)]
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
