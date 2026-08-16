/**
 * Unit tests for network publication store helpers.
 * Tests: publishMembershipToNetwork, unpublishMembershipFromNetwork, getPublishedPeopleForTeam
 * Also validates: role enforcement (player cannot publish).
 *
 * Run: npm run test:network-publication
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
  publishMembershipToNetwork,
  unpublishMembershipFromNetwork,
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
  console.log('── Network Publication Tests ──\n')
  await writeStore(EMPTY_STORE)

  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: 'https://pennathletics.com/sports/mens-golf/roster',
    slug: 'penn-mens-golf',
  })

  // Seed two people
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
  ])
  await promoteRosterEntries(team.id, entries.map(e => e.id))

  const store = await readStore()
  const ryanPerson = store.people.find(p => p.normalizedName === 'ryan chang')
  const haydenPerson = store.people.find(p => p.normalizedName === 'hayden adams')

  assert(!!ryanPerson, 'Ryan Chang exists in people after promotion', 'Person not found')
  assert(!!haydenPerson, 'Hayden Adams exists in people after promotion', 'Person not found')

  if (!ryanPerson || !haydenPerson) {
    console.log('\nAborting: prerequisite people missing.')
    process.exit(1)
  }

  // ── 1. getPublishedPeopleForTeam: empty initially ──────────────────────────
  const initial = await getPublishedPeopleForTeam(team.id)
  assert(initial.length === 0, 'getPublishedPeopleForTeam: returns empty before publishing', `Got ${initial.length}`)

  // ── 2. publishMembershipToNetwork: captain can publish ────────────────────
  const publishedRyan = await publishMembershipToNetwork(team.id, ryanPerson.id, 'captain')
  assert(publishedRyan === true, 'publishMembershipToNetwork: captain can publish Ryan', `Got ${publishedRyan}`)

  const afterRyan = await getPublishedPeopleForTeam(team.id)
  assert(afterRyan.length === 1, 'getPublishedPeopleForTeam: 1 published after Ryan', `Got ${afterRyan.length}`)
  assert(
    afterRyan[0]?.person.normalizedName === 'ryan chang',
    'getPublishedPeopleForTeam: published person is Ryan Chang',
    `Got ${afterRyan[0]?.person.normalizedName}`,
  )

  // ── 3. publishMembershipToNetwork: staff can publish ──────────────────────
  const publishedHayden = await publishMembershipToNetwork(team.id, haydenPerson.id, 'staff')
  assert(publishedHayden === true, 'publishMembershipToNetwork: staff can publish Hayden', `Got ${publishedHayden}`)

  const afterBoth = await getPublishedPeopleForTeam(team.id)
  assert(afterBoth.length === 2, 'getPublishedPeopleForTeam: 2 published after both', `Got ${afterBoth.length}`)

  // ── 4. publishMembershipToNetwork: non-existent person → false ────────────
  const ghostResult = await publishMembershipToNetwork(team.id, 'ghost-person-id', 'captain')
  assert(ghostResult === false, 'publishMembershipToNetwork: non-existent person returns false', `Got ${ghostResult}`)

  // ── 5. unpublishMembershipFromNetwork: removes from published list ─────────
  const unpublishedRyan = await unpublishMembershipFromNetwork(team.id, ryanPerson.id)
  assert(unpublishedRyan === true, 'unpublishMembershipFromNetwork: returns true', `Got ${unpublishedRyan}`)

  const afterUnpublish = await getPublishedPeopleForTeam(team.id)
  assert(afterUnpublish.length === 1, 'getPublishedPeopleForTeam: 1 left after unpublishing Ryan', `Got ${afterUnpublish.length}`)
  assert(
    afterUnpublish[0]?.person.normalizedName === 'hayden adams',
    'getPublishedPeopleForTeam: remaining published is Hayden',
    `Got ${afterUnpublish[0]?.person.normalizedName}`,
  )

  // ── 6. unpublishMembershipFromNetwork: non-existent person → false ─────────
  const ghostUnpublish = await unpublishMembershipFromNetwork(team.id, 'ghost-id')
  assert(ghostUnpublish === false, 'unpublishMembershipFromNetwork: ghost id returns false', `Got ${ghostUnpublish}`)

  // ── 7. isPublishRole: player cannot publish ────────────────────────────────
  assert(!isPublishRole('player'), 'isPublishRole: player is NOT a publish role', '')
  assert(isPublishRole('captain'), 'isPublishRole: captain IS a publish role', '')
  assert(isPublishRole('staff'), 'isPublishRole: staff IS a publish role', '')
  assert(isPublishRole('admin'), 'isPublishRole: admin IS a publish role', '')

  // ── 8. Membership has publishedByRole stamped ──────────────────────────────
  const storeAfter = await readStore()
  const haydenMembership = storeAfter.teamMemberships.find(
    m => m.personId === haydenPerson.id && m.teamId === team.id,
  )
  assert(
    haydenMembership?.publishedByRole === 'staff',
    'publishMembershipToNetwork: publishedByRole stamped as staff',
    `Got ${haydenMembership?.publishedByRole}`,
  )
  assert(
    typeof haydenMembership?.publishedAt === 'string' && haydenMembership.publishedAt.length > 0,
    'publishMembershipToNetwork: publishedAt is stamped',
    `Got ${haydenMembership?.publishedAt}`,
  )

  // ── Summary ────────────────────────────────────────────────────────────────
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
    console.log('All network publication tests passed.')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
