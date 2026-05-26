/**
 * Integration test for graph-quality utilities.
 *
 * Covers:
 *   1. calculateGraphQuality — scoring, labels, warnings
 *   2. findDuplicateCandidates — exact, initial, similar
 *   3. getCoverageBySeason — season grouping, promoted counts
 *   4. getPeopleMissingFields — field gap detection
 *
 * Run: npm run test:graph-quality
 * WARNING: This test resets data/alumni-os.json. Run store:reset afterwards.
 */

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  readStore,
} from '../src/lib/store/local-store'
import {
  calculateGraphQuality,
  findDuplicateCandidates,
  getCoverageBySeason,
  getPeopleMissingFields,
} from '../src/lib/store/graph-quality'
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
  console.log('── Graph Quality Integration Test ──')
  console.log('WARNING: This test resets data/alumni-os.json. Run store:reset afterwards.\n')

  await writeStore(EMPTY_STORE)

  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })

  // ── Part 1: Empty team quality ────────────────────────────────────────────────
  const emptyQuality = await calculateGraphQuality(team.id)

  const emptyResults: AssertResult[] = [
    assert('Empty team: score = 0', emptyQuality.score === 0, `got ${emptyQuality.score}`),
    assert('Empty team: label = incomplete', emptyQuality.label === 'incomplete', emptyQuality.label),
    assert('Empty team: has no-people warning', emptyQuality.warnings.some(w => w.includes('No people')), emptyQuality.warnings.join(', ')),
  ]

  // ── Part 2: Promote entries with varying completeness ────────────────────────
  const entries = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-1',
      crawledPageId: 'page-1',
      teamId: team.id,
      fullName: 'Ryan Chang',
      classLabel: 'Sophomore',
      hometown: 'Brookline, Mass.',
      highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang',
      sourceUrl: 'https://pennathletics.com/roster/2024-25',
      seasonYear: '2024-25',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
    {
      // Missing hometown + highSchool + bioUrl — lower confidence
      scrapeRunId: 'run-1',
      crawledPageId: 'page-1',
      teamId: team.id,
      fullName: 'Hayden Adams',
      classLabel: 'Junior',
      hometown: undefined,
      highSchool: undefined,
      bioUrl: undefined,
      sourceUrl: 'https://pennathletics.com/roster/2024-25',
      seasonYear: '2024-25',
      extractionConfidence: 0.65,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
    {
      // 2025-26 Ryan — same person, different season
      scrapeRunId: 'run-2',
      crawledPageId: 'page-2',
      teamId: team.id,
      fullName: 'Ryan Chang',
      classLabel: 'Junior',
      hometown: 'Brookline, Mass.',
      highSchool: 'Windermere Prep',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang',
      sourceUrl: 'https://pennathletics.com/roster/2025-26',
      seasonYear: '2025-26',
      extractionConfidence: 0.95,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
  ])

  await promoteRosterEntries(team.id, entries.map(e => e.id))

  // ── Part 3: calculateGraphQuality ─────────────────────────────────────────────
  const quality = await calculateGraphQuality(team.id)

  const qualityResults: AssertResult[] = [
    assert('Quality: totalPeople = 2', quality.totalPeople === 2, `got ${quality.totalPeople}`),
    assert('Quality: score > 0', quality.score > 0, `got ${quality.score}`),
    assert('Quality: score <= 100', quality.score <= 100, `got ${quality.score}`),
    assert(
      'Quality: label is valid',
      ['graph-ready', 'needs-review', 'incomplete'].includes(quality.label),
      quality.label,
    ),
    assert(
      'Quality: low confidence count = 1 (Hayden at 0.65)',
      quality.lowConfidenceCount === 1,
      `got ${quality.lowConfidenceCount}`,
    ),
    assert(
      'Quality: high confidence count = 1 (Ryan at 0.95)',
      quality.highConfidenceCount === 1,
      `got ${quality.highConfidenceCount}`,
    ),
    assert(
      'Quality: missingHometownCount = 1',
      quality.missingHometownCount === 1,
      `got ${quality.missingHometownCount}`,
    ),
    assert(
      'Quality: missingBioUrlCount = 1',
      quality.missingBioUrlCount === 1,
      `got ${quality.missingBioUrlCount}`,
    ),
  ]

  // ── Part 4: findDuplicateCandidates ─────────────────────────────────────────
  // No duplicates in this dataset
  const dups = await findDuplicateCandidates(team.id)

  // Add a similar-name person to trigger detection
  const dupEntries = await saveExtractedRosterEntries([
    {
      scrapeRunId: 'run-3',
      crawledPageId: 'page-3',
      teamId: team.id,
      fullName: 'Ryan Chang', // exact name — normalized name will match existing
      classLabel: 'Sophomore',
      hometown: 'Other Town',
      highSchool: 'Other School',
      bioUrl: 'https://pennathletics.com/roster/ryan-chang-2',
      sourceUrl: 'https://pennathletics.com/roster/2024-25',
      seasonYear: '2024-25',
      extractionConfidence: 0.9,
      status: 'extracted',
      createdAt: new Date().toISOString(),
    },
  ])

  // Manually inject a second Ryan Chang person + membership to force duplicate detection
  const store = await readStore()
  const dupPersonId = crypto.randomUUID()
  store.people.push({
    id: dupPersonId,
    canonicalName: 'Ryan Chang',
    normalizedName: 'ryan chang',
    firstName: 'Ryan',
    lastName: 'Chang',
    createdAt: new Date().toISOString(),
  })
  store.teamMemberships.push({
    id: crypto.randomUUID(),
    personId: dupPersonId,
    teamId: team.id,
    bioUrls: [],
    sourceUrls: ['https://pennathletics.com/roster/2023-24'],
    confidence: 0.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  await writeStore(store)

  const dups2 = await findDuplicateCandidates(team.id)
  const exactDup = dups2.find(d => d.reason === 'exact_normalized_name')

  const dupResults: AssertResult[] = [
    assert('Duplicates: 0 before injection', dups.length === 0, `got ${dups.length}`),
    assert('Duplicates: exact match found after injection', exactDup !== undefined),
    assert(
      'Duplicates: exact match confidence = 0.98',
      exactDup?.confidence === 0.98,
      `got ${exactDup?.confidence}`,
    ),
  ]

  // ── Part 5: getCoverageBySeason ───────────────────────────────────────────────
  const coverage = await getCoverageBySeason(team.id)
  const s2024 = coverage.find(c => c.seasonYear === '2024-25')
  const s2025 = coverage.find(c => c.seasonYear === '2025-26')

  const coverageResults: AssertResult[] = [
    assert('Coverage: 2 seasons', coverage.length >= 2, `got ${coverage.length}`),
    assert('Coverage: 2024-25 exists', s2024 !== undefined),
    assert(
      'Coverage: 2024-25 has entries',
      (s2024?.totalEntries ?? 0) >= 2,
      `got ${s2024?.totalEntries}`,
    ),
    assert(
      'Coverage: 2024-25 has promoted entries',
      (s2024?.promotedEntries ?? 0) >= 2,
      `got ${s2024?.promotedEntries}`,
    ),
    assert('Coverage: 2025-26 exists', s2025 !== undefined),
  ]

  // ── Part 6: getPeopleMissingFields ────────────────────────────────────────────
  const missing = await getPeopleMissingFields(team.id)
  const haydenMissing = missing.find(m => m.person.normalizedName === 'hayden adams')

  const missingResults: AssertResult[] = [
    assert('Missing fields: Hayden Adams has gaps', haydenMissing !== undefined),
    assert(
      'Missing fields: Hayden missing hometown',
      haydenMissing?.missingFields.includes('hometown') ?? false,
      haydenMissing?.missingFields.join(', '),
    ),
    assert(
      'Missing fields: Hayden missing highSchool',
      haydenMissing?.missingFields.includes('highSchool') ?? false,
    ),
    assert(
      'Missing fields: Hayden missing bioUrls',
      haydenMissing?.missingFields.includes('bioUrls') ?? false,
    ),
    assert(
      'Missing fields: Ryan Changs in missing list are only injected duplicates (no sourceUrls)',
      missing
        .filter(m => m.person.normalizedName === 'ryan chang')
        .every(m => m.missingFields.includes('sourceUrls') || m.missingFields.includes('bioUrls')),
      missing.filter(m => m.person.normalizedName === 'ryan chang').map(m => m.missingFields.join(',')).join(' | '),
    ),
  ]

  // ── Print all results ────────────────────────────────────────────────────────
  const allResults = [
    { section: 'Empty team quality', results: emptyResults },
    { section: 'calculateGraphQuality', results: qualityResults },
    { section: 'findDuplicateCandidates', results: dupResults },
    { section: 'getCoverageBySeason', results: coverageResults },
    { section: 'getPeopleMissingFields', results: missingResults },
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
  else console.log('All graph quality tests passed.')
})()
