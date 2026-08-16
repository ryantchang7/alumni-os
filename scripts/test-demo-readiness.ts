/**
 * Demo readiness smoke test. Validates the readiness API data model using store functions directly.
 * Run: npm run test:demo-readiness
 * WARNING: Resets data/alumni-os.json. Run store:reset afterwards.
 */

// Never write the committed seed: point the store at a scratch copy first.
// Must run before anything imports the store module.
import { copyFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
const __seed = join(process.cwd(), 'data', 'alumni-os.json')
const __scratch = join(mkdtempSync(join(tmpdir(), 'alumni-store-')), 'alumni-os.json')
copyFileSync(__seed, __scratch)
process.env.ALUMNI_STORE_PATH = __scratch

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  readStore,
} from '../src/lib/store/local-store'
import {
  calculateGraphQuality,
} from '../src/lib/store/graph-quality'
import type { Store } from '../src/lib/store/types'

const EMPTY_STORE: Store = {
  teams: [], scrapeRuns: [], crawledPages: [],
  extractedRosterEntries: [], people: [], teamMemberships: [],
  reviewItems: [], historicalImportRuns: [], historicalSeasonResults: [],
  personEnrichments: [], enrichmentSources: [],
}

interface AssertResult { label: string; pass: boolean; detail?: string }
function assert(label: string, pass: boolean, detail?: string): AssertResult {
  return { label, pass, detail }
}

// Helper: compute readiness counts from store
async function getReadinessCounts(teamId: string) {
  const store = await readStore()
  const entries = store.extractedRosterEntries.filter(e => e.teamId === teamId)
  const people = store.people.filter(p =>
    store.teamMemberships.some(m => m.personId === p.id && m.teamId === teamId)
  )
  const uniqueSeasons = new Set(entries.map(e => e.seasonYear).filter(Boolean)).size
  const historicalRuns = store.historicalImportRuns.filter(r => r.teamId === teamId).length
  const enrichments = (store.personEnrichments ?? []).filter(e => e.teamId === teamId)
  const enrichedProfiles = enrichments.length
  const verifiedEnrichments = enrichments.filter(
    e => e.verificationStatus === 'manually_verified' || e.verificationStatus === 'source_backed',
  ).length
  return {
    extractedEntries: entries.length,
    extractedPending: entries.filter(e => e.status === 'extracted').length,
    promotedEntries: entries.filter(e => e.status === 'promoted').length,
    rejectedEntries: entries.filter(e => e.status === 'rejected').length,
    people: people.length,
    memberships: store.teamMemberships.filter(m => m.teamId === teamId).length,
    seasonsWithEntries: uniqueSeasons,
    historicalRuns,
    enrichedProfiles,
    verifiedEnrichments,
  }
}

// Helper: compute recommended next action (mirrors API logic)
function getRecommendedNextAction(counts: Awaited<ReturnType<typeof getReadinessCounts>>, qualityScore: number, teamSlug: string) {
  if (counts.extractedPending === 0 && counts.people === 0) return { id: 'extract-roster' }
  if (counts.extractedPending > 0 && counts.people === 0) return { id: 'promote-entries' }
  if (counts.people > 0 && counts.seasonsWithEntries <= 1) return { id: 'import-historical' }
  if (counts.people > 0 && qualityScore < 60) return { id: 'review-quality' }
  return { id: 'open-graph' }
}

