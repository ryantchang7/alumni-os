/**
 * Read Penn's published schedule and put missing events on the board.
 *
 * The results sync reads Penn's recaps and fills in how an event ended. It
 * never asks whether the event was on the schedule in the first place, and
 * the schedule was typed in by hand, so a gap stays a gap. That is how the
 * Big 5 Championship came to be missing the day before it was played, with
 * the board advertising February as the next event.
 *
 * Penn publishes the schedule as schema.org SportsEvent objects, which carry
 * a clean event name, start and end dates and a venue. That is a far better
 * source than scraped markup, and the reason this is safe enough to let it
 * create content on its own.
 *
 * The rules it will not break:
 *  - It only ever ADDS. Nothing here edits or deletes an existing stop, so a
 *    hand-corrected name, note or result cannot be clobbered.
 *  - An event that plausibly matches a stop already on the board is skipped.
 *    Penn's spelling drifts from the board's ("St. Andrews Links
 *    Intercollegiate" against "St Andrews Links Collegiate") and its dates
 *    drift by a day, so matching tolerates both.
 *  - Finished events are not added. Back-filling history is a different job
 *    with different risks, and this one runs unattended.
 *  - At most MAX_ADDS_PER_RUN in a pass, so a parsing change cannot flood
 *    the board.
 */

import { usEasternToday } from '@/lib/us-date'
import type { TeamTravelStop } from '@/lib/store/types'

const SCHEDULE_URL = 'https://pennathletics.com/sports/mens-golf/schedule'

/** A pass that wants to add more than this has misread something. */
export const MAX_ADDS_PER_RUN = 5

export interface PennScheduleEvent {
  eventName: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD. Equal to startDate for a one-day event. */
  endDate: string
  locationText: string
  /** The course, when Penn names one separately from the town. */
  note?: string
}

/** Words that identify no event, because half the schedule shares them. */
const GENERIC = new Set([
  'the', 'and', 'at', 'of', 'in', 'for', 'on', 'a', 'an', 'vs',
  'mens', 'men', 'golf', 'penn', 'quakers', 'university', 'pennsylvania',
  'tournament', 'invitational', 'championship', 'championships', 'classic',
  'collegiate', 'intercollegiate', 'memorial', 'cup', 'open', 'links',
])

/**
 * The identifying words of an event name. Numerals are kept whatever their
 * length — the "5" in "Big 5" is the most identifying part of that name.
 */
export function eventTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => (w.length > 2 || /^\d+$/.test(w)) && !GENERIC.has(w)),
  )
}

function daysApart(a: string, b: string): number {
  return Math.abs(
    Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000),
  )
}

/**
 * Is this Penn event the stop already on the board?
 *
 * Deliberately generous, because the cost of a false negative — a duplicate
 * event published to everyone — is far worse than the cost of a false
 * positive, which is only that a genuinely new event is skipped and someone
 * adds it by hand.
 */
export function sameEvent(
  penn: { eventName: string; startDate: string },
  stop: { eventName: string; startDate: string },
): boolean {
  const a = eventTokens(penn.eventName)
  const b = eventTokens(stop.eventName)
  const shared = [...a].filter(w => b.has(w)).length
  const smaller = Math.min(a.size, b.size)
  // Any identifying word in common, within a fortnight, is the same event.
  if (smaller > 0 && shared > 0 && daysApart(penn.startDate, stop.startDate) <= 14) return true
  // Or the names agree outright, whatever the dates say.
  if (smaller > 0 && shared === smaller) return true
  return false
}

/**
 * Penn writes states AP style ("New Haven, Conn."); the board writes them
 * USPS style ("New Haven, CT"). Anything not in here is left exactly as
 * Penn wrote it, which is what keeps "St. Andrews, Scotland" intact.
 */
const AP_STATE: Record<string, string> = {
  ala: 'AL', ariz: 'AZ', ark: 'AR', calif: 'CA', colo: 'CO', conn: 'CT',
  del: 'DE', fla: 'FL', ga: 'GA', ill: 'IL', ind: 'IN', kan: 'KS', ky: 'KY',
  la: 'LA', md: 'MD', mass: 'MA', mich: 'MI', minn: 'MN', miss: 'MS',
  mo: 'MO', mont: 'MT', neb: 'NE', nev: 'NV', okla: 'OK', ore: 'OR',
  pa: 'PA', tenn: 'TN', vt: 'VT', va: 'VA', wash: 'WA', wis: 'WI',
  wyo: 'WY', nh: 'NH', nj: 'NJ', nm: 'NM', ny: 'NY', nc: 'NC', nd: 'ND',
  ri: 'RI', sc: 'SC', sd: 'SD', wva: 'WV',
}

