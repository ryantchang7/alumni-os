/**
 * When is a gathering, and has it happened yet?
 *
 * Gatherings store a human `dateText` ("Saturday, August 22, 2026") because
 * hosts type it. That is display-friendly and machine-hostile: `Date.parse`
 * reads a yearless "Saturday, June 14" as **2001**, which would sort a brand
 * new round to the top of the board and then instantly bury it as "past".
 *
 * `dateISO` (YYYY-MM-DD) is the real answer and is set by the host form.
 * `dateText` parsing is the fallback for gatherings created before that
 * existed, with the year guarded.
 *
 * The safe direction is always "not past": a gathering nobody can date
 * ("Championship Weekend") stays on the board rather than silently vanishing.
 */

/** A round stays on the board until ~2am ET the morning after (6am UTC). */
const GRACE_MS = 30 * 60 * 60 * 1000

const HAS_YEAR = /\b\d{4}\b/

/**
 * `Date.parse` is far too eager: it reads "Championship Weekend, 2026" as
 * January 1st, because it finds a year and shrugs at the rest. So before
 * trusting it, require the text to actually name a month or a numeric date.
 */
const MONTH =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b/i
const NUMERIC_DATE = /\b\d{1,2}\s*[/-]\s*\d{1,2}\b/

function namesADate(text: string): boolean {
  return MONTH.test(text) || NUMERIC_DATE.test(text)
}

export interface GatheringDateFields {
  dateISO?: string
  dateText?: string
}

/**
 * Midnight (start) of the gathering's day, in ms. `null` when the date can't
 * be established — callers must treat that as "unknown", never as "past".
 */
export function resolveGatheringTime(g: GatheringDateFields): number | null {
  const iso = g.dateISO?.trim()
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const t = Date.parse(iso)
    if (!Number.isNaN(t)) return t
  }

  const text = g.dateText?.trim()
  if (!text || !namesADate(text)) return null

  // Written with a year: trust it.
  if (HAS_YEAR.test(text)) {
    const t = Date.parse(text)
    return Number.isNaN(t) ? null : t
  }

  // Yearless ("Saturday, June 14"). A host typing no year means the next one
  // of these, so take the first candidate year that hasn't already gone by.
  const now = Date.now()
  const thisYear = new Date(now).getFullYear()
  for (const year of [thisYear, thisYear + 1]) {
    const t = Date.parse(`${text}, ${year}`)
    if (Number.isNaN(t)) continue
    if (t + GRACE_MS >= now) return t
  }
  return null
}

/** True once the gathering's day is over. Undatable gatherings are never past. */
export function isPastGathering(g: GatheringDateFields, now = Date.now()): boolean {
  const t = resolveGatheringTime(g)
  if (t === null) return false
  return now > t + GRACE_MS
}

/** Sort key: soonest first, undatable last. */
export function gatheringSortKey(g: GatheringDateFields): number {
  return resolveGatheringTime(g) ?? Number.MAX_SAFE_INTEGER
}

/** Most recent first — for the played-rounds list. */
export function byMostRecentlyPlayed(a: GatheringDateFields, b: GatheringDateFields): number {
  return gatheringSortKey(b) - gatheringSortKey(a)
}

/**
 * "2026-08-22" -> "Saturday, August 22, 2026".
 *
 * Formatted in UTC on purpose: a YYYY-MM-DD parses to UTC midnight, and
 * rendering that in a negative-offset zone would show the day before.
 */
export function formatGatheringDate(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
