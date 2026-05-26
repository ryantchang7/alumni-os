/**
 * Integration test for the promotion pipeline.
 * Tests the full store flow: create team → scrape run → extract → promote.
 * Uses live network if available, falls back to fixture HTML.
 *
 * Run: npm run test:pipeline
 */

import {
  writeStore,
  createTeam,
  createScrapeRun,
  updateScrapeRun,
  saveCrawledPage,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
} from '../src/lib/store/local-store'
import { extractRoster } from '../src/lib/scraping/extract-roster'
import type { Store } from '../src/lib/store/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSidearmPlayer(opts: {
  slug: string
  id: number
  name: string
  classAbbr: string
  classFull: string
  hometown?: string
  highSchool?: string
}): string {
  const { slug, id, name, classAbbr, classFull, hometown, highSchool } = opts
  const href = `/sports/mens-golf/roster/${slug}/${id}`
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
          <div class="sidearm-roster-player-name">
            <h3><a href="${href}" aria-label="${name} - View Full Bio">${name}</a></h3>
          </div>
          <div class="sidearm-roster-player-other hide-on-large">
            <div class="sidearm-roster-player-class-hometown">
              <span class="sidearm-roster-player-academic-year hide-on-large">${classAbbr}</span>
              ${hometownSpan}
              ${highSchoolSpan}
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

const FIXTURE_HTML = `<!DOCTYPE html>
<html>
<head><title>Penn Golf - 2025-26 Roster</title></head>
<body>
<h1>Men's Golf 2025-26 Roster</h1>
<section aria-label="Men's Player Roster">
<ul class="sidearm-roster-players">
${makeSidearmPlayer({ slug: 'hayden-adams', id: 1, name: 'Hayden Adams', classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Lexington, Ky.', highSchool: 'Sayre School' })}
${makeSidearmPlayer({ slug: 'arjun-caprihan', id: 2, name: 'Arjun Caprihan', classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Short Hills, N.J.', highSchool: 'Newark Academy' })}
${makeSidearmPlayer({ slug: 'ryan-chang', id: 3, name: 'Ryan Chang', classAbbr: 'So.', classFull: 'Sophomore', hometown: 'Brookline, Mass.', highSchool: 'Windermere (Fla.) Prep' })}
${makeSidearmPlayer({ slug: 'henry-chen', id: 4, name: 'Henry Chen', classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'Hillsborough, Calif.', highSchool: 'Crystal Springs Uplands School' })}
${makeSidearmPlayer({ slug: 'max-fonseca', id: 5, name: 'Max Fonseca', classAbbr: 'Jr.', classFull: 'Junior', hometown: 'Miami, Fla.', highSchool: 'Christopher Columbus' })}
${makeSidearmPlayer({ slug: 'owen-hayes', id: 6, name: 'Owen Hayes', classAbbr: 'Sr.', classFull: 'Senior', hometown: 'Bedford Hills, N.Y.', highSchool: 'Brunswick School' })}
${makeSidearmPlayer({ slug: 'wesley-hu', id: 7, name: 'Wesley Hu', classAbbr: 'So.', classFull: 'Sophomore', hometown: 'Suwanee, Ga.', highSchool: 'Lambert' })}
${makeSidearmPlayer({ slug: 'kayden-wang', id: 8, name: 'Kayden Wang', classAbbr: 'Fr.', classFull: 'Freshman', hometown: 'San Diego, Calif.', highSchool: "The Bishop's School" })}
</ul>
</section>
</body>
</html>`

const EMPTY_STORE: Store = {
  teams: [],
  scrapeRuns: [],
  crawledPages: [],
  extractedRosterEntries: [],
  people: [],
  teamMemberships: [],
  reviewItems: [],
  historicalImportRuns: [],
  historicalSeasonResults: [],
  personEnrichments: [],
  enrichmentSources: [],
}

// ── Assertions ────────────────────────────────────────────────────────────────

interface AssertResult {
  label: string
  pass: boolean
  detail?: string
}

function assert(label: string, pass: boolean, detail?: string): AssertResult {
  return { label, pass, detail }
}

// ── Main ──────────────────────────────────────────────────────────────────────

void (async () => {
  console.log('── Promotion Pipeline Integration Test ──\n')

  // 1. Reset store
  await writeStore(EMPTY_STORE)
  console.log('Store reset to empty.')

  // 2. Create team
  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })
  console.log('Team created:', team.slug)

  // 3. Create scrape run
  const run = await createScrapeRun({
    teamId: team.id,
    seedUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    status: 'running',
    startedAt: new Date().toISOString(),
    logs: [],
  })

  // 4. Try live network, fall back to fixture
  const LIVE_URL = 'https://pennathletics.com/sports/mens-golf/roster'
  let html = ''
  const sourceUrl = LIVE_URL
  let usedFixture = false

  try {
    console.log('Attempting live fetch…')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(LIVE_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AlumniOS-TestBot/0.1' },
    })
    clearTimeout(timeout)
    if (res.ok) {
      html = await res.text()
      console.log(`Live fetch succeeded: HTTP ${res.status}, ${html.length} bytes`)
    } else {
      throw new Error(`HTTP ${res.status}`)
    }
  } catch (err) {
    console.log(`Live fetch failed (${err instanceof Error ? err.message : err}), using fixture.`)
    html = FIXTURE_HTML
    usedFixture = true
  }

  // 5. Extract entries
  const { entries: rawEntries, warnings } = extractRoster(html, sourceUrl)
  console.log(`Extracted ${rawEntries.length} entries. Warnings: ${warnings.length}`)
  if (warnings.length) warnings.forEach(w => console.log(' !', w))

  // 6. Save crawled page and extracted entries
  const page = await saveCrawledPage({
    scrapeRunId: run.id,
    teamId: team.id,
    url: LIVE_URL,
    title: 'Penn Golf 2025-26 Roster',
    status: 200,
    pageType: 'current_roster',
    fetchedAt: new Date().toISOString(),
    htmlPreview: html.slice(0, 2000),
    warnings,
  })

  const savedEntries = await saveExtractedRosterEntries(
    rawEntries.map(e => ({
      scrapeRunId: run.id,
      crawledPageId: page.id,
      teamId: team.id,
      fullName: e.fullName,
      classLabel: e.classLabel,
      hometown: e.hometown,
      highSchool: e.highSchool,
      bioUrl: e.bioUrl,
      sourceUrl: e.sourceUrl,
      seasonYear: '2025-26',
      rawText: e.rawText,
      extractionConfidence: e.extractionConfidence,
      status: 'extracted' as const,
      createdAt: new Date().toISOString(),
    })),
  )

  await updateScrapeRun(run.id, {
    status: 'complete',
    finishedAt: new Date().toISOString(),
    summary: `Extracted ${savedEntries.length} entries`,
    logs: warnings,
  })

  // 7. Promote entries with confidence >= 0.8
  const toPromoteIds = savedEntries
    .filter(e => e.extractionConfidence >= 0.8)
    .map(e => e.id)

  console.log(`Promoting ${toPromoteIds.length} high-confidence entries…`)
  const promotionResult = await promoteRosterEntries(team.id, toPromoteIds)
  console.log('Promotion result:', promotionResult)

  // 8. Assertions
  const people = await getPeopleForTeam(team.id)
  const memberships = await getTeamMembershipsForTeam(team.id)

  const ryanPeople = people.filter(
    p => p.normalizedName === 'ryan chang' || p.canonicalName.toLowerCase().includes('ryan chang'),
  )
  const ryanMembership = memberships.find(m => ryanPeople.some(p => p.id === m.personId))

  const results: AssertResult[] = []

  results.push(
    assert('8 people promoted for team', people.length === 8, `got ${people.length}`),
    assert('Ryan Chang exists in people', ryanPeople.length >= 1, `found ${ryanPeople.length}`),
    assert(
      'No duplicate Ryan Chang',
      ryanPeople.length === 1,
      `found ${ryanPeople.length} people with that name`,
    ),
    assert(
      'Ryan Chang has hometown Brookline, Mass.',
      ryanMembership?.hometown === 'Brookline, Mass.',
      `got: ${ryanMembership?.hometown}`,
    ),
    assert(
      'Ryan Chang has highSchool containing Windermere',
      (ryanMembership?.highSchool ?? '').includes('Windermere'),
      `got: ${ryanMembership?.highSchool}`,
    ),
    assert(
      'promotedCount equals toPromoteIds.length',
      promotionResult.promotedCount === toPromoteIds.length,
      `got ${promotionResult.promotedCount}, expected ${toPromoteIds.length}`,
    ),
    assert(
      'peopleCreated equals people.length (all new)',
      promotionResult.peopleCreated === people.length,
      `created ${promotionResult.peopleCreated}, total ${people.length}`,
    ),
  )

  // ── Print results ────────────────────────────────────────────────────────────

  let passed = 0
  let failed = 0
  for (const r of results) {
    const icon = r.pass ? '  ✓' : '  ✗'
    const detail = !r.pass && r.detail ? ` (${r.detail})` : ''
    console.log(`${icon}  ${r.label}${detail}`)
    if (r.pass) passed++
    else failed++
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Total: ${passed} passed, ${failed} failed`)
  if (usedFixture) console.log('(used fixture HTML — network was unavailable)')

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('All pipeline tests passed.')
  }
})()
