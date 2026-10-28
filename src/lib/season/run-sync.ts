/**
 * One pass of keeping the season current. Shared by the hourly cron and by
 * the stale-page-view trigger, so both do exactly the same work.
 *
 *   0. Put any event Penn has published that the board is missing onto the
 *      board. The schedule was hand-typed, so it went stale on its own.
 *   1. Pull the Penn Athletics men's golf feed.
 *   2. Read any recap for a finished tournament and store the result. That
 *      is what moves an event off the board and into Results.
 *   3. Fill in any missing Clippd leaderboard link.
 *
 * Nothing here notifies anyone. These are silent corrections to data that
 * was already public, not news to push at people.
 */

import {
  planResultSync,
  fetchArticleHtml,
  type SyncPlanEntry,
  type ReparseOutcome,
} from '@/lib/season/sync-results'
import { resolveStopLinks } from '@/lib/clippd/penn-tournaments'
import {
  fetchPennSchedule,
  planScheduleSync,
  type SchedulePlanEntry,
} from '@/lib/season/penn-schedule'

export interface SeasonSyncReport {
  schedule: { published: number; added: string[]; plan: SchedulePlanEntry[] }
  news: { fetched: number; added: number; total: number }
  results: { plan: SyncPlanEntry[]; written: string[]; reparse?: ReparseOutcome }
  clippdLinks: { missing: number; linked: string[] }
}

export async function runSeasonSync(
  teamId: string,
  { dryRun = false, reparse }: { dryRun?: boolean; reparse?: string } = {},
): Promise<SeasonSyncReport> {
  const {
    upsertTeamNewsItems,
    getRecentTeamNewsItems,
    getTravelStops,
    createTravelStop,
    updateTravelStop,
    setSiteContent,
  } = await import('@/lib/store/local-store')
  const { fetchPennGolfNews } = await import('@/lib/news/penn-golf-feed')

  // 0. Schedule. Only ever adds, and only an event that matches nothing
  //    already on the board. Runs before results so an event added here can
  //    pick up its result in the same pass.
  const published = await fetchPennSchedule()
  const scheduleAdded: string[] = []
  const existingStops = await getTravelStops(teamId)
  const { add, plan: schedulePlan } = planScheduleSync(existingStops, published)
  if (!dryRun) {
    for (const e of add) {
      await createTravelStop({
        teamId,
        eventName: e.eventName,
        locationText: e.locationText,
        startDate: e.startDate,
        endDate: e.endDate,
        note: e.note,
      })
      scheduleAdded.push(`${e.eventName} (${e.startDate})`)
    }
  }

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
  const stops = scheduleAdded.length > 0 ? await getTravelStops(teamId) : existingStops
  const {
    plan,
    candidates,
    reparse: reparseOutcome,
  } = await planResultSync(stops, news, fetchArticleHtml, undefined, { reparse })

  const written: string[] = []
  if (!dryRun) {
    for (const c of candidates) {
      const stop = stops.find(s => s.id === c.stopId)
      if (!stop) continue
      // Re-check the hand-typed guard here as well as in the planner: the
      // founder may have filled it in while this pass was running. A
      // candidate carrying `replaces` is the one stop a re-derive named, so
      // it is allowed past — that is the whole point of asking.
      if (stop.resultText?.trim() && c.replaces === undefined) continue
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
      written.push(
        `${c.eventName}: ${c.replaces ? `${c.replaces} → ` : ''}${c.resultText}`,
      )
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

  // A heartbeat, so "is the site keeping itself up to date" is a question
  // with an answer rather than a hope. Nothing else reads this; it exists to
  // be looked at, which matters most when nobody is at a laptop to notice
  // that the hourly job quietly stopped.
  if (!dryRun) {
    try {
      await setSiteContent(
        'season-sync.last-run',
        JSON.stringify({
          at: new Date().toISOString(),
          newsFetched: fetched.length,
          newsAdded: added,
          scheduleAdded: scheduleAdded.length,
          resultsWritten: written.length,
          linksWritten: linked.length,
        }),
      )
    } catch {
      // A heartbeat that fails must never fail the sync it is reporting on.
    }
  }

  return {
    schedule: { published: published.length, added: scheduleAdded, plan: schedulePlan },
    news: { fetched: fetched.length, added, total },
    results: { plan, written, reparse: reparseOutcome },
    clippdLinks: { missing: needLinks.length, linked },
  }
}
