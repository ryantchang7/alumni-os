/**
 * Unit tests for src/lib/gatherings/date.ts
 * Run: npm run test:gathering-dates
 *
 * The case that matters most: a yearless "Saturday, June 14" must never be
 * read as the year 2001. Raw Date.parse does exactly that, which would sort a
 * new round to the top of the board and then bury it as already played.
 */

import {
  resolveGatheringTime,
  isPastGathering,
  gatheringSortKey,
  byMostRecentlyPlayed,
} from '../src/lib/gatherings/date'

interface Result {
  label: string
  pass: boolean
  detail?: string
}

const results: Result[] = []
function assert(label: string, pass: boolean, detail?: string) {
  results.push({ label, pass, detail })
}

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-08-26T12:00:00Z') // the Wednesday after the trip
const yearOf = (t: number | null) => (t === null ? null : new Date(t).getUTCFullYear())

// ── The 2001 trap ──────────────────────────────────────────────────────────
assert(
  'raw Date.parse still reads a yearless date as 2001 (the bug we guard)',
  new Date(Date.parse('Saturday, June 14')).getFullYear() === 2001,
)
assert(
  'yearless dateText never resolves to 2001',
  yearOf(resolveGatheringTime({ dateText: 'Saturday, June 14' })) !== 2001,
  String(yearOf(resolveGatheringTime({ dateText: 'Saturday, June 14' }))),
)
assert(
  'yearless dateText is not treated as past',
  isPastGathering({ dateText: 'Saturday, June 14' }) === false,
)
assert(
  'the host form placeholder itself survives',
  isPastGathering({ dateText: 'Saturday, June 14' }) === false,
)

// ── dateISO wins ───────────────────────────────────────────────────────────
assert(
  'dateISO is preferred over dateText',
  resolveGatheringTime({ dateISO: '2026-08-22', dateText: 'whenever' }) === Date.parse('2026-08-22'),
)
assert(
  'a malformed dateISO falls back to dateText',
  resolveGatheringTime({ dateISO: 'nope', dateText: 'August 22, 2026' }) !== null,
)

// ── past vs upcoming ───────────────────────────────────────────────────────
const belmont = { dateISO: '2026-08-22', dateText: 'Saturday, August 22, 2026' }
const international = { dateISO: '2026-08-23', dateText: 'Sunday, August 23, 2026' }
const merion = { dateISO: '2026-09-19', dateText: 'Saturday, September 19, 2026' }

assert('Belmont (Aug 22) is past on Aug 26', isPastGathering(belmont, NOW) === true)
assert('The International (Aug 23) is past on Aug 26', isPastGathering(international, NOW) === true)
assert('Merion (Sep 19) is not past on Aug 26', isPastGathering(merion, NOW) === false)

// ── the grace window: a round today stays up while it's being played ──────
const todayNoon = Date.parse('2026-08-26T12:00:00Z')
const today = { dateISO: '2026-08-26' }
assert('a round today is not past at noon', isPastGathering(today, todayNoon) === false)
assert(
  'a round today is not past at 11pm UTC (7pm ET, still on the course)',
  isPastGathering(today, Date.parse('2026-08-26T23:00:00Z')) === false,
)
assert(
  'a round yesterday is past by the next afternoon',
  isPastGathering({ dateISO: '2026-08-25' }, Date.parse('2026-08-26T18:00:00Z')) === true,
)

// ── undatable gatherings must never vanish ────────────────────────────────
assert(
  '"Championship Weekend" resolves to null',
  resolveGatheringTime({ dateText: 'Championship Weekend' }) === null,
)
assert(
  '"Championship Weekend" is never past',
  isPastGathering({ dateText: 'Championship Weekend' }, NOW) === false,
)
assert('an empty gathering is never past', isPastGathering({}, NOW) === false)

// A title that merely contains a year must not become January 1st. Raw
// Date.parse does exactly that, which would expire the event on sight.
assert(
  'raw Date.parse turns "Alumni Weekend, 2026" into Jan 1 (the bug we guard)',
  new Date(Date.parse('Alumni Weekend, 2026')).getUTCMonth() === 0,
)
assert(
  '"Alumni Weekend 2026" resolves to null, not Jan 1',
  resolveGatheringTime({ dateText: 'Alumni Weekend 2026' }) === null,
)
assert(
  '"Alumni Weekend 2026" is never past',
  isPastGathering({ dateText: 'Alumni Weekend 2026' }, NOW) === false,
)
assert(
  'a numeric date still parses',
  resolveGatheringTime({ dateText: '9/19/2026' }) !== null,
)
assert(
  '"maybe next spring" is not mistaken for May',
  resolveGatheringTime({ dateText: 'maybe next spring' }) === null,
)
assert('undatable sorts last', gatheringSortKey({ dateText: 'Championship Weekend' }) === Number.MAX_SAFE_INTEGER)

// ── ordering ───────────────────────────────────────────────────────────────
assert(
  'soonest first: Belmont before Merion',
  gatheringSortKey(belmont) < gatheringSortKey(merion),
)
const played = [belmont, international].sort(byMostRecentlyPlayed)
assert(
  'played list is most-recent first: Aug 23 before Aug 22',
  played[0].dateISO === '2026-08-23',
  played[0].dateISO,
)

// ── a yearless date near a year boundary rolls forward, not back ──────────
const decNow = Date.parse('2026-12-20T12:00:00Z')
const janYear = yearOf(resolveGatheringTime({ dateText: 'January 10' }))
assert(
  'a yearless January date resolves to a sane year, not 2001',
  janYear !== null && janYear >= 2026,
  String(janYear),
)

// Print
let passed = 0
let failed = 0
console.log('── Gathering Date Tests ──\n')
for (const r of results) {
  const icon = r.pass ? '  ✓' : '  ✗'
  const detail = !r.pass && r.detail ? ` (got: ${r.detail})` : ''
  console.log(`${icon}  ${r.label}${detail}`)
  if (r.pass) passed++
  else failed++
}
console.log(`\n${'─'.repeat(60)}`)
console.log(`Total: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
else console.log('All gathering date tests passed.')
