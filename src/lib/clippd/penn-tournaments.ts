/**
 * Resolve our own schedule entries to exact Clippd scoreboard links.
 *
 * The schedule used to fall back to https://scoreboard.clippd.com, which drops
 * you on the national homepage and makes you hunt for Penn. Clippd has a
 * public, unauthenticated JSON route that returns a school's whole season with
 * tournament ids, so we can link the actual event instead.
 *
 *   GET /api/tournaments?schoolId=4048&season=2027&limit=40
 *   -> { size, results: [{ tournamentId, tournamentName, startDate, endDate,
 *                          gender, venue, ... }] }
 *
 * Matching is by DATE first and name second, deliberately. Clippd's canonical
 * names do not match the ones on pennathletics.com — our "Alex Lagowitz
 * Memorial" is their "10th Alex Lagowitz Memorial", and it is renamed every
 * year — so exact name matching silently misses. Two events for the same team
 * never overlap in time, which makes the date the reliable key.
 */

/** Penn men's golf on Clippd. Stable, and it appears in other events'
 * `competingSchools` arrays, so it is safe to hardcode. Penn women's is 2674. */
export const PENN_MENS_SCHOOL_ID = '4048'

const CLIPPD_ORIGIN = 'https://scoreboard.clippd.com'

export interface ClippdTournament {
  tournamentId: string
  tournamentName: string
  startDate: string
  endDate?: string
  gender?: string
  venue?: string
}

/**
 * Clippd seasons run a year ahead of the calendar for fall events: a
 * September 2026 tournament is season 2027, and so is the April 2027 one that
 * closes the same academic year.
 */
export function clippdSeasonFor(startDate: string): number {
  const [y, m] = startDate.split('-').map(Number)
  if (!y || !m) return new Date().getUTCFullYear()
  return m >= 7 ? y + 1 : y
}

/** A tournament's public page. It 307s to the right subpage (participants
 * before the event, scoring once it starts), so we link the bare id. */
export function clippdTournamentUrl(tournamentId: string): string {
  return `${CLIPPD_ORIGIN}/tournaments/${tournamentId}`
}

/**
 * Where to send someone when we could not resolve an id. Clippd's search key
 * is `keywords`; /results/upcoming scopes to future events, which is what an
 * unresolved stop almost always is.
 */
export function clippdSearchUrl(eventName: string): string {
  return `${CLIPPD_ORIGIN}/results/upcoming?keywords=${encodeURIComponent(eventName)}`
}

/** One season of Penn men's tournaments. Returns [] on any failure — a dead
 * Clippd must never take the schedule down with it. */
export async function fetchPennTournaments(season: number): Promise<ClippdTournament[]> {
  const url = `${CLIPPD_ORIGIN}/api/tournaments?schoolId=${PENN_MENS_SCHOOL_ID}&season=${season}&limit=40`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PennGolfClubhouse/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: ClippdTournament[] }
    return Array.isArray(data.results) ? data.results : []
  } catch {
    return []
  }
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/** Word overlap, used only to break a tie between two same-week events. */
function nameAffinity(a: string, b: string): number {
  const norm = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['the', 'and', 'men', 'mens', 'golf'].includes(w)),
    )
  const x = norm(a)
  const y = norm(b)
  let hits = 0
  for (const w of x) if (y.has(w)) hits++
  return hits
}

/**
 * Best Clippd match for one of our stops, or null.
 *
 * Note St Andrews splits into two Clippd tournaments (Stroke Play Oct 12-13,
 * Medal Match Oct 14) while we hold it as one Oct 12-14 stop. Overlap catches
 * both and the name tiebreak is what picks the one Penn actually appears in.
 */
export function matchTournament(
  stop: { eventName: string; startDate: string; endDate?: string },
  tournaments: ClippdTournament[],
): ClippdTournament | null {
  const sStart = stop.startDate
  const sEnd = stop.endDate ?? stop.startDate
  const candidates = tournaments.filter(t => {
    if (t.gender && t.gender !== 'Men') return false
    return overlaps(sStart, sEnd, t.startDate, t.endDate ?? t.startDate)
  })
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  return candidates
    .map(t => ({ t, score: nameAffinity(stop.eventName, t.tournamentName) }))
    .sort((a, b) => b.score - a.score || a.t.startDate.localeCompare(b.t.startDate))[0].t
}

/**
 * Resolve many stops at once, fetching each needed season only once.
 * Returns one entry per stop that matched.
 */
export async function resolveStopLinks(
  stops: Array<{ id: string; eventName: string; startDate: string; endDate?: string }>,
): Promise<Map<string, { tournamentId: string; tournamentName: string; url: string }>> {
  const seasons = [...new Set(stops.map(s => clippdSeasonFor(s.startDate)))]
  const bySeason = new Map<number, ClippdTournament[]>()
  await Promise.all(
    seasons.map(async season => {
      bySeason.set(season, await fetchPennTournaments(season))
    }),
  )
  const out = new Map<string, { tournamentId: string; tournamentName: string; url: string }>()
  for (const stop of stops) {
    const pool = bySeason.get(clippdSeasonFor(stop.startDate)) ?? []
    const hit = matchTournament(stop, pool)
    if (hit) {
      out.set(stop.id, {
        tournamentId: hit.tournamentId,
        tournamentName: hit.tournamentName,
        url: clippdTournamentUrl(hit.tournamentId),
      })
    }
  }
  return out
}
