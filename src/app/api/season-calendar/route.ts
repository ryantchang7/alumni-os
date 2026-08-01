/**
 * GET /api/season-calendar — the 2026–27 schedule as an .ics file, built
 * from the same TeamTravelStops the Season hub renders. All-day events;
 * public (the schedule is public on the Team Room anyway).
 */

import { getTeamBySlug, getTravelStops } from '@/lib/store/local-store'

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
const dateNum = (iso: string) => iso.replaceAll('-', '')

/** DTEND on all-day events is exclusive — day after the last day. */
function dayAfter(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const team = await getTeamBySlug('penn-mens-golf')
  const stops = team ? await getTravelStops(team.id) : []
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'

  const events = stops
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map(s =>
      [
        'BEGIN:VEVENT',
        `UID:${s.id}@penngolfclubhouse.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${dateNum(s.startDate)}`,
        `DTEND;VALUE=DATE:${dateNum(dayAfter(s.endDate ?? s.startDate))}`,
        `SUMMARY:${esc(`Penn Golf — ${s.eventName}`)}`,
        `LOCATION:${esc(s.locationText)}`,
        ...(s.note ? [`DESCRIPTION:${esc(s.note)}`] : []),
        'END:VEVENT',
      ].join('\r\n'),
    )

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Penn Golf Clubhouse//Season Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Penn Men\'s Golf 2026-27',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="penn-golf-2026-27.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
