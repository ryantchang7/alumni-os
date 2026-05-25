/**
 * Deterministic demo setup for /builder/agent.
 * Creates the Penn team and 2 extracted (not yet promoted) roster rows.
 * Safe to run multiple times — idempotent.
 *
 * Run: npm run seed:agent-demo
 */

import {
  ensureStore,
  readStore,
  writeStore,
  createTeam,
} from '../src/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'
const ROSTER_URL = 'https://pennathletics.com/sports/mens-golf/roster'
const SEASON_YEAR = '2025-26'

const DEMO_ENTRIES = [
  { fullName: 'Ryan Chang', classLabel: 'Junior', extractionConfidence: 0.95 },
  { fullName: 'Hayden Adams', classLabel: 'Senior', extractionConfidence: 0.92 },
]

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

void (async () => {
  await ensureStore()

  const team = await createTeam({
    schoolName: 'University of Pennsylvania',
    teamName: "Men's Golf",
    sport: 'Golf',
    gender: 'Men',
    websiteUrl: ROSTER_URL,
    slug: TEAM_SLUG,
  })

  const store = await readStore()

  // Find which names are not yet in extractedRosterEntries for this team (any status)
  const existingNorms = new Set(
    store.extractedRosterEntries
      .filter(e => e.teamId === team.id)
      .map(e => normalizeName(e.fullName)),
  )

  const toAdd = DEMO_ENTRIES.filter(d => !existingNorms.has(normalizeName(d.fullName)))

  if (toAdd.length > 0) {
    const now = new Date().toISOString()
    const scrapeRunId = `seed-agent-demo-${Date.now()}`
    const crawledPageId = `seed-page-${Date.now()}`

    // Add a placeholder scrape run so the entries have a valid scrapeRunId
    store.scrapeRuns.push({
      id: scrapeRunId,
      teamId: team.id,
      seedUrl: ROSTER_URL,
      status: 'complete',
      startedAt: now,
      finishedAt: now,
      summary: `Seeded ${toAdd.length} demo entries`,
      logs: [],
    })

    for (const entry of toAdd) {
      store.extractedRosterEntries.push({
        id: crypto.randomUUID(),
        scrapeRunId,
        crawledPageId,
        teamId: team.id,
        fullName: entry.fullName,
        classLabel: entry.classLabel,
        hometown: undefined,
        highSchool: undefined,
        bioUrl: undefined,
        sourceUrl: ROSTER_URL,
        seasonYear: SEASON_YEAR,
        rawText: undefined,
        extractionConfidence: entry.extractionConfidence,
        status: 'extracted',
        createdAt: now,
      })
    }

    await writeStore(store)
  }

  const finalStore = await readStore()
  const teamEntries = finalStore.extractedRosterEntries.filter(e => e.teamId === team.id)
  const pendingRows = teamEntries.filter(e => e.status === 'extracted')
  const teamPeople = finalStore.people.filter(p =>
    finalStore.teamMemberships.some(m => m.personId === p.id && m.teamId === team.id),
  )

  console.log('── seed:agent-demo ──')
  console.log(`  teams:        1 (${team.slug})`)
  console.log(`  extractedRows: ${teamEntries.length}`)
  console.log(`  pendingRows:   ${pendingRows.length}`)
  console.log(`  people:        ${teamPeople.length}`)
  for (const d of DEMO_ENTRIES) {
    const found = teamEntries.some(e => normalizeName(e.fullName) === normalizeName(d.fullName))
    console.log(`  ${found ? '[ok]' : '[missing]'} ${d.fullName}`)
  }
})()
