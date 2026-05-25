/**
 * Validates store-layer behavior for all hardened API routes.
 * Tests: teamSlug lookup, entryId rejection, source ownership enforcement.
 *
 * Run: npm run test:api-validation
 */

import {
  writeStore,
  createTeam,
  getTeamBySlug,
  saveExtractedRosterEntries,
  rejectRosterEntries,
  addEnrichmentSource,
  deleteEnrichmentSource,
  readStore,
} from '../src/lib/store/local-store'
import type { Store } from '../src/lib/store/types'

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

interface TestResult {
  name: string
  passed: boolean
  detail?: string
}

const results: TestResult[] = []

function pass(name: string) {
  results.push({ name, passed: true })
  console.log(`  ✓  ${name}`)
}

function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail })
  console.log(`  ✗  ${name}`)
  console.log(`     ${detail}`)
}

function assert(condition: boolean, name: string, failMsg: string) {
  if (condition) pass(name)
  else fail(name, failMsg)
}

async function run() {
  console.log('── API Validation Test ──\n')
  await writeStore(EMPTY_STORE)

  // ── Fixture setup ──────────────────────────────────────────────────────────
  const teamA = await createTeam({
    name: 'Penn Men\'s Golf',
    slug: 'penn-mens-golf',
    sport: 'Golf',
    gender: 'Men',
    division: 'Division I',
    conference: 'Ivy League',
    school: 'University of Pennsylvania',
    rosterUrl: 'https://pennathletics.com/sports/mens-golf/roster',
  })

  const teamB = await createTeam({
    name: 'Penn Women\'s Tennis',
    slug: 'penn-womens-tennis',
    sport: 'Tennis',
    gender: 'Women',
    division: 'Division I',
    conference: 'Ivy League',
    school: 'University of Pennsylvania',
    rosterUrl: 'https://pennathletics.com/sports/womens-tennis/roster',
  })

  // ── 1. getTeamBySlug: unknown slug → undefined ─────────────────────────────
  const missing = await getTeamBySlug('not-a-real-team')
  assert(missing === undefined, 'getTeamBySlug: unknown slug returns undefined', `Expected undefined, got ${JSON.stringify(missing)}`)

  // ── 2. getTeamBySlug: valid slug → correct team ────────────────────────────
  const found = await getTeamBySlug('penn-mens-golf')
  assert(found?.id === teamA.id, 'getTeamBySlug: valid slug returns correct team', `Expected team id ${teamA.id}, got ${found?.id}`)

  // ── 3. rejectRosterEntries: non-existent IDs → 0 rejected ─────────────────
  const ghostCount = await rejectRosterEntries(['ghost-id-1', 'ghost-id-2'])
  assert(ghostCount === 0, 'rejectRosterEntries: non-existent IDs returns 0', `Expected 0, got ${ghostCount}`)

  // ── 4. rejectRosterEntries: real IDs → correct count ──────────────────────
  const [entry] = await saveExtractedRosterEntries([{
    teamId: teamA.id,
    fullName: 'Ryan Chang',
    extractionConfidence: 0.95,
    sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    seasonYear: '2025-26',
    status: 'extracted',
  }])
  const rejectedCount = await rejectRosterEntries([entry.id])
  assert(rejectedCount === 1, 'rejectRosterEntries: real entry ID → 1 rejected', `Expected 1, got ${rejectedCount}`)

  // ── 5. deleteEnrichmentSource: non-existent ID → false ────────────────────
  const ghostDelete = await deleteEnrichmentSource('ghost-source-id')
  assert(ghostDelete === false, 'deleteEnrichmentSource: non-existent ID returns false', `Expected false, got ${ghostDelete}`)

  // ── 6. Source ownership: source belongs to teamA, not teamB ───────────────
  const sourceA = await addEnrichmentSource({
    personId: 'person-a',
    teamId: teamA.id,
    url: 'https://example.com/roster',
    sourceType: 'team_roster',
  })

  const store = await readStore()
  const fetchedSource = store.enrichmentSources.find(s => s.id === sourceA.id)
  assert(
    fetchedSource?.teamId === teamA.id,
    'EnrichmentSource: teamId is stamped on creation',
    `Expected teamId ${teamA.id}, got ${fetchedSource?.teamId}`,
  )
  assert(
    fetchedSource?.teamId !== teamB.id,
    'EnrichmentSource: source does NOT belong to teamB',
    'Source teamId should differ from teamB.id',
  )

  // ── 7. deleteEnrichmentSource: real source → deleted ──────────────────────
  const deleted = await deleteEnrichmentSource(sourceA.id)
  assert(deleted === true, 'deleteEnrichmentSource: existing source ID returns true', `Expected true, got ${deleted}`)

  const storeAfter = await readStore()
  const stillPresent = storeAfter.enrichmentSources.find(s => s.id === sourceA.id)
  assert(stillPresent === undefined, 'deleteEnrichmentSource: source is gone from store', `Source still present after deletion`)

  // ── 8. Validate manual_note sourceType does not require url ───────────────
  let manualNoteError: string | null = null
  try {
    const manual = await addEnrichmentSource({
      personId: 'person-b',
      teamId: teamA.id,
      url: '',
      sourceType: 'manual_note',
      notes: 'Confirmed via phone call',
    })
    assert(manual.id.length > 0, 'addEnrichmentSource: manual_note with empty url stores successfully', '')
  } catch (err) {
    manualNoteError = err instanceof Error ? err.message : String(err)
    fail('addEnrichmentSource: manual_note with empty url stores successfully', `Threw: ${manualNoteError}`)
  }

  // ── 9. buildAgentSummary: missing entries → run_extraction recommended ──────
  const { buildAgentSummary } = await import('../src/lib/agent/build-agent-summary')
  const emptySummary = buildAgentSummary(
    { slug: 'penn-mens-golf', websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster' },
    { extractedEntries: 0, extractedPending: 0, promotedEntries: 0, people: 0, seasonsWithEntries: 0, enrichedProfiles: 0, verifiedEnrichments: 0 },
  )
  assert(
    emptySummary.recommendedActionId === 'run_extraction',
    'buildAgentSummary: empty store → recommendedActionId is run_extraction',
    `Got: ${emptySummary.recommendedActionId}`,
  )
  assert(
    emptySummary.steps.length === 8,
    'buildAgentSummary: always returns 8 steps',
    `Got: ${emptySummary.steps.length}`,
  )
  assert(
    emptySummary.steps.find(s => s.id === 'current_roster')?.status === 'ready',
    'buildAgentSummary: current_roster status is ready when no entries',
    `Got: ${emptySummary.steps.find(s => s.id === 'current_roster')?.status}`,
  )

  // ── 10. buildAgentSummary: pending entries → add_to_graph recommended ──────
  const pendingSummary = buildAgentSummary(
    { slug: 'penn-mens-golf', websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster' },
    { extractedEntries: 3, extractedPending: 3, promotedEntries: 0, people: 0, seasonsWithEntries: 1, enrichedProfiles: 0, verifiedEnrichments: 0 },
  )
  assert(
    pendingSummary.recommendedActionId === 'add_to_graph',
    'buildAgentSummary: pending entries → recommendedActionId is add_to_graph',
    `Got: ${pendingSummary.recommendedActionId}`,
  )
  assert(
    pendingSummary.steps.find(s => s.id === 'review_roster')?.status === 'needs_approval',
    'buildAgentSummary: review_roster status is needs_approval when pending > 0',
    `Got: ${pendingSummary.steps.find(s => s.id === 'review_roster')?.status}`,
  )

  // ── 11. buildAgentSummary: people exist, no enrichment → enrich_profiles ───
  const peopleSummary = buildAgentSummary(
    { slug: 'penn-mens-golf', websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster' },
    { extractedEntries: 8, extractedPending: 0, promotedEntries: 8, people: 8, seasonsWithEntries: 3, enrichedProfiles: 0, verifiedEnrichments: 0 },
  )
  assert(
    peopleSummary.recommendedActionId === 'enrich_profiles',
    'buildAgentSummary: people + no enrichment → recommendedActionId is enrich_profiles',
    `Got: ${peopleSummary.recommendedActionId}`,
  )

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log()
  console.log('─'.repeat(50))
  console.log(`Total: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗  ${r.name}: ${r.detail}`)
    })
    process.exit(1)
  } else {
    console.log('All API validation tests passed.')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
