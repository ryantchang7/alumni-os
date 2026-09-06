/**
 * One pass of keeping the season current. Shared by the hourly cron and by
 * the stale-page-view trigger, so both do exactly the same work.
 *
 *   1. Pull the Penn Athletics men's golf feed.
 *   2. Read any recap for a finished tournament and store the result. That
 *      is what moves an event off the board and into Results.
 *   3. Fill in any missing Clippd leaderboard link.
 *
 * Nothing here notifies anyone. These are silent corrections to data that
 * was already public, not news to push at people.
 */

import { planResultSync, fetchArticleHtml, type SyncPlanEntry } from '@/lib/season/sync-results'
import { resolveStopLinks } from '@/lib/clippd/penn-tournaments'

export interface SeasonSyncReport {
  news: { fetched: number; added: number; total: number }
  results: { plan: SyncPlanEntry[]; written: string[] }
  clippdLinks: { missing: number; linked: string[] }
}

export async function runSeasonSync(
  teamId: string,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<SeasonSyncReport> {
  const {
    upsertTeamNewsItems,
    getRecentTeamNewsItems,
    getTravelStops,
    updateTravelStop,
  } = await import('@/lib/store/local-store')
  const { fetchPennGolfNews } = await import('@/lib/news/penn-golf-feed')

  // 1. News.
  const fetched = await fetchPennGolfNews()
  let added = 0
  let total = 0
  if (fetched.length > 0 && !dryRun) {
    const r = await upsertTeamNewsItems(teamId, fetched)
    added = r.added
    total = r.total
  }

  // 2. Results, read out of the recaps.
  const news = await getRecentTeamNewsItems(teamId, 30)
  const stops = await getTravelStops(teamId)
  const { plan, candidates } = await planResultSync(stops, news, fetchArticleHtml)

  const written: string[] = []
  if (!dryRun) {
    for (const c of candidates) {
      const stop = stops.find(s => s.id === c.stopId)
      // Re-check the hand-typed guard here as well as in the planner: the
      // founder may have filled it in while this pass was running.
      if (!stop || stop.resultText?.trim()) continue
      await updateTravelStop(stop.id, {
        eventName: stop.eventName,
        locationText: stop.locationText,
        startDate: stop.startDate,
        endDate: stop.endDate,
        note: stop.note,
        linkUrl: stop.linkUrl,
        courseUrl: stop.courseUrl,
        imageUrl: stop.imageUrl,
        resultText: c.resultText,
      })
      written.push(`${c.eventName}: ${c.resultText}`)
    }
  }

  // 3. Clippd links for anything still missing one.
  const current = await getTravelStops(teamId)
  const needLinks = current.filter(s => !s.linkUrl)
  const linked: string[] = []
  if (needLinks.length > 0) {
    const resolved = await resolveStopLinks(needLinks)
    if (!dryRun) {
      for (const stop of needLinks) {
        const hit = resolved.get(stop.id)
        if (!hit) continue
        await updateTravelStop(stop.id, {
          eventName: stop.eventName,
          locationText: stop.locationText,
          startDate: stop.startDate,
          endDate: stop.endDate,
          note: stop.note,
          linkUrl: hit.url,
          courseUrl: stop.courseUrl,
          imageUrl: stop.imageUrl,
          resultText: stop.resultText,
        })
        linked.push(`${stop.eventName}: ${hit.url}`)
      }
    }
  }

  return {
    news: { fetched: fetched.length, added, total },
    results: { plan, written },
    clippdLinks: { missing: needLinks.length, linked },
  }
}
