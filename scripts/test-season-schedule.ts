/**
 * Guards the schedule sync — the only thing in the app that creates public
 * content on its own.
 *
 * It exists because the board was hand-typed and went stale: the Big 5
 * Championship was missing the day before it was played, so the site
 * advertised February as the next event. The danger in fixing that is the
 * opposite failure, a duplicate event published to everyone, so most of
 * what follows is about refusing to add rather than adding.
 *
 *   npx tsx scripts/test-season-schedule.ts
 */

import {
  parsePennSchedule,
  planScheduleSync,
  sameEvent,
  splitVenue,
  eventTokens,
  venueMapUrl,
  MAX_ADDS_PER_RUN,
} from '../src/lib/season/penn-schedule'
import type { TeamTravelStop } from '../src/lib/store/types'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

const event = (name: string, start: string, venue: string, end = start) =>
  `{"@context":"https://schema.org/","name":"University of Pennsylvania At ${name}",` +
  `"homeTeam":{"@type":"SportsTeam","name":"University of Pennsylvania"},` +
  `"awayTeam":{"@type":"SportsTeam","name":"${name}"},` +
  `"startDate":"${start}T00:00:00","endDate":"${end}T00:00:00",` +
  `"location":{"@type":"Place","name":"${venue}"},` +
  `"description":"x","@type":"SportsEvent"}`

const stop = (over: Partial<TeamTravelStop>): TeamTravelStop => ({
  id: 'a', teamId: 't', eventName: 'Big 5 Championship', locationText: 'Elverson, PA',
  startDate: '2026-10-29', createdAt: '', ...over,
})

console.log('\n── Reading Penn\'s published schedule ──')
const html =
  '<script type="application/ld+json">[' +
  event('Big 5 Championship', '2026-10-29', 'Elverson, Pa. / Stonewall Links - Old Course') + ',' +
  event('Macdonald Cup (18 holes)', '2026-09-25', 'New Haven, Conn. / Yale Golf Course') + ',' +
  event('Palmas Del Mar Collegiate', '2027-02-12', 'Humacao, Puerto Rico / Flamboyan', '2027-02-14') +
  ']</script>'
const parsed = parsePennSchedule(html)
ok('all three events parse', parsed.length === 3, `${parsed.length}`)
ok('they come back in date order',
  parsed.map(e => e.startDate).join() === '2026-09-25,2026-10-29,2027-02-12')
const big5 = parsed.find(e => e.eventName.startsWith('Big 5'))
ok('the event name is Penn\'s, not the "Penn At ..." wrapper',
  big5?.eventName === 'Big 5 Championship', big5?.eventName)
ok('"(18 holes)" is stripped from the name',
  parsed.some(e => e.eventName === 'Macdonald Cup'))
ok('a multi-day event keeps its end date',
  parsed.find(e => e.eventName.startsWith('Palmas'))?.endDate === '2027-02-14')
ok('a one-day event ends the day it starts', big5?.endDate === '2026-10-29')
ok('malformed JSON is skipped, not thrown',
  parsePennSchedule('<script>[{"@context":"https://schema.org/","name":"x' +
    ' broken "@type":"SportsEvent"}]</script>').length === 0)
ok('a page with no schedule yields nothing', parsePennSchedule('<html></html>').length === 0)

console.log('\n── Venues are written the way the board writes them ──')
ok('Pa. becomes PA', splitVenue('Elverson, Pa. / Stonewall Links').locationText === 'Elverson, PA')
ok('Conn. becomes CT', splitVenue('New Haven, Conn. / Yale').locationText === 'New Haven, CT')
ok('Ariz. becomes AZ', splitVenue('Goodyear, Ariz. / Palm Valley').locationText === 'Goodyear, AZ')
ok('Scotland is left alone',
  splitVenue('St. Andrews, Scotland / St. Andrews Links').locationText === 'St. Andrews, Scotland')
ok('Puerto Rico is left alone',
  splitVenue('Humacao, Puerto Rico / Flamboyan').locationText === 'Humacao, Puerto Rico')
ok('the course becomes the note',
  splitVenue('Elverson, Pa. / Stonewall Links - Old Course').note === 'Stonewall Links · Old Course')
