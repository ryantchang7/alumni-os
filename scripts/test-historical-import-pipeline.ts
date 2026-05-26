/**
 * Integration test for the historical import pipeline.
 *
 * Covers:
 *   1. Entries saved with status "extracted" — no people or memberships created yet
 *   2. Promotion creates Person + TeamMembership correctly
 *   3. Idempotency: same person across 2024-25 and 2025-26 → 1 Person, 1 TeamMembership,
 *      correct rosterStartYear/End, merged sourceUrls
 *   4. Re-running promoteRosterEntries on already-promoted IDs creates no duplicates
 *
 * Run: npm run test:historical-pipeline
 */

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
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

interface AssertResult {
  label: string
  pass: boolean
  detail?: string
}

function assert(label: string, pass: boolean, detail?: string): AssertResult {
  return { label, pass, detail }
}

void (async () => {
  console.log('── Historical Import Pipeline Integration Test ──')
  console.log('WARNING: This test resets data/alumni-os.json. Run store:reset afterwards to restore a clean empty store.\n')

  // Reset store to a known-empty state for deterministic assertions
  await writeStore(EMPTY_STORE)

  // Create team
  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })
  console.log('Team created:', team.slug)

  // ── Part 1: Pre-promotion state ──────────────────────────────────────────────
  // After saveExtractedRosterEntries, entries are "extracted" only.
  // No Person or TeamMembership should exist yet.

  const entries2024 = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-2024',
      crawledPageId: 'page-2024',
      teamId: team.id,
      fullName: 'Ryan Chang',
      classLabel: 'Sophomore',
      hometown: 'Brookline, Mass.',
      highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/sports/mens-golf/roster/ryan-chang/3',
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster/2024-25',
      seasonYear: '2024-25',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
    {
      scrapeRunId: 'run-2024',
      crawledPageId: 'page-2024',
      teamId: team.id,
      fullName: 'Hayden Adams',
      classLabel: 'Junior',
      hometown: 'Lexington, Ky.',
      highSchool: 'Sayre School',
      bioUrl: 'https://pennathletics.com/sports/mens-golf/roster/hayden-adams/1',
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster/2024-25',
      seasonYear: '2024-25',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
  ])

  const prePeopleCount = (await getPeopleForTeam(team.id)).length
  const preMembershipCount = (await getTeamMembershipsForTeam(team.id)).length
  const storedEntries = (await readStore()).extractedRosterEntries.filter(e => e.teamId === team.id)
  const allExtracted = storedEntries.every(e => e.status === 'extracted')

  const prePromotionResults: AssertResult[] = [
    assert(
      'Before promotion: 0 people exist',
      prePeopleCount === 0,
      `got ${prePeopleCount}`,
    ),
    assert(
      'Before promotion: 0 memberships exist',
      preMembershipCount === 0,
      `got ${preMembershipCount}`,
    ),
    assert(
      'Before promotion: all entries have status "extracted"',
      allExtracted,
      storedEntries.map(e => `${e.fullName}:${e.status}`).join(', '),
    ),
    assert(
      'Before promotion: 2 entries saved',
      entries2024.length === 2,
      `got ${entries2024.length}`,
    ),
  ]

  // ── Part 2: Promote 2024-25, then verify ────────────────────────────────────
  const promo2024 = await promoteRosterEntries(team.id, entries2024.map(e => e.id))
  console.log('2024-25 promotion:', promo2024)

  // ── Part 3: Save 2025-26 entries (not yet promoted) ─────────────────────────
  const entries2025 = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-2025',
      crawledPageId: 'page-2025',
      teamId: team.id,
      fullName: 'Ryan Chang',
      classLabel: 'Junior',
      hometown: 'Brookline, Mass.',
      highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/sports/mens-golf/roster/ryan-chang/3',
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster/2025-26',
      seasonYear: '2025-26',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
    {
      scrapeRunId: 'run-2025',
      crawledPageId: 'page-2025',
      teamId: team.id,
      fullName: 'Hayden Adams',
      classLabel: 'Senior',
      hometown: 'Lexington, Ky.',
      highSchool: 'Sayre School',
      bioUrl: 'https://pennathletics.com/sports/mens-golf/roster/hayden-adams/1',
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster/2025-26',
      seasonYear: '2025-26',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
  ])

  // After saving 2025 entries — people/memberships should still be exactly 2 (from 2024 only)
  const midPeopleCount = (await getPeopleForTeam(team.id)).length
  const midMembershipCount = (await getTeamMembershipsForTeam(team.id)).length

  const midResults: AssertResult[] = [
    assert(
      'After 2024-25 promotion: 2 people exist',
      midPeopleCount === 2,
      `got ${midPeopleCount}`,
    ),
    assert(
      'After saving 2025-26 entries (not yet promoted): still 2 people',
      midPeopleCount === 2,
      `got ${midPeopleCount}`,
    ),
    assert(
      'After saving 2025-26 entries (not yet promoted): still 2 memberships',
      midMembershipCount === 2,
      `got ${midMembershipCount}`,
    ),
  ]

  // ── Part 4: Promote 2025-26 ──────────────────────────────────────────────────
  const promo2025 = await promoteRosterEntries(team.id, entries2025.map(e => e.id))
  console.log('2025-26 promotion:', promo2025)

  const people = await getPeopleForTeam(team.id)
  const memberships = await getTeamMembershipsForTeam(team.id)

  const ryanPeople = people.filter(p => p.normalizedName === 'ryan chang')
  const ryanMembership = memberships.find(m => ryanPeople.some(p => p.id === m.personId))

  const haydenPeople = people.filter(p => p.normalizedName === 'hayden adams')
  const haydenMembership = memberships.find(m => haydenPeople.some(p => p.id === m.personId))

  const idempotencyResults: AssertResult[] = [
    assert('Exactly 2 people total', people.length === 2, `got ${people.length}`),
    assert('Exactly 2 memberships total', memberships.length === 2, `got ${memberships.length}`),

    assert('Ryan Chang: exactly 1 person', ryanPeople.length === 1, `got ${ryanPeople.length}`),
    assert('Ryan Chang: membership exists', ryanMembership !== undefined),
    assert(
      'Ryan Chang: rosterStartYear = 2024',
      ryanMembership?.rosterStartYear === 2024,
      `got ${ryanMembership?.rosterStartYear}`,
    ),
    assert(
      'Ryan Chang: rosterEndYear = 2026',
      ryanMembership?.rosterEndYear === 2026,
      `got ${ryanMembership?.rosterEndYear}`,
    ),
    assert(
      'Ryan Chang: sourceUrls has both seasons (no duplicates)',
      ryanMembership?.sourceUrls.length === 2,
      `got ${ryanMembership?.sourceUrls.length}: ${ryanMembership?.sourceUrls.join(', ')}`,
    ),

    assert('Hayden Adams: exactly 1 person', haydenPeople.length === 1, `got ${haydenPeople.length}`),
    assert(
      'Hayden Adams: rosterStartYear = 2024',
      haydenMembership?.rosterStartYear === 2024,
      `got ${haydenMembership?.rosterStartYear}`,
    ),
    assert(
      'Hayden Adams: rosterEndYear = 2026',
      haydenMembership?.rosterEndYear === 2026,
      `got ${haydenMembership?.rosterEndYear}`,
    ),

    assert('2024-25: 2 people created', promo2024.peopleCreated === 2, `got ${promo2024.peopleCreated}`),
    assert('2025-26: 0 new people (all existing)', promo2025.peopleCreated === 0, `got ${promo2025.peopleCreated}`),
    assert('2025-26: 2 memberships updated', promo2025.membershipsCreatedOrUpdated === 2, `got ${promo2025.membershipsCreatedOrUpdated}`),
  ]

  // ── Part 5: Re-run promotion — must create zero duplicates ──────────────────
  // Attempting to promote already-promoted IDs should be a no-op.
  const rerunResult = await promoteRosterEntries(team.id, [
    ...entries2024.map(e => e.id),
    ...entries2025.map(e => e.id),
  ])
  const postRerunPeople = await getPeopleForTeam(team.id)
  const postRerunMemberships = await getTeamMembershipsForTeam(team.id)

  const rerunResults: AssertResult[] = [
    assert(
      'Re-run promotion: promotedCount = 0 (already promoted)',
      rerunResult.promotedCount === 0,
      `got ${rerunResult.promotedCount}`,
    ),
    assert(
      'Re-run promotion: no new people created',
      rerunResult.peopleCreated === 0,
      `got ${rerunResult.peopleCreated}`,
    ),
    assert(
      'Re-run promotion: still exactly 2 people total',
      postRerunPeople.length === 2,
      `got ${postRerunPeople.length}`,
    ),
    assert(
      'Re-run promotion: still exactly 2 memberships total',
      postRerunMemberships.length === 2,
      `got ${postRerunMemberships.length}`,
    ),
    assert(
      'Re-run promotion: Ryan Chang sourceUrls still = 2 (no duplicates)',
      (() => {
        const ryan2 = postRerunMemberships.find(m =>
          postRerunPeople.some(p => p.normalizedName === 'ryan chang' && p.id === m.personId),
        )
        return ryan2?.sourceUrls.length === 2
      })(),
      'sourceUrls duplicated',
    ),
  ]

  // ── Print all results ────────────────────────────────────────────────────────
  const allResults = [
    { section: 'Pre-promotion state', results: prePromotionResults },
    { section: 'Mid-pipeline state (2025-26 saved, not promoted)', results: midResults },
    { section: 'Idempotency (same person across seasons)', results: idempotencyResults },
    { section: 'Re-run promotion (no duplicates)', results: rerunResults },
  ]

  let passed = 0
  let failed = 0

  for (const { section, results: sectionResults } of allResults) {
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
  else console.log('All historical pipeline tests passed.')
})()
