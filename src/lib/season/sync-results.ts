/**
 * Keep the season schedule current on its own.
 *
 * Penn Athletics publishes a recap within hours of a tournament ending.
 * Until now somebody had to read it and retype the result into the site,
 * which meant the board went on advertising a finished event as "Live"
 * until they got round to it. This reads the recap instead.
 *
 * Rules it will not break:
 *  - A result typed in by hand is never overwritten. The founder outranks
 *    the parser, always.
 *  - Only stops whose last day has passed are considered, so an in-progress
 *    tournament cannot be closed out by an over-eager match.
 *  - A recap has to be about the right tournament: published in the event's
 *    own window and sharing distinctive words with its name.
 *  - Anything uncertain is skipped and reported, not guessed at.
 */

import { parseResult } from '@/lib/season/parse-result'
import { usEasternToday } from '@/lib/us-date'
import type { TeamNewsItem, TeamTravelStop } from '@/lib/store/types'

/** Words too common in Penn golf headlines to identify an event. */
const STOP_WORDS = new Set([
  'the', 'and', 'at', 'of', 'in', 'for', 'on', 'a', 'an',
  'mens', 'men', 'golf', 'penn', 'quakers', 'university', 'pennsylvania',
  'tournament', 'invitational', 'championship', 'championships', 'classic',
  'collegiate', 'memorial', 'cup', 'open', 'intercollegiate',
])

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w)),
  )
}

/**
 * How strongly a recap's headline points at this event. Generic words are
 * stripped first, so "Macdonald Cup" is carried by "macdonald" rather than
 * by "cup", which half the schedule shares.
 */
export function nameOverlap(eventName: string, headline: string): number {
  const a = tokens(eventName)
  const b = tokens(headline)
  if (a.size === 0) return 0
  let hits = 0
  for (const w of a) if (b.has(w)) hits++
  return hits / a.size
}

function endOf(stop: TeamTravelStop): string {
  return stop.endDate ?? stop.startDate
}

function daysBetween(aISO: string, bISO: string): number {
  return Math.round(
    (Date.parse(`${aISO}T00:00:00Z`) - Date.parse(`${bISO}T00:00:00Z`)) / 86400000,
  )
}

export interface ResultCandidate {
  stopId: string
  eventName: string
  articleTitle: string
  articleUrl: string
  resultText: string
  confidence: number
}

export interface SyncPlanEntry {
  eventName: string
  status: 'matched' | 'no-article' | 'unparseable' | 'already-set' | 'not-finished'
  resultText?: string
  articleTitle?: string
  articleUrl?: string
}

/**
 * Pick the best recap for each finished stop that has no result yet.
 * `fetchArticle` is injected so this stays testable without the network.
 */
export async function planResultSync(
  stops: TeamTravelStop[],
  news: TeamNewsItem[],
  fetchArticle: (url: string) => Promise<string | null>,
  today = usEasternToday(),
): Promise<{ plan: SyncPlanEntry[]; candidates: ResultCandidate[] }> {
  const plan: SyncPlanEntry[] = []
  const candidates: ResultCandidate[] = []

  for (const stop of stops) {
    if (stop.resultText?.trim()) {
      plan.push({ eventName: stop.eventName, status: 'already-set' })
      continue
    }
    // Only look at events that are actually over. An event ending today is
    // left alone until tomorrow, so a recap of round two cannot close it.
    if (endOf(stop) >= today) {
      plan.push({ eventName: stop.eventName, status: 'not-finished' })
      continue
    }

    // A recap lands from the last day up to about a week afterwards.
    const inWindow = news.filter(n => {
      const published = (n.publishedAt ?? n.fetchedAt).slice(0, 10)
      const afterStart = daysBetween(published, stop.startDate) >= 0
      const beforeCutoff = daysBetween(published, endOf(stop)) <= 8
      return afterStart && beforeCutoff
    })

    const scored = inWindow
      .map(n => ({ n, overlap: nameOverlap(stop.eventName, n.title) }))
      .filter(x => x.overlap >= 0.5)
      .sort((a, b) => b.overlap - a.overlap)

    if (scored.length === 0) {
      plan.push({ eventName: stop.eventName, status: 'no-article' })
      continue
    }

    let done = false
    for (const { n, overlap } of scored) {
      const html = await fetchArticle(n.sourceUrl)
      if (!html) continue
      const parsed = parseResult(n.title, html)
      if (!parsed) continue
      candidates.push({
        stopId: stop.id,
        eventName: stop.eventName,
        articleTitle: n.title,
        articleUrl: n.sourceUrl,
        resultText: parsed.resultText,
        confidence: overlap,
      })
      plan.push({
        eventName: stop.eventName,
        status: 'matched',
        resultText: parsed.resultText,
        articleTitle: n.title,
        articleUrl: n.sourceUrl,
      })
      done = true
      break
    }
    if (!done) plan.push({ eventName: stop.eventName, status: 'unparseable' })
  }

  return { plan, candidates }
}

/** Fetch a Penn Athletics recap. Returns null rather than throwing. */
export async function fetchArticleHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PennGolfClubhouse/1.0)' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}