ok('no course means no note', splitVenue('Elverson, Pa.').note === undefined)

ok('a parsed event carries a map link',
  (big5?.courseUrl ?? '').startsWith('https://www.google.com/maps/search/'))
ok('the map link names the course and the town',
  decodeURIComponent(big5?.courseUrl ?? '').includes('Stonewall Links') &&
  decodeURIComponent(big5?.courseUrl ?? '').includes('Elverson, PA'))
ok('a venue with no name gets no link', venueMapUrl('', undefined) === undefined)
ok('the query is encoded, not raw',
  !(big5?.courseUrl ?? '').includes(' '))
ok('the "·" separator is not carried into the search query',
  !decodeURIComponent(big5?.courseUrl ?? '').includes('·'))

console.log('\n── Telling a new event from one already on the board ──')
ok('Penn\'s spelling still matches the board\'s',
  sameEvent({ eventName: 'St. Andrews Links Intercollegiate', startDate: '2026-10-12' },
            { eventName: 'St Andrews Links Collegiate', startDate: '2026-10-12' }))
ok('a date that drifted by a day still matches',
  sameEvent({ eventName: 'Macdonald Cup', startDate: '2026-09-25' },
            { eventName: 'Macdonald Cup', startDate: '2026-09-26' }))
ok('the same event a year later still matches on name',
  sameEvent({ eventName: 'Princeton Invitational', startDate: '2028-04-10' },
            { eventName: 'Princeton Invitational', startDate: '2027-04-10' }))
ok('two genuinely different events do not match',
  !sameEvent({ eventName: 'Big 5 Championship', startDate: '2026-10-29' },
             { eventName: 'Macdonald Cup', startDate: '2026-10-29' }))
ok('shared generic words alone are not a match',
  !sameEvent({ eventName: 'Loyola Intercollegiate', startDate: '2027-02-28' },
             { eventName: 'Wildcat Spring Invitational', startDate: '2027-02-28' }))
ok('numerals survive tokenising', eventTokens('Big 5 Championship').has('5'))

console.log('\n── What it will and will not add ──')
const today = '2026-10-28'
const onBoard = [stop({ id: 'x', eventName: 'Macdonald Cup', startDate: '2026-09-26' })]
const pennSide = [
  { eventName: 'Macdonald Cup', startDate: '2026-09-25', endDate: '2026-09-26', locationText: 'New Haven, CT' },
  { eventName: 'Big 5 Championship', startDate: '2026-10-29', endDate: '2026-10-29', locationText: 'Elverson, PA' },
]
const planned = planScheduleSync(onBoard, pennSide, today)
ok('the missing event is added', planned.add.length === 1 && planned.add[0].eventName === 'Big 5 Championship')
ok('the event already on the board is not re-added',
  planned.plan.find(p => p.eventName === 'Macdonald Cup')?.status === 'already-on-board')

const dup = planScheduleSync(
  [stop({ id: 'y', eventName: 'Big 5 Championship', startDate: '2026-10-29' })],
  [pennSide[1]], today)
ok('an event already on the board is never duplicated', dup.add.length === 0)

const finished = planScheduleSync([], [
  { eventName: 'Gone By', startDate: '2026-09-01', endDate: '2026-09-02', locationText: 'X' },
], today)
ok('a finished event is not back-filled', finished.add.length === 0)
ok('and it says why', finished.plan[0].status === 'already-finished')

const tooMany = planScheduleSync([], Array.from({ length: MAX_ADDS_PER_RUN + 3 }, (_, i) => ({
  eventName: `Distinct Event ${100 + i}`, startDate: '2027-06-01', endDate: '2027-06-02', locationText: 'X',
})), today)
ok(`never adds more than ${MAX_ADDS_PER_RUN} in one pass`, tooMany.add.length === MAX_ADDS_PER_RUN)
ok('the overflow is reported, not silently dropped',
  tooMany.plan.filter(p => p.status === 'over-cap').length === 3)

const empty = planScheduleSync(onBoard, [], today)
ok('an unreachable Penn page adds nothing', empty.add.length === 0)

console.log(`\n${pass.length} passed, ${fail.length} failed`)
if (fail.length) {
  console.log('FAILED:', fail.join(' | '))
  process.exit(1)
}