/** "Elverson, Pa. / Stonewall Links - Old Course" → town + course. */
export function splitVenue(raw: string): { locationText: string; note?: string } {
  const parts = raw.split('/').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return { locationText: raw.trim() }
  const locationText = parts[0]
    .replace(/,\s*([A-Za-z.]+)\.?\s*$/, (whole, state: string) => {
      const key = state.replace(/\./g, '').toLowerCase()
      return AP_STATE[key] ? `, ${AP_STATE[key]}` : whole
    })
    .trim()
  const course = parts.slice(1).join(' / ').replace(/\s*-\s*/g, ' · ').trim()
  return { locationText, note: course || undefined }
}

/** Pull Penn's SportsEvent objects out of the schedule page. */
export function parsePennSchedule(html: string): PennScheduleEvent[] {
  const out: PennScheduleEvent[] = []
  const seen = new Set<string>()
  // Each event is its own self-contained JSON object in the page's ld+json
  // payload. Matching them individually survives Penn changing what sits
  // around them.
  const re = /\{"@context":"https:\/\/schema\.org\/","name":"[\s\S]*?"@type":"SportsEvent"\}/g
  for (const chunk of html.match(re) ?? []) {
    let obj: Record<string, unknown>
    try {
      obj = JSON.parse(chunk)
    } catch {
      continue
    }
    const away = (obj.awayTeam as { name?: string } | undefined)?.name?.trim()
    const home = (obj.homeTeam as { name?: string } | undefined)?.name?.trim()
    // Penn is one side of every row; the event is the other.
    const isPennHome = /pennsylvania/i.test(home ?? '')
    const rawName = (isPennHome ? away : home) ?? away
    const start = String(obj.startDate ?? '').slice(0, 10)
    const end = String(obj.endDate ?? '').slice(0, 10) || start
    if (!rawName || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue
    const eventName = rawName.replace(/\s*\(\d+\s*holes?\)\s*$/i, '').trim()
    if (!eventName) continue
    const key = `${eventName}|${start}`
    if (seen.has(key)) continue
    seen.add(key)
    const venueName =
      (obj.location as { name?: string } | undefined)?.name?.trim() ?? ''
    out.push({
      eventName,
      startDate: start,
      endDate: end >= start ? end : start,
      ...splitVenue(venueName),
    })
  }
  return out.sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export async function fetchPennSchedule(): Promise<PennScheduleEvent[]> {
  try {
    const res = await fetch(SCHEDULE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PennGolfClubhouse/1.0)' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return parsePennSchedule(await res.text())
  } catch {
    return []
  }
}

export interface SchedulePlanEntry {
  eventName: string
  startDate: string
  status: 'add' | 'already-on-board' | 'already-finished' | 'over-cap'
  matchedStop?: string
}

/** Decide which of Penn's events are missing from the board. */
export function planScheduleSync(
  stops: TeamTravelStop[],
  events: PennScheduleEvent[],
  today = usEasternToday(),
): { add: PennScheduleEvent[]; plan: SchedulePlanEntry[] } {
  const add: PennScheduleEvent[] = []
  const plan: SchedulePlanEntry[] = []

  for (const e of events) {
    const match = stops.find(s => sameEvent(e, s))
    if (match) {
      plan.push({
        eventName: e.eventName,
        startDate: e.startDate,
        status: 'already-on-board',
        matchedStop: match.eventName,
      })
      continue
    }
    if (e.endDate < today) {
      plan.push({ eventName: e.eventName, startDate: e.startDate, status: 'already-finished' })
      continue
    }
    if (add.length >= MAX_ADDS_PER_RUN) {
      plan.push({ eventName: e.eventName, startDate: e.startDate, status: 'over-cap' })
      continue
    }
    add.push(e)
    plan.push({ eventName: e.eventName, startDate: e.startDate, status: 'add' })
  }

  return { add, plan }
}
