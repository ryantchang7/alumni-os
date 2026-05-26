/**
 * Integration test for the enrichment pipeline.
 * Tests: create team → promote entries → upsert enrichment → add source → dedup sourceUrls.
 *
 * Run: npm run test:enrichment
 */

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  getPeopleForTeam,
  getPersonEnrichment,
  upsertPersonEnrichment,
  getEnrichmentSourcesForPerson,
  addEnrichmentSource,
  deleteEnrichmentSource,
} from '../src/lib/store/local-store'
import type { Store } from '../src/lib/store/types'

// ── Empty store with all arrays ──────────────────────────────────────────────

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
  console.log('── Enrichment Pipeline Integration Test ──\n')
  console.log('WARNING: This test resets data/alumni-os.json. Run store:reset afterwards to restore a clean empty store.\n')

  const results: AssertResult[] = []

  // 1. Reset store
  await writeStore(EMPTY_STORE)

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

  // 3. Save two extracted entries
  const now = new Date().toISOString()
  const savedEntries = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-test',
      crawledPageId: 'page-test',
      teamId: team.id,
      fullName: 'Ryan Chang',
      classLabel: 'Sophomore',
      hometown: 'Brookline, Mass.',
      highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang',
      sourceUrl: 'https://pennathletics.com/roster/2025-26',
      seasonYear: '2025-26',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: now,
    },
    {
      scrapeRunId: 'run-test',
      crawledPageId: 'page-test',
      teamId: team.id,
      fullName: 'Hayden Adams',
      classLabel: 'Junior',
      hometown: 'Lexington, Ky.',
      highSchool: 'Sayre School',
      bioUrl: 'https://pennathletics.com/roster/hayden-adams',
      sourceUrl: 'https://pennathletics.com/roster/2025-26',
      seasonYear: '2025-26',
      extractionConfidence: 0.9,
      status: 'extracted',
      createdAt: now,
    },
  ])

  // 4. Promote both entries
  const promotionResult = await promoteRosterEntries(
    team.id,
    savedEntries.map(e => e.id),
  )
  const people = await getPeopleForTeam(team.id)
  const ryan = people.find(p => p.canonicalName === 'Ryan Chang')
  const hayden = people.find(p => p.canonicalName === 'Hayden Adams')

  results.push(
    assert('2 people promoted', people.length === 2, `got ${people.length}`),
    assert('Ryan Chang exists', ryan !== undefined),
    assert('Hayden Adams exists', hayden !== undefined),
    assert('promotedCount = 2', promotionResult.promotedCount === 2, `got ${promotionResult.promotedCount}`),
  )

  if (!ryan || !hayden) {
    printResults(results)
    process.exit(1)
  }

  // 5. Assert no enrichment initially
  const ryanEnrichmentBefore = await getPersonEnrichment(ryan.id, team.id)
  const haydenEnrichmentBefore = await getPersonEnrichment(hayden.id, team.id)

  results.push(
    assert('Ryan has no enrichment initially', ryanEnrichmentBefore === undefined),
    assert('Hayden has no enrichment initially', haydenEnrichmentBefore === undefined),
  )

  // 6. Upsert Ryan enrichment
  const ryanEnrichment = await upsertPersonEnrichment({
    personId: ryan.id,
    teamId: team.id,
    currentRole: 'Student Athlete',
    currentCompany: 'University of Pennsylvania',
    city: 'Philadelphia',
    state: 'PA',
    country: 'USA',
    relationshipStatus: 'identified',
    verificationStatus: 'manually_verified',
    sourceUrls: ['https://pennathletics.com/sports/mens-golf/roster'],
  })

  results.push(
    assert('Upsert returns enrichment', ryanEnrichment !== undefined),
    assert('Ryan enrichment has currentRole', ryanEnrichment.currentRole === 'Student Athlete'),
    assert('Ryan enrichment has currentCompany', ryanEnrichment.currentCompany === 'University of Pennsylvania'),
    assert('Ryan enrichment has city', ryanEnrichment.city === 'Philadelphia'),
    assert('Ryan enrichment has state', ryanEnrichment.state === 'PA'),
    assert('Ryan enrichment has relationshipStatus=identified', ryanEnrichment.relationshipStatus === 'identified'),
    assert('Ryan enrichment has verificationStatus=manually_verified', ryanEnrichment.verificationStatus === 'manually_verified'),
    assert('Ryan enrichment has 1 sourceUrl', ryanEnrichment.sourceUrls.length === 1),
    assert('Ryan enrichment has personId', ryanEnrichment.personId === ryan.id),
    assert('Ryan enrichment has teamId', ryanEnrichment.teamId === team.id),
    assert('Ryan enrichment has id', typeof ryanEnrichment.id === 'string' && ryanEnrichment.id.length > 0),
    assert('Ryan enrichment has createdAt', typeof ryanEnrichment.createdAt === 'string'),
    assert('Ryan enrichment has updatedAt', typeof ryanEnrichment.updatedAt === 'string'),
  )

  // 7. Verify getPersonEnrichment returns it
  const ryanEnrichmentFetched = await getPersonEnrichment(ryan.id, team.id)
  results.push(
    assert('getPersonEnrichment returns Ryan enrichment', ryanEnrichmentFetched !== undefined),
    assert('Hayden still has no enrichment', (await getPersonEnrichment(hayden.id, team.id)) === undefined),
  )

  // 8. Add enrichment source
  const source = await addEnrichmentSource({
    personId: ryan.id,
    teamId: team.id,
    url: 'https://pennathletics.com/sports/mens-golf/roster',
    title: 'Penn Athletics Roster 2025-26',
    sourceType: 'team_roster',
    notes: 'Current season roster page',
  })

  const sourcesAfterAdd = await getEnrichmentSourcesForPerson(ryan.id, team.id)

  results.push(
    assert('Source added with correct url', source.url === 'https://pennathletics.com/sports/mens-golf/roster'),
    assert('Source has correct sourceType', source.sourceType === 'team_roster'),
    assert('Source has id', typeof source.id === 'string' && source.id.length > 0),
    assert('Source has createdAt', typeof source.createdAt === 'string'),
    assert('getEnrichmentSourcesForPerson returns 1 source', sourcesAfterAdd.length === 1),
    assert('Source title matches', sourcesAfterAdd[0].title === 'Penn Athletics Roster 2025-26'),
  )

  // 9. Upsert Ryan again with new note and SAME source URL — assert no duplicate sourceUrls
  const ryanEnrichmentUpdated = await upsertPersonEnrichment({
    personId: ryan.id,
    teamId: team.id,
    notes: 'Met at Penn Golf event',
    relationshipStatus: 'met',
    sourceUrls: ['https://pennathletics.com/sports/mens-golf/roster'], // same URL as before
  })

  results.push(
    assert('Updated note persists', ryanEnrichmentUpdated.notes === 'Met at Penn Golf event'),
    assert('Updated relationshipStatus persists', ryanEnrichmentUpdated.relationshipStatus === 'met'),
    assert(
      'sourceUrls deduped after re-upsert (still 1)',
      ryanEnrichmentUpdated.sourceUrls.length === 1,
      `got ${ryanEnrichmentUpdated.sourceUrls.length}`,
    ),
    assert('Original fields still preserved', ryanEnrichmentUpdated.currentRole === 'Student Athlete'),
    assert('verificationStatus preserved', ryanEnrichmentUpdated.verificationStatus === 'manually_verified'),
  )

  // 10. Add a second different source URL via upsert
  const ryanEnrichmentWith2 = await upsertPersonEnrichment({
    personId: ryan.id,
    teamId: team.id,
    sourceUrls: ['https://www.linkedin.com/in/ryan-chang-example'],
  })

  results.push(
    assert(
      'Two distinct sourceUrls after adding new one',
      ryanEnrichmentWith2.sourceUrls.length === 2,
      `got ${ryanEnrichmentWith2.sourceUrls.length}`,
    ),
  )

  // 11. Delete the enrichment source
  const deleted = await deleteEnrichmentSource(source.id)
  const sourcesAfterDelete = await getEnrichmentSourcesForPerson(ryan.id, team.id)

  results.push(
    assert('deleteEnrichmentSource returns true', deleted === true),
    assert('getEnrichmentSourcesForPerson returns 0 after delete', sourcesAfterDelete.length === 0),
  )

  // 12. Delete non-existent source
  const deletedFake = await deleteEnrichmentSource('non-existent-id')
  results.push(
    assert('deleteEnrichmentSource non-existent returns false', deletedFake === false),
  )

  // 13. Verify enrichmentStatus classification logic (mirrors what API route will do)
  const enrichmentForRyan = await getPersonEnrichment(ryan.id, team.id)
  const enrichmentForHayden = await getPersonEnrichment(hayden.id, team.id)

  function classifyEnrichmentStatus(
    enrichment: Awaited<ReturnType<typeof getPersonEnrichment>>,
  ): 'none' | 'partial' | 'source_backed' | 'verified' {
    if (!enrichment) return 'none'
    if (enrichment.verificationStatus === 'manually_verified') return 'verified'
    if (enrichment.verificationStatus === 'source_backed') return 'source_backed'
    return 'partial'
  }

  results.push(
    assert(
      'Ryan enrichmentStatus = verified (manually_verified)',
      classifyEnrichmentStatus(enrichmentForRyan) === 'verified',
    ),
    assert(
      'Hayden enrichmentStatus = none (no enrichment)',
      classifyEnrichmentStatus(enrichmentForHayden) === 'none',
    ),
  )

  // ── Print results ────────────────────────────────────────────────────────────
  printResults(results)
})()

function printResults(results: { label: string; pass: boolean; detail?: string }[]) {
  let passed = 0
  let failed = 0

  console.log('')
  for (const r of results) {
    const icon = r.pass ? '  ✓' : '  ✗'
    const detail = !r.pass && r.detail ? ` (${r.detail})` : ''
    console.log(`${icon}  ${r.label}${detail}`)
    if (r.pass) passed++
    else failed++
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Total: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('All enrichment pipeline tests passed.')
  }
}
