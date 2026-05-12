/**
 * Seeds the store with promoted people and publishes them to the network.
 * Used by E2E tests for network-level flows.
 *
 * Run: npm run seed:network-demo
 */

import {
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
  publishMembershipToNetwork,
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

async function run() {
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
      classLabel: 'Jr.',
      hometown: 'San Francisco, CA',
    },
    {
      teamId: team.id,
      fullName: 'Hayden Adams',
      extractionConfidence: 0.92,
      sourceUrl: 'https://pennathletics.com/sports/mens-golf/roster',
      seasonYear: '2025-26',
      status: 'extracted',
      classLabel: 'Sr.',
    },
  ])

  await promoteRosterEntries(team.id, entries.map(e => e.id))

  const store = await readStore()
  const ryanPerson = store.people.find(p => p.normalizedName === 'ryan chang')
  const haydenPerson = store.people.find(p => p.normalizedName === 'hayden adams')

  if (ryanPerson) {
    await publishMembershipToNetwork(team.id, ryanPerson.id, 'captain')
    console.log('  Published Ryan Chang to network')
  }
  if (haydenPerson) {
    await publishMembershipToNetwork(team.id, haydenPerson.id, 'captain')
    console.log('  Published Hayden Adams to network')
  }

  console.log('Network demo seeded: 2 people promoted and published.')
}

run().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