void (async () => {
  console.log('── Demo Readiness Smoke Test ──')
  console.log('WARNING: Resets data/alumni-os.json. Run store:reset afterwards.\n')

  await writeStore(EMPTY_STORE)

  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })

  // ── Step 1: No entries yet ────────────────────────────────────────────────
  const counts1 = await getReadinessCounts(team.id)
  const quality1 = await calculateGraphQuality(team.id)
  const action1 = getRecommendedNextAction(counts1, quality1.score, team.slug)

  const results1: AssertResult[] = [
    assert('No entries: extractedEntries = 0', counts1.extractedEntries === 0),
    assert('No entries: people = 0', counts1.people === 0),
    assert('No entries: recommends extract-roster', action1.id === 'extract-roster', action1.id),
    assert('No entries: quality score = 0', quality1.score === 0),
  ]

  // ── Step 2: Save 2 entries ──────────────────────────────────────────────
  const now = new Date().toISOString()
  const saved = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-1', crawledPageId: 'page-1', teamId: team.id,
      fullName: 'Ryan Chang', classLabel: 'Sophomore',
      hometown: 'Brookline, Mass.', highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang',
      sourceUrl: 'https://pennathletics.com/roster/2025-26',
      seasonYear: '2025-26', extractionConfidence: 0.95,
      status: 'extracted', createdAt: now,
    },
    {
      scrapeRunId: 'run-1', crawledPageId: 'page-1', teamId: team.id,
      fullName: 'Hayden Adams', classLabel: 'Junior',
      hometown: undefined, highSchool: undefined, bioUrl: undefined,
      sourceUrl: 'https://pennathletics.com/roster/2025-26',
      seasonYear: '2025-26', extractionConfidence: 0.65,
      status: 'extracted', createdAt: now,
    },
  ])

  const counts2 = await getReadinessCounts(team.id)
  const quality2 = await calculateGraphQuality(team.id)
  const action2 = getRecommendedNextAction(counts2, quality2.score, team.slug)

  const results2: AssertResult[] = [
    assert('After save: extractedEntries = 2', counts2.extractedEntries === 2, `got ${counts2.extractedEntries}`),
    assert('After save: extractedPending = 2', counts2.extractedPending === 2, `got ${counts2.extractedPending}`),
    assert('After save: people = 0', counts2.people === 0),
    assert('After save: recommends promote-entries', action2.id === 'promote-entries', action2.id),
    assert('After save: seasonsWithEntries = 1', counts2.seasonsWithEntries === 1, `got ${counts2.seasonsWithEntries}`),
  ]

  // ── Step 3: Promote entries ──────────────────────────────────────────────
  await promoteRosterEntries(team.id, saved.map(e => e.id))

  const counts3 = await getReadinessCounts(team.id)
  const quality3 = await calculateGraphQuality(team.id)
  const action3 = getRecommendedNextAction(counts3, quality3.score, team.slug)

  const results3: AssertResult[] = [
    assert('After promote: people = 2', counts3.people === 2, `got ${counts3.people}`),
    assert('After promote: extractedPending = 0', counts3.extractedPending === 0, `got ${counts3.extractedPending}`),
    assert('After promote: recommends import-historical (1 season)', action3.id === 'import-historical', action3.id),
  ]

  // ── Step 4: Add a second season ──────────────────────────────────────────
  const saved2 = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-2', crawledPageId: 'page-2', teamId: team.id,
      fullName: 'Ryan Chang', classLabel: 'Junior',
      hometown: 'Brookline, Mass.', highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang',
      sourceUrl: 'https://pennathletics.com/roster/2024-25',
      seasonYear: '2024-25', extractionConfidence: 0.95,
      status: 'extracted', createdAt: now,
    },
  ])
  await promoteRosterEntries(team.id, saved2.map(e => e.id))

  const counts4 = await getReadinessCounts(team.id)
  const store4 = await readStore()
  const people4 = store4.people.filter(p =>
    store4.teamMemberships.some(m => m.personId === p.id && m.teamId === team.id)
  )
  const ryanChangCount = people4.filter(p => p.normalizedName === 'ryan chang').length

  const results4: AssertResult[] = [
    assert('After 2nd season: seasonsWithEntries >= 2', counts4.seasonsWithEntries >= 2, `got ${counts4.seasonsWithEntries}`),
    assert('No duplicate Ryan Chang (idempotent promote)', ryanChangCount === 1, `got ${ryanChangCount} ryan chang people`),
    assert('After 2nd season: people = 2 (not 3)', counts4.people === 2, `got ${counts4.people}`),
  ]

  // ── Step 5: Checklist validation ─────────────────────────────────────────
  // Verify checklist IDs are stable (we test the logic here)
  const checklistIds = ['team-created', 'roster-extracted', 'entries-promoted', 'historical-imported', 'quality-reviewed', 'profiles-enriched']
  const validStatuses = ['complete', 'warning', 'missing']

  type ChecklistStatus = 'complete' | 'warning' | 'missing'
  function buildChecklist(counts: typeof counts4, qualityScore: number, _slug: string): Array<{ id: string; status: ChecklistStatus }> {
    const enrichmentStatus: ChecklistStatus =
      counts.verifiedEnrichments > 0 ? 'complete' : counts.people > 0 ? 'warning' : 'missing'
    return [
      { id: 'team-created', status: 'complete' },
      { id: 'roster-extracted', status: counts.extractedEntries > 0 ? 'complete' : 'missing' },
      { id: 'entries-promoted', status: counts.people > 0 ? 'complete' : counts.extractedPending > 0 ? 'warning' : 'missing' },
      { id: 'historical-imported', status: counts.seasonsWithEntries > 1 ? 'complete' : counts.people > 0 ? 'warning' : 'missing' },
      { id: 'quality-reviewed', status: qualityScore >= 60 ? 'complete' : qualityScore > 0 ? 'warning' : 'missing' },
      { id: 'profiles-enriched', status: enrichmentStatus },
    ]
  }

  const quality5 = await calculateGraphQuality(team.id)
  const checklist = buildChecklist(counts4, quality5.score, team.slug)

  const results5: AssertResult[] = [
    assert('Checklist: 6 items', checklist.length === 6, `got ${checklist.length}`),
    assert('Checklist: stable IDs', checklist.every((c, i) => c.id === checklistIds[i])),
    assert('Checklist: valid statuses', checklist.every(c => validStatuses.includes(c.status))),
    assert('Checklist: team-created is complete', checklist[0].status === 'complete'),
    assert('Checklist: roster-extracted is complete', checklist[1].status === 'complete', checklist[1].status),
    assert('Checklist: entries-promoted is complete', checklist[2].status === 'complete', checklist[2].status),
    assert('Checklist: historical-imported is complete', checklist[3].status === 'complete', checklist[3].status),
  ]

  // ── Print results ─────────────────────────────────────────────────────────
  const allSections = [
    { section: 'Step 1: No entries', results: results1 },
    { section: 'Step 2: Entries saved', results: results2 },
    { section: 'Step 3: Entries promoted', results: results3 },
    { section: 'Step 4: Second season', results: results4 },
    { section: 'Step 5: Checklist', results: results5 },
  ]

  let passed = 0
  let failed = 0

  for (const { section, results: sectionResults } of allSections) {
    console.log(`\n  ${section}`)
    for (const r of sectionResults) {
      const icon = r.pass ? '  ✓' : '  ✗'
      const detail = !r.pass && r.detail ? ` (${r.detail})` : ''
      console.log(`  ${icon}  ${r.label}${detail}`)
      if (r.pass) passed++
      else failed++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Total: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
  else console.log('All demo readiness tests passed.')
})()
