/**
 * Golden-fixture tests for roster extraction.
 *
 * Tests Strategy A (Sidearm HTML extraction) against two known Penn
 * Men's Golf roster formats: modern (2025-26) and historical (2003-04).
 *
 * Run:  npm run test:roster
 */

import { extractRoster } from '../src/lib/scraping/extract-roster'
import type { RosterEntryPreview } from '../src/lib/scraping/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSidearmPlayer(opts: {
  slug: string
  id: number
  name: string
  height?: string
  classAbbr: string
  classFull: string
  hometown?: string
  highSchool?: string
}): string {
  const { slug, id, name, height, classAbbr, classFull, hometown, highSchool } = opts
  const href = `/sports/mens-golf/roster/${slug}/${id}`
  const heightSpan = height
    ? `<span class="sidearm-roster-player-height">${height}</span>`
    : ''
  const hometownSpan = hometown
    ? `<span class="sidearm-roster-player-hometown">${hometown}</span>`
    : ''
  const highSchoolSpan = highSchool
    ? `<span class="sidearm-roster-player-highschool">${highSchool}</span>`
    : ''

  return `
  <li class="sidearm-roster-player" data-player-url="${href}">
    <div class="sidearm-roster-player-container">
      <div class="sidearm-roster-player-details">
        <div class="sidearm-roster-player-pertinents">
          <div class="sidearm-roster-player-position">
            ${heightSpan}
          </div>
          <div class="sidearm-roster-player-name">
            <h3><a href="${href}" aria-label="${name} - View Full Bio">${name}</a></h3>
          </div>
          <div class="sidearm-roster-player-other hide-on-large">
            <div class="sidearm-roster-player-class-hometown">
              <span class="sidearm-roster-player-academic-year hide-on-large">${classAbbr}</span>
              ${hometownSpan}
              ${highSchoolSpan}
            </div>
            <div class="sidearm-roster-player-bio">
              <a href="${href}" aria-label="${name} - View Full Bio">Full Bio</a>
            </div>
          </div>
        </div>
      </div>
      <div class="sidearm-roster-player-other hide-on-medium-down">
        <div class="sidearm-roster-player-class-hometown">
          <span class="sidearm-roster-player-academic-year">${classFull}</span>
          ${hometownSpan}
          ${highSchoolSpan}
        </div>
        <div class="sidearm-roster-player-bio">
          <a href="${href}" aria-label="${name} - View Full Bio">Full Bio</a>
        </div>
      </div>
    </div>
    <button class="sidearm-roster-player-toggle">Hide/Show Additional Information For ${name}</button>
  </li>`
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Real Sidearm HTML structure for 2025-26 Penn Men's Golf roster.
 * 8 players with heights.
 *
 * Expected players (8):
 *   Hayden Adams    – Junior    – Lexington, Ky.      – Sayre School
 *   Arjun Caprihan  – Freshman  – Short Hills, N.J.   – Newark Academy
 *   Ryan Chang      – Sophomore – Brookline, Mass.     – Windermere (Fla.) Prep
 *   Henry Chen      – Freshman  – Hillsborough, Calif. – Crystal Springs Uplands School
 *   Max Fonseca     – Junior    – Miami, Fla.          – Christopher Columbus
 *   Owen Hayes      – Senior    – Bedford Hills, N.Y.  – Brunswick School
 *   Wesley Hu       – Sophomore – Suwanee, Ga.         – Lambert
 *   Kayden Wang     – Freshman  – San Diego, Calif.    – The Bishop's School
 */
const FIXTURE_2025_HTML = `<!DOCTYPE html>
<html>
<head><title>Penn Golf - 2025-26 Roster</title></head>
<body>
<h1>Men's Golf 2025-26 Roster</h1>
<section aria-label="Men's Player Roster">
<ul class="sidearm-roster-players">
${makeSidearmPlayer({ slug: 'hayden-adams', id: 1, name: 'Hayden Adams', height: "5'11\"", classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Lexington, Ky.', highSchool: 'Sayre School' })}
${makeSidearmPlayer({ slug: 'arjun-caprihan', id: 2, name: 'Arjun Caprihan', height: "5'9\"", classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Short Hills, N.J.', highSchool: 'Newark Academy' })}
${makeSidearmPlayer({ slug: 'ryan-chang', id: 3, name: 'Ryan Chang', height: "6'1\"", classAbbr: 'So.', classFull: 'Sophomore', hometown: 'Brookline, Mass.', highSchool: 'Windermere (Fla.) Prep' })}
${makeSidearmPlayer({ slug: 'henry-chen', id: 4, name: 'Henry Chen', height: "5'10\"", classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Hillsborough, Calif.', highSchool: 'Crystal Springs Uplands School' })}
${makeSidearmPlayer({ slug: 'max-fonseca', id: 5, name: 'Max Fonseca', height: "6'3\"", classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Miami, Fla.', highSchool: 'Christopher Columbus' })}
${makeSidearmPlayer({ slug: 'owen-hayes', id: 6, name: 'Owen Hayes', height: "5'7\"", classAbbr: 'Sr.', classFull: 'Senior', hometown: 'Bedford Hills, N.Y.', highSchool: 'Brunswick School' })}
${makeSidearmPlayer({ slug: 'wesley-hu', id: 7, name: 'Wesley Hu', height: "6'2\"", classAbbr: 'So.', classFull: 'Sophomore', hometown: 'Suwanee, Ga.', highSchool: 'Lambert' })}
${makeSidearmPlayer({ slug: 'kayden-wang', id: 8, name: 'Kayden Wang', height: "5'8\"", classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'San Diego, Calif.', highSchool: "The Bishop's School" })}
</ul>
</section>
</body>
</html>`

/**
 * Real Sidearm HTML structure for 2003-04 Penn Men's Golf roster.
 * 7 players WITHOUT heights, WITHOUT jersey numbers.
 *
 * Expected players (7):
 *   Sean Barrett    – Freshman  – Palisades Park, Calif. – Loyola
 *   Patrick Cooper  – Freshman  – Everett, Wash.          – Lakeside
 *   Brandon Mourges – Freshman  – (no hometown / school)
 *   Larry Nickell   – Junior    – Dallas, Texas            – Van Alstyne (Austin College)
 *   Jeff Riley      – Junior    – Waterford, Conn.         – Waterford
 *   Derek Rogers    – Sophomore – Houston, Texas           – Memorial
 *   Scott Squires   – Sophomore – (no hometown)            – J.P. Taravella
 */
const FIXTURE_2003_HTML = `<!DOCTYPE html>
<html>
<head><title>Penn Golf - 2003-04 Roster</title></head>
<body>
<h1>Men's Golf 2003-04 Roster</h1>
<section aria-label="Men's Player Roster">
<ul class="sidearm-roster-players">
${makeSidearmPlayer({ slug: 'sean-barrett', id: 101, name: 'Sean Barrett', classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Palisades Park, Calif.', highSchool: 'Loyola' })}
${makeSidearmPlayer({ slug: 'patrick-cooper', id: 102, name: 'Patrick Cooper', classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Everett, Wash.', highSchool: 'Lakeside' })}
${makeSidearmPlayer({ slug: 'brandon-mourges', id: 103, name: 'Brandon Mourges', classAbbr: 'Fr.', classFull: 'Freshman' })}
${makeSidearmPlayer({ slug: 'larry-nickell', id: 104, name: 'Larry Nickell', classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Dallas, Texas', highSchool: 'Van Alstyne (Austin College)' })}
${makeSidearmPlayer({ slug: 'jeff-riley', id: 105, name: 'Jeff Riley', classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Waterford, Conn.', highSchool: 'Waterford' })}
${makeSidearmPlayer({ slug: 'derek-rogers', id: 106, name: 'Derek Rogers', classAbbr: 'So.', classFull: 'Sophomore', hometown: 'Houston, Texas', highSchool: 'Memorial' })}
${makeSidearmPlayer({ slug: 'scott-squires', id: 107, name: 'Scott Squires', classAbbr: 'So.', classFull: 'Sophomore', highSchool: 'J.P. Taravella' })}
</ul>
</section>
</body>
</html>`

// ── Test runner ───────────────────────────────────────────────────────────────

interface Assertion {
  label: string
  pass: boolean
  detail?: string
}

function assert(label: string, condition: boolean, detail?: string): Assertion {
  return { label, pass: condition, detail }
}

function byName(entries: RosterEntryPreview[], name: string): RosterEntryPreview | undefined {
  return entries.find(e => e.fullName.toLowerCase() === name.toLowerCase())
}

function runFixture(
  label: string,
  html: string,
  sourceUrl: string,
  checks: (entries: RosterEntryPreview[]) => Assertion[],
): { label: string; passed: number; failed: number; results: Assertion[] } {
  const { entries, warnings } = extractRoster(html, sourceUrl)
  const results = checks(entries)

  if (warnings.length > 0) {
    console.log(`  Warnings: ${warnings.join('; ')}`)
  }

  const passed = results.filter(r => r.pass).length
  const failed = results.filter(r => !r.pass).length

  return { label, passed, failed, results }
}

// ── Fixture 1: 2025-26 modern Sidearm ────────────────────────────────────────

const fixture2025 = runFixture(
  '2025-26 Penn Men\'s Golf (modern Sidearm)',
  FIXTURE_2025_HTML,
  'https://pennathletics.com/sports/mens-golf/roster',
  (entries) => [
    assert('extracts exactly 8 players', entries.length === 8,
      `got ${entries.length}`),

    // Names
    assert('finds Hayden Adams',   !!byName(entries, 'Hayden Adams')),
    assert('finds Arjun Caprihan', !!byName(entries, 'Arjun Caprihan')),
    assert('finds Ryan Chang',     !!byName(entries, 'Ryan Chang')),
    assert('finds Henry Chen',     !!byName(entries, 'Henry Chen')),
    assert('finds Max Fonseca',    !!byName(entries, 'Max Fonseca')),
    assert('finds Owen Hayes',     !!byName(entries, 'Owen Hayes')),
    assert('finds Wesley Hu',      !!byName(entries, 'Wesley Hu')),
    assert('finds Kayden Wang',    !!byName(entries, 'Kayden Wang')),

    // Class labels (full words from desktop span)
    assert('Hayden Adams is Junior',
      byName(entries, 'Hayden Adams')?.classLabel?.toLowerCase() === 'junior'),
    assert('Arjun Caprihan is Freshman',
      byName(entries, 'Arjun Caprihan')?.classLabel?.toLowerCase() === 'freshman'),
    assert('Ryan Chang is Sophomore',
      byName(entries, 'Ryan Chang')?.classLabel?.toLowerCase() === 'sophomore'),
    assert('Owen Hayes is Senior',
      byName(entries, 'Owen Hayes')?.classLabel?.toLowerCase() === 'senior'),

    // Hometowns
    assert('Hayden Adams hometown = Lexington, Ky.',
      byName(entries, 'Hayden Adams')?.hometown === 'Lexington, Ky.',
      `got: ${byName(entries, 'Hayden Adams')?.hometown}`),
    assert('Ryan Chang hometown = Brookline, Mass.',
      byName(entries, 'Ryan Chang')?.hometown === 'Brookline, Mass.',
      `got: ${byName(entries, 'Ryan Chang')?.hometown}`),
    assert('Henry Chen hometown = Hillsborough, Calif.',
      byName(entries, 'Henry Chen')?.hometown === 'Hillsborough, Calif.',
      `got: ${byName(entries, 'Henry Chen')?.hometown}`),
    assert('Arjun Caprihan hometown = Short Hills, N.J.',
      byName(entries, 'Arjun Caprihan')?.hometown === 'Short Hills, N.J.',
      `got: ${byName(entries, 'Arjun Caprihan')?.hometown}`),

    // High schools (including parentheses preservation)
    assert('Ryan Chang school = Windermere (Fla.) Prep',
      byName(entries, 'Ryan Chang')?.highSchool === 'Windermere (Fla.) Prep',
      `got: ${byName(entries, 'Ryan Chang')?.highSchool}`),
    assert('Henry Chen school = Crystal Springs Uplands School',
      byName(entries, 'Henry Chen')?.highSchool === 'Crystal Springs Uplands School',
      `got: ${byName(entries, 'Henry Chen')?.highSchool}`),
    assert("Kayden Wang school = The Bishop's School",
      byName(entries, 'Kayden Wang')?.highSchool === "The Bishop's School",
      `got: ${byName(entries, 'Kayden Wang')?.highSchool}`),

    // Confidence
    assert('all entries have extractionConfidence >= 0.7',
      entries.every(e => e.extractionConfidence >= 0.7),
      `min: ${Math.min(...entries.map(e => e.extractionConfidence))}`),
  ],
)

// ── Fixture 2: 2003-04 historical format ─────────────────────────────────────

const fixture2003 = runFixture(
  '2003-04 Penn Men\'s Golf (historical)',
  FIXTURE_2003_HTML,
  'https://pennathletics.com/sports/mens-golf/roster/2003-04',
  (entries) => [
    assert('extracts exactly 7 players', entries.length === 7,
      `got ${entries.length}`),

    // Names
    assert('finds Sean Barrett',    !!byName(entries, 'Sean Barrett')),
    assert('finds Patrick Cooper',  !!byName(entries, 'Patrick Cooper')),
    assert('finds Brandon Mourges', !!byName(entries, 'Brandon Mourges')),
    assert('finds Larry Nickell',   !!byName(entries, 'Larry Nickell')),
    assert('finds Jeff Riley',      !!byName(entries, 'Jeff Riley')),
    assert('finds Derek Rogers',    !!byName(entries, 'Derek Rogers')),
    assert('finds Scott Squires',   !!byName(entries, 'Scott Squires')),

    // Class labels (full words from desktop span)
    assert('Sean Barrett is Freshman',
      byName(entries, 'Sean Barrett')?.classLabel?.toLowerCase() === 'freshman'),
    assert('Larry Nickell is Junior',
      byName(entries, 'Larry Nickell')?.classLabel?.toLowerCase() === 'junior'),
    assert('Derek Rogers is Sophomore',
      byName(entries, 'Derek Rogers')?.classLabel?.toLowerCase() === 'sophomore'),
    assert('Brandon Mourges is Freshman',
      byName(entries, 'Brandon Mourges')?.classLabel?.toLowerCase() === 'freshman'),

    // Hometowns
    assert('Sean Barrett hometown = Palisades Park, Calif.',
      byName(entries, 'Sean Barrett')?.hometown === 'Palisades Park, Calif.',
      `got: ${byName(entries, 'Sean Barrett')?.hometown}`),
    assert('Larry Nickell hometown = Dallas, Texas',
      byName(entries, 'Larry Nickell')?.hometown === 'Dallas, Texas',
      `got: ${byName(entries, 'Larry Nickell')?.hometown}`),
    assert('Jeff Riley hometown = Waterford, Conn.',
      byName(entries, 'Jeff Riley')?.hometown === 'Waterford, Conn.',
      `got: ${byName(entries, 'Jeff Riley')?.hometown}`),

    // High schools (including parentheses)
    assert('Larry Nickell school = Van Alstyne (Austin College)',
      byName(entries, 'Larry Nickell')?.highSchool === 'Van Alstyne (Austin College)',
      `got: ${byName(entries, 'Larry Nickell')?.highSchool}`),
    assert('Jeff Riley school = Waterford',
      byName(entries, 'Jeff Riley')?.highSchool === 'Waterford',
      `got: ${byName(entries, 'Jeff Riley')?.highSchool}`),

    // Missing data — should be undefined, not hallucinated
    assert('Brandon Mourges hometown is undefined',
      byName(entries, 'Brandon Mourges')?.hometown === undefined,
      `got: ${byName(entries, 'Brandon Mourges')?.hometown}`),
    assert('Brandon Mourges highSchool is undefined',
      byName(entries, 'Brandon Mourges')?.highSchool === undefined,
      `got: ${byName(entries, 'Brandon Mourges')?.highSchool}`),

    // Scott Squires: no hometown, has high school
    assert('Scott Squires has no hometown',
      byName(entries, 'Scott Squires')?.hometown === undefined,
      `got: ${byName(entries, 'Scott Squires')?.hometown}`),
    assert('Scott Squires school = J.P. Taravella',
      byName(entries, 'Scott Squires')?.highSchool === 'J.P. Taravella',
      `got: ${byName(entries, 'Scott Squires')?.highSchool}`),
  ],
)

// ── Output ────────────────────────────────────────────────────────────────────

const fixtures = [fixture2025, fixture2003]
let totalPassed = 0
let totalFailed = 0

for (const f of fixtures) {
  console.log(`\n── ${f.label} ──`)
  for (const r of f.results) {
    const icon = r.pass ? '  ✓' : '  ✗'
    const detail = !r.pass && r.detail ? ` (${r.detail})` : ''
    console.log(`${icon}  ${r.label}${detail}`)
  }
  console.log(`   ${f.passed} passed, ${f.failed} failed`)
  totalPassed += f.passed
  totalFailed += f.failed
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`)

if (totalFailed > 0) {
  process.exit(1)
} else {
  console.log('All fixture tests passed.')
}
