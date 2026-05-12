/**
 * Live integration tests — fetches actual Penn Athletics roster pages and
 * asserts that extraction produces expected results.
 *
 * Run:  npm run test:live-rosters
 *
 * NOTE: Requires network access. Do not run in CI without caching.
 */

import { extractRoster } from '../src/lib/scraping/extract-roster'
import type { RosterEntryPreview } from '../src/lib/scraping/types'

// ── Fetch ─────────────────────────────────────────────────────────────────────

const FETCH_OPTS = {
  headers: { 'User-Agent': 'AlumniOSPreviewBot/0.1 (+public discovery preview; no persistence)' },
  signal: AbortSignal.timeout(15000),
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, FETCH_OPTS)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.text()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize abbreviated or full class labels to lowercase full word.
 * Maps 'Jr.' → 'junior', 'So.' → 'sophomore', 'Fr.' → 'freshman', 'Sr.' → 'senior'.
 */
function classNorm(label: string | undefined): string | undefined {
  if (!label) return undefined
  const abbrevMap: Record<string, string> = {
    'jr.': 'junior',
    'so.': 'sophomore',
    'fr.': 'freshman',
    'sr.': 'senior',
    'fy.': 'freshman',
  }
  const lower = label.toLowerCase().trim()
  return abbrevMap[lower] ?? lower
}

function byName(entries: RosterEntryPreview[], name: string): RosterEntryPreview | undefined {
  return entries.find(e => e.fullName.toLowerCase() === name.toLowerCase())
}

// ── Test runner ───────────────────────────────────────────────────────────────

interface Assertion {
  label: string
  pass: boolean
  detail?: string
}

