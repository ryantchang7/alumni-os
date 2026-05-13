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
  toAbsoluteUrl,
  parseSeasonUrlsFromHtml,
  buildSeasonUrlCandidates,
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

// toAbsoluteUrl
const absBase = 'https://pennathletics.com/sports/mens-golf/roster'
results.push(
  assert(
    'toAbsoluteUrl: absolute href returns unchanged',
    toAbsoluteUrl('https://example.com/path', absBase) === 'https://example.com/path',
    toAbsoluteUrl('https://example.com/path', absBase) ?? 'null',
  ),
  assert(
    'toAbsoluteUrl: relative path resolves to absolute',
    toAbsoluteUrl('/sports/roster?year=2024', absBase) === 'https://pennathletics.com/sports/roster?year=2024',
    toAbsoluteUrl('/sports/roster?year=2024', absBase) ?? 'null',
  ),
  assert(
    'toAbsoluteUrl: query-only href resolves correctly',
    toAbsoluteUrl('?roster_year=2024-25', absBase) === `${absBase}?roster_year=2024-25`,
    toAbsoluteUrl('?roster_year=2024-25', absBase) ?? 'null',
  ),
  assert('toAbsoluteUrl: fragment returns null', toAbsoluteUrl('#section', absBase) === null, 'not null'),
  assert('toAbsoluteUrl: empty string returns null', toAbsoluteUrl('', absBase) === null, 'not null'),
  assert('toAbsoluteUrl: javascript: returns null', toAbsoluteUrl('javascript:void(0)', absBase) === null, 'not null'),
)

// parseSeasonUrlsFromHtml
const htmlWithSelect = `
<select name="roster_year">
  <option value="/sports/mens-golf/roster?roster_year=2025-26" selected>2025-26</option>
  <option value="/sports/mens-golf/roster?roster_year=2024-25">2024-25</option>
  <option value="/sports/mens-golf/roster?roster_year=2023-24">2023-24</option>
  <option value="not-a-url">some-text</option>
</select>`

const htmlWithAnchors = `
<a href="/sports/mens-golf/roster/2025-26">2025-26 Roster</a>
<a href="/sports/mens-golf/roster/2024-25">2024-25</a>
<a href="#skip">Skip nav</a>`

const htmlWithBothDupes = `
<option value="?roster_year=2024-25">2024-25</option>
<a href="/roster/2024-25">2024-25</a>`

const selectMap = parseSeasonUrlsFromHtml(htmlWithSelect, 'https://pennathletics.com')
results.push(
  assert('parseSeasonUrlsFromHtml: finds 3 seasons from select', selectMap.size === 3, `size: ${selectMap.size}`),
  assert(
    'parseSeasonUrlsFromHtml: 2024-25 resolves to absolute URL',
    selectMap.get('2024-25') === 'https://pennathletics.com/sports/mens-golf/roster?roster_year=2024-25',
    selectMap.get('2024-25') ?? 'missing',
  ),
  assert(
    'parseSeasonUrlsFromHtml: invalid value "not-a-url" is ignored (no season pattern)',
    !selectMap.has('some-text'),
    'should not be present',
  ),
)

const anchorMap = parseSeasonUrlsFromHtml(htmlWithAnchors, 'https://pennathletics.com')
results.push(
  assert('parseSeasonUrlsFromHtml: finds 2 seasons from anchors', anchorMap.size === 2, `size: ${anchorMap.size}`),
  assert(
    'parseSeasonUrlsFromHtml: fragment anchor ignored',
    !anchorMap.has('#skip') && anchorMap.size === 2,
    `size: ${anchorMap.size}`,
  ),
)

const dupeMap = parseSeasonUrlsFromHtml(htmlWithBothDupes, 'https://pennathletics.com')
results.push(
  assert('parseSeasonUrlsFromHtml: option takes priority over anchor for same season', dupeMap.size === 1, `size: ${dupeMap.size}`),
  assert(
    'parseSeasonUrlsFromHtml: first found URL wins for duplicate season',
    dupeMap.get('2024-25')?.includes('roster_year=2024-25') === true,
    dupeMap.get('2024-25') ?? 'missing',
  ),
)

// buildSeasonUrlCandidates
const candidateBase = 'https://pennathletics.com/sports/mens-golf/roster'
const candidates = buildSeasonUrlCandidates(candidateBase, '2024-25')
results.push(
  assert('buildSeasonUrlCandidates: includes ?roster_year= pattern', candidates.some(c => c.includes('roster_year=2024-25')), candidates.join(', ')),
  assert('buildSeasonUrlCandidates: includes ?season= pattern', candidates.some(c => c.includes('season=2024-25')), candidates.join(', ')),
  assert('buildSeasonUrlCandidates: includes path-based pattern', candidates.some(c => c.endsWith('/2024-25')), candidates.join(', ')),
  assert('buildSeasonUrlCandidates: no duplicates', candidates.length === new Set(candidates).size, `${candidates.length} vs ${new Set(candidates).size}`),
)

const candidatesWithParsed = buildSeasonUrlCandidates(candidateBase, '2024-25', 'https://pennathletics.com/sports/mens-golf/roster?roster_year=2024-25')
results.push(
  assert('buildSeasonUrlCandidates: parsed URL is first candidate', candidatesWithParsed[0] === 'https://pennathletics.com/sports/mens-golf/roster?roster_year=2024-25', candidatesWithParsed[0]),
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
