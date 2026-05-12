/**
 * Unit tests for src/lib/scraping/seasons.ts
 * Run: npm run test:seasons
 */

import {
  parseSeasonStart,
  assertValidSeason,
  formatSeason,
  buildRosterSeasonUrl,
  generateSeasonPlan,
  inferSeasonFromTitle,
} from '../src/lib/scraping/seasons'

interface Result {
  label: string
  pass: boolean
  detail?: string
}

function assert(label: string, pass: boolean, detail?: string): Result {
  return { label, pass, detail }
}

const results: Result[] = []

// formatSeason
results.push(
  assert('formatSeason(2025) = "2025-26"', formatSeason(2025) === '2025-26', formatSeason(2025)),
  assert('formatSeason(1999) = "1999-00"', formatSeason(1999) === '1999-00', formatSeason(1999)),
  assert('formatSeason(2009) = "2009-10"', formatSeason(2009) === '2009-10', formatSeason(2009)),
  assert('formatSeason(2000) = "2000-01"', formatSeason(2000) === '2000-01', formatSeason(2000)),
)

// parseSeasonStart — safe parser, never throws
results.push(
  assert('parseSeasonStart("2025-26") = 2025', parseSeasonStart('2025-26') === 2025, String(parseSeasonStart('2025-26'))),
  assert('parseSeasonStart("1999-00") = 1999', parseSeasonStart('1999-00') === 1999, String(parseSeasonStart('1999-00'))),
  assert('parseSeasonStart("invalid") = undefined (safe, no throw)', parseSeasonStart('invalid') === undefined),
  assert('parseSeasonStart("2025") = undefined (safe, no throw)', parseSeasonStart('2025') === undefined),
)

// assertValidSeason — throws on invalid, silent on valid
let assertThrew = false
try { assertValidSeason('invalid') } catch { assertThrew = true }
results.push(assert('assertValidSeason("invalid") throws', assertThrew, 'did not throw'))

let assertThrew2 = false
try { assertValidSeason('2025') } catch { assertThrew2 = true }
results.push(assert('assertValidSeason("2025") throws (missing suffix)', assertThrew2, 'did not throw'))

let assertSilent = true
try { assertValidSeason('2025-26') } catch { assertSilent = false }
results.push(assert('assertValidSeason("2025-26") does not throw', assertSilent, 'threw unexpectedly'))

let assertSilent2 = true
try { assertValidSeason('1999-00') } catch { assertSilent2 = false }
results.push(assert('assertValidSeason("1999-00") does not throw', assertSilent2, 'threw unexpectedly'))

// generateSeasonPlan
const plan = generateSeasonPlan(2023, 2025)
results.push(
  assert(
    'generateSeasonPlan(2023, 2025) length = 3',
    plan.length === 3,
    `got ${plan.length}: ${plan.join(', ')}`,
  ),
  assert(
    'generateSeasonPlan starts with newest',
    plan[0] === '2025-26',
    `first: ${plan[0]}`,
  ),
  assert(
    'generateSeasonPlan ends with oldest',
    plan[plan.length - 1] === '2023-24',
    `last: ${plan[plan.length - 1]}`,
  ),
)

// buildRosterSeasonUrl
const base = 'https://pennathletics.com/sports/mens-golf/roster'
results.push(
  assert(
    'buildRosterSeasonUrl current season = base URL',
    buildRosterSeasonUrl(base, '2025-26', '2025-26') === base,
    buildRosterSeasonUrl(base, '2025-26', '2025-26'),
  ),
  assert(
    'buildRosterSeasonUrl historical appends season',
    buildRosterSeasonUrl(base, '2024-25', '2025-26') === `${base}/2024-25`,
    buildRosterSeasonUrl(base, '2024-25', '2025-26'),
  ),
  assert(
    'buildRosterSeasonUrl strips trailing slash from base',
    buildRosterSeasonUrl(`${base}/`, '2023-24', '2025-26') === `${base}/2023-24`,
    buildRosterSeasonUrl(`${base}/`, '2023-24', '2025-26'),
  ),
)

// inferSeasonFromTitle
results.push(
  assert(
    'inferSeasonFromTitle("2025-26 Men\'s Golf Roster") = "2025-26"',
    inferSeasonFromTitle("2025-26 Men's Golf Roster") === '2025-26',
    String(inferSeasonFromTitle("2025-26 Men's Golf Roster")),
  ),
  assert(
    'inferSeasonFromTitle("2003-04 Men\'s Golf Roster") = "2003-04"',
    inferSeasonFromTitle("2003-04 Men's Golf Roster") === '2003-04',
    String(inferSeasonFromTitle("2003-04 Men's Golf Roster")),
  ),
  assert(
    'inferSeasonFromTitle("Men\'s Golf Roster") = undefined',
    inferSeasonFromTitle("Men's Golf Roster") === undefined,
    String(inferSeasonFromTitle("Men's Golf Roster")),
  ),
)

// Print results
let passed = 0
let failed = 0
console.log('── Season Utils Tests ──\n')
for (const r of results) {
  const icon = r.pass ? '  ✓' : '  ✗'
  const detail = !r.pass && r.detail ? ` (${r.detail})` : ''
  console.log(`${icon}  ${r.label}${detail}`)
  if (r.pass) passed++
  else failed++
}
console.log(`\n${'─'.repeat(50)}`)
console.log(`Total: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
else console.log('All season utility tests passed.')
