/**
 * Keep the season fresh on page views, not only on the hour.
 *
 * The cron is the floor: it guarantees the site catches up even if nobody
 * visits. This is the ceiling. When someone opens the Team Room and the
 * data has gone stale, a sync is kicked off after the response has already
 * been sent, so the page itself is never slowed down and the next viewer,
 * or a reload a moment later, sees the new state.
 *
 * Deliberately conservative:
 *  - Staleness is read off the news we already store, so this needs no new
 *    state of its own.
 *  - An in-process flag stops one instance from starting several at once.
 *  - Every failure is swallowed. A dead Penn feed or a slow Clippd must
 *    never take the Team Room down with it.
 */

import { after } from 'next/server'

/** How old the newest fetch may be before a page view triggers a refresh. */
const STALE_AFTER_MS = 15 * 60 * 1000

/** Per-instance guard against several overlapping runs. */
let inFlight = false
let lastRunAt = 0

export function isStale(items: Array<{ fetchedAt?: string }>, now = Date.now()): boolean {
  if (items.length === 0) return true
  const newest = items.reduce((max, i) => {
    const t = i.fetchedAt ? Date.parse(i.fetchedAt) : 0
    return t > max ? t : max
  }, 0)
  if (!newest) return true
  return now - newest > STALE_AFTER_MS
}

/**
 * Run the season sync in the background if the data looks stale.
 * Safe to call on every render; it decides for itself whether to do anything.
 */
export function refreshSeasonIfStale(
  teamId: string,
  news: Array<{ fetchedAt?: string }>,
): void {
  if (inFlight) return
  if (Date.now() - lastRunAt < STALE_AFTER_MS) return
  if (!isStale(news)) return

  inFlight = true
  lastRunAt = Date.now()

  after(async () => {
    try {
      const { runSeasonSync } = await import('@/lib/season/run-sync')
      await runSeasonSync(teamId)
    } catch {
      // Silent on purpose. The cron will try again on the hour.
    } finally {
      inFlight = false
    }
  })
}