function assert(label: string, condition: boolean, detail?: string): Assertion {
  return { label, pass: condition, detail }
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const URL_2025 = 'https://pennathletics.com/sports/mens-golf/roster'
  const URL_2003 = 'https://pennathletics.com/sports/mens-golf/roster/2003-04'

  console.log('Fetching live Penn Athletics roster pages...')

  let html2025: string
  let html2003: string

  try {
    html2025 = await fetchHtml(URL_2025)
    console.log(`  Fetched 2025-26 (${html2025.length} bytes)`)
  } catch (err) {
    console.error(`  FAILED to fetch 2025-26: ${err}`)
    process.exit(1)
  }

  try {
    html2003 = await fetchHtml(URL_2003)
    console.log(`  Fetched 2003-04 (${html2003.length} bytes)`)
  } catch (err) {
    console.error(`  FAILED to fetch 2003-04: ${err}`)
    process.exit(1)
  }

  // ── 2025-26 current roster ────────────────────────────────────────────────

  const fixture2025 = runFixture(
    '2025-26 Penn Men\'s Golf (live)',
    html2025,
    URL_2025,
    (entries) => [
      assert('extracts exactly 8 entries', entries.length === 8,
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

      // Ryan Chang details
      assert('Ryan Chang classLabel = Sophomore',
        classNorm(byName(entries, 'Ryan Chang')?.classLabel) === 'sophomore',
        `got: ${byName(entries, 'Ryan Chang')?.classLabel}`),
      assert('Ryan Chang hometown = Brookline, Mass.',
        byName(entries, 'Ryan Chang')?.hometown === 'Brookline, Mass.',
        `got: ${byName(entries, 'Ryan Chang')?.hometown}`),
      assert('Ryan Chang highSchool = Windermere (Fla.) Prep',
        byName(entries, 'Ryan Chang')?.highSchool === 'Windermere (Fla.) Prep',
        `got: ${byName(entries, 'Ryan Chang')?.highSchool}`),

      // Hayden Adams details
      assert('Hayden Adams classLabel = Junior',
        classNorm(byName(entries, 'Hayden Adams')?.classLabel) === 'junior',
        `got: ${byName(entries, 'Hayden Adams')?.classLabel}`),
      assert('Hayden Adams hometown = Lexington, Ky.',
        byName(entries, 'Hayden Adams')?.hometown === 'Lexington, Ky.',
        `got: ${byName(entries, 'Hayden Adams')?.hometown}`),
      assert('Hayden Adams highSchool = Sayre School',
        byName(entries, 'Hayden Adams')?.highSchool === 'Sayre School',
        `got: ${byName(entries, 'Hayden Adams')?.highSchool}`),
    ],
  )

  // ── 2003-04 historical roster ─────────────────────────────────────────────

  const fixture2003 = runFixture(
    '2003-04 Penn Men\'s Golf (live)',
    html2003,
    URL_2003,
    (entries) => [
      assert('extracts exactly 7 entries', entries.length === 7,
        `got ${entries.length}`),

      // Names
      assert('finds Sean Barrett',    !!byName(entries, 'Sean Barrett')),
      assert('finds Patrick Cooper',  !!byName(entries, 'Patrick Cooper')),
      assert('finds Brandon Mourges', !!byName(entries, 'Brandon Mourges')),
      assert('finds Larry Nickell',   !!byName(entries, 'Larry Nickell')),
      assert('finds Jeff Riley',      !!byName(entries, 'Jeff Riley')),
      assert('finds Derek Rogers',    !!byName(entries, 'Derek Rogers')),
      assert('finds Scott Squires',   !!byName(entries, 'Scott Squires')),

      // Sean Barrett details
      assert('Sean Barrett classNorm = freshman',
        classNorm(byName(entries, 'Sean Barrett')?.classLabel) === 'freshman',
        `got: ${byName(entries, 'Sean Barrett')?.classLabel}`),
      assert('Sean Barrett hometown = Palisades Park, Calif.',
        byName(entries, 'Sean Barrett')?.hometown === 'Palisades Park, Calif.',
        `got: ${byName(entries, 'Sean Barrett')?.hometown}`),
      assert('Sean Barrett highSchool = Loyola',
        byName(entries, 'Sean Barrett')?.highSchool === 'Loyola',
        `got: ${byName(entries, 'Sean Barrett')?.highSchool}`),

      // Larry Nickell details
      assert('Larry Nickell classNorm = junior',
        classNorm(byName(entries, 'Larry Nickell')?.classLabel) === 'junior',
        `got: ${byName(entries, 'Larry Nickell')?.classLabel}`),
      assert('Larry Nickell hometown = Dallas, Texas',
        byName(entries, 'Larry Nickell')?.hometown === 'Dallas, Texas',
        `got: ${byName(entries, 'Larry Nickell')?.hometown}`),
      assert('Larry Nickell highSchool = Van Alstyne (Austin College)',
        byName(entries, 'Larry Nickell')?.highSchool === 'Van Alstyne (Austin College)',
        `got: ${byName(entries, 'Larry Nickell')?.highSchool}`),

      // Scott Squires details
      assert('Scott Squires classNorm = sophomore',
        classNorm(byName(entries, 'Scott Squires')?.classLabel) === 'sophomore',
        `got: ${byName(entries, 'Scott Squires')?.classLabel}`),
      assert('Scott Squires hometown is undefined',
        byName(entries, 'Scott Squires')?.hometown === undefined,
        `got: ${byName(entries, 'Scott Squires')?.hometown}`),
      assert('Scott Squires highSchool = J.P. Taravella',
        byName(entries, 'Scott Squires')?.highSchool === 'J.P. Taravella',
        `got: ${byName(entries, 'Scott Squires')?.highSchool}`),

      // Brandon Mourges missing data
      assert('Brandon Mourges hometown is undefined',
        byName(entries, 'Brandon Mourges')?.hometown === undefined,
        `got: ${byName(entries, 'Brandon Mourges')?.hometown}`),
      assert('Brandon Mourges highSchool is undefined',
        byName(entries, 'Brandon Mourges')?.highSchool === undefined,
        `got: ${byName(entries, 'Brandon Mourges')?.highSchool}`),
    ],
  )

  // ── Output ────────────────────────────────────────────────────────────────

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
    console.log('All live roster tests passed.')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
