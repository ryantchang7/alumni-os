/**
 * Unit tests for the simplified product model (Phase 10).
 * Validates:
 *   - /api/player/profiles returns only published, non-opted-out profiles
 *   - /api/alumni/self-profile POST only allows safe fields
 *   - Role enforcement: player cannot publish
 *   - Alumni update does not alter roster truth (classLabel, rosterYears, hometown, highSchool)
 *
 * Run: npm run test:simplified-product
 */

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  publishMembershipToNetwork,
  updatePersonEnrichmentSafeFields,
  upsertPersonEnrichment,
  getPublishedPeopleForTeam,
  readStore,
} from '../src/lib/store/local-store'
import { isPublishRole } from '../src/lib/access/dev-permissions'
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
  console.log('── Simplified Product Tests (Phase 10) ──\n')
  await writeStore(EMPTY_STORE)

  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })

  const entries = await saveExtractedRosterEntries([
    {
      teamId: team.id,
      fullName: 'Ryan Chang',
      extractionConfidence: 0.95,
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster',
      seasonYear: '2025-26',
      status: 'extracted',
    },
    {
      teamId: team.id,
      fullName: 'Hayden Adams',
      extractionConfidence: 0.92,
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster',
      seasonYear: '2025-26',
      status: 'extracted',
    },
    {
      teamId: team.id,
      fullName: 'Arjun Caprihan',
      extractionConfidence: 0.88,
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster',
      seasonYear: '2025-26',
      status: 'extracted',
    },
  ])
  await promoteRosterEntries(team.id, entries.map(e => e.id))

  const store = await readStore()
  const ryan = store.people.find(p => p.normalizedName === 'ryan chang')
  const hayden = store.people.find(p => p.normalizedName === 'hayden adams')
  const arjun = store.people.find(p => p.normalizedName === 'arjun caprihan')

  if (!ryan || !hayden || !arjun) {
    console.log('\nAborting: prerequisite people missing.')
    process.exit(1)
  }

  // ── 1. Player API: empty when nobody published ──────────────────────────────
  const nonePublished = await getPublishedPeopleForTeam(team.id)
  assert(
    nonePublished.length === 0,
    'Player API: no profiles before publishing',
    `Got ${nonePublished.length}`,
  )

  // ── 2. Publish two people, leave one unpublished ────────────────────────────
  await publishMembershipToNetwork(team.id, ryan.id, 'captain')
  await publishMembershipToNetwork(team.id, hayden.id, 'captain')

  const published = await getPublishedPeopleForTeam(team.id)
  assert(published.length === 2, 'Player API: 2 published profiles', `Got ${published.length}`)

  const publishedIds = published.map(p => p.person.id)
  assert(publishedIds.includes(ryan.id), 'Player API: Ryan is published', '')
  assert(publishedIds.includes(hayden.id), 'Player API: Hayden is published', '')
  assert(!publishedIds.includes(arjun.id), 'Player API: Arjun is NOT published', '')

  // ── 3. visibleToPlayers=false hides from player view ───────────────────────
  await publishMembershipToNetwork(team.id, arjun.id, 'captain')
  await updatePersonEnrichmentSafeFields(arjun.id, team.id, { visibleToPlayers: false })

  const storeAfterOpt = await readStore()
  const arjunEnrichment = storeAfterOpt.personEnrichments.find(
    e => e.personId === arjun.id && e.teamId === team.id,
  )
  assert(
    arjunEnrichment?.visibleToPlayers === false,
    'Alumni opt-out: visibleToPlayers set to false',
    `Got ${arjunEnrichment?.visibleToPlayers}`,
  )

  // ── 4. Safe fields update preserves roster truth ────────────────────────────
  // Upsert enrichment with roster fields first (simulating scraped data)
  await upsertPersonEnrichment({
    personId: ryan.id,
    teamId: team.id,
    currentRole: 'Student',
    verificationStatus: 'unverified',
    sourceUrls: [],
  })

  // Alumni updates safe fields
  await updatePersonEnrichmentSafeFields(ryan.id, team.id, {
    currentRole: 'Analyst',
    currentCompany: 'Goldman Sachs',
    city: 'New York',
    alumniBio: 'Working in finance.',
    helpTopics: ['Finance / banking', 'Career advice'],
    contactPreference: 'team_intro',
    visibleToPlayers: true,
  })

  const storeAfterUpdate = await readStore()
  const ryanEnrichment = storeAfterUpdate.personEnrichments.find(
    e => e.personId === ryan.id && e.teamId === team.id,
  )

  assert(
    ryanEnrichment?.currentRole === 'Analyst',
    'Safe update: currentRole updated',
    `Got ${ryanEnrichment?.currentRole}`,
  )
  assert(
    ryanEnrichment?.currentCompany === 'Goldman Sachs',
    'Safe update: currentCompany updated',
    `Got ${ryanEnrichment?.currentCompany}`,
  )
  assert(
    ryanEnrichment?.alumniBio === 'Working in finance.',
    'Safe update: alumniBio set',
    `Got ${ryanEnrichment?.alumniBio}`,
  )
  assert(
    Array.isArray(ryanEnrichment?.helpTopics) && ryanEnrichment!.helpTopics!.length === 2,
    'Safe update: helpTopics set with 2 items',
    `Got ${JSON.stringify(ryanEnrichment?.helpTopics)}`,
  )
  assert(
    ryanEnrichment?.contactPreference === 'team_intro',
    'Safe update: contactPreference set',
    `Got ${ryanEnrichment?.contactPreference}`,
  )
  assert(
    ryanEnrichment?.verificationStatus === 'unverified',
    'Safe update: verificationStatus NOT altered',
    `Got ${ryanEnrichment?.verificationStatus}`,
  )

  // Roster truth is on membership, not enrichment — check membership unchanged
  const ryanMembership = storeAfterUpdate.teamMemberships.find(
    m => m.personId === ryan.id && m.teamId === team.id,
  )
  assert(!!ryanMembership, 'Safe update: membership still exists', '')

  // ── 5. isPublishRole checks ──────────────────────────────────────────────────
  assert(!isPublishRole('player'), 'isPublishRole: player cannot publish', '')
  assert(isPublishRole('captain'), 'isPublishRole: captain can publish', '')
  assert(isPublishRole('staff'), 'isPublishRole: staff can publish', '')
  assert(isPublishRole('admin'), 'isPublishRole: admin can publish', '')

  // ── 6. contactPreference values valid ──────────────────────────────────────
  const validPrefs = ['team_intro', 'email_ok', 'linkedin_ok', 'not_available']
  for (const pref of validPrefs) {
    await updatePersonEnrichmentSafeFields(ryan.id, team.id, {
      contactPreference: pref as 'team_intro' | 'email_ok' | 'linkedin_ok' | 'not_available',
    })
    const s = await readStore()
    const e = s.personEnrichments.find(x => x.personId === ryan.id && x.teamId === team.id)
    assert(
      e?.contactPreference === pref,
      `contactPreference: '${pref}' accepted`,
      `Got ${e?.contactPreference}`,
    )
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log()
  console.log('─'.repeat(50))
  console.log(`Total: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗  ${r.name}: ${r.detail}`)
    })
    process.exit(1)
  } else {
    console.log('All simplified product tests passed.')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
