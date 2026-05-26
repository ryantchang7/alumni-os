/**
 * Calendar helpers: build an ICS file + a Google Calendar "add event" URL
 * from a Clubhouse gathering.
 *
 * The gathering's `dateText` is a free-text human label (e.g. "Saturday,
 * June 14, 2026") plus optional `timeText` (e.g. "8:00 AM shotgun"). We
 * parse those into a real start instant; if parsing fails, we fall back
 * to noon ET on the date and a 2-hour duration so the calendar entry is
 * still usable.
 */

import type { ClubhouseGathering } from '@/lib/store/types'

interface CalendarEvent {
  /** Stable identifier — used as ICS UID. */
  uid: string
  title: string
  description: string
  location?: string
  /** Start as a Date in the local interpretation. */
  start: Date
  /** End as a Date. Defaults to start + 2 hours. */
  end: Date
}

const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i

function parseGatheringInstant(g: Pick<ClubhouseGathering, 'dateText' | 'timeText'>): { start: Date; end: Date } {
  // Try to extract a Date from dateText (e.g. "Saturday, June 14, 2026").
  // The Date constructor handles that format on V8 reasonably well.
  const dateParsed = new Date(g.dateText)
  const baseDate = isNaN(dateParsed.getTime()) ? new Date() : dateParsed

  // Parse hour/minute from timeText, defaulting to noon.
  let hour = 12
  let minute = 0
  if (g.timeText) {
    const m = g.timeText.match(TIME_RE)
    if (m) {
      hour = parseInt(m[1], 10) % 12
      if (m[3].toLowerCase() === 'pm') hour += 12
      minute = m[2] ? parseInt(m[2], 10) : 0
    }
  }

  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour, minute, 0)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  return { start, end }
}

function gatheringToEvent(g: ClubhouseGathering, clubhouseUrl: string): CalendarEvent {
  const { start, end } = parseGatheringInstant(g)
  const locationBits = [g.venue, g.city, g.state].filter(Boolean) as string[]
  const description = [
    g.description?.trim(),
    `Host: ${g.hostName}`,
    `RSVP'd via the Penn Golf Clubhouse: ${clubhouseUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n')
  return {
    uid: `${g.id}@penngolfclubhouse.com`,
    title: g.title,
    description,
    location: locationBits.length > 0 ? locationBits.join(', ') : undefined,
    start,
    end,
  }
}

function toIcsDate(d: Date): string {
  // YYYYMMDDTHHmmssZ (UTC). Strips milliseconds.
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** Build a single-event ICS file body suitable for emailing as an attachment. */
export function buildIcs(g: ClubhouseGathering, clubhouseUrl: string): string {
  const ev = gatheringToEvent(g, clubhouseUrl)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Penn Golf Clubhouse//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(ev.start)}`,
    `DTEND:${toIcsDate(ev.end)}`,
    `SUMMARY:${escapeIcsText(ev.title)}`,
    `DESCRIPTION:${escapeIcsText(ev.description)}`,
    ev.location ? `LOCATION:${escapeIcsText(ev.location)}` : '',
    `URL:${clubhouseUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  // RFC 5545: lines separated by CRLF.
  return lines.join('\r\n') + '\r\n'
}

/** Build a one-click "Add to Google Calendar" URL for the same event. */
export function buildGoogleCalendarUrl(g: ClubhouseGathering, clubhouseUrl: string): string {
  const ev = gatheringToEvent(g, clubhouseUrl)
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${fmt(ev.start)}/${fmt(ev.end)}`,
    details: ev.description,
    sf: 'true',
    output: 'xml',
  })
  if (ev.location) params.set('location', ev.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
