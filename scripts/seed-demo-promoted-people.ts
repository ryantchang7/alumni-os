import {
  ensureStore,
  readStore,
  writeStore,
  createTeam,
  saveExtractedRosterEntries,
  promoteRosterEntries,
} from '../src/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'
const ROSTER_URL = 'https://pennathletics.com/sports/mens-golf/roster'
const SEASON_YEAR = '2025-26'

const DEMO_NAMES = ['Ryan Chang', 'Hayden Adams']

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

  console.log('Team:', team.slug, team.id)

  const store = await readStore()

  const existingNorms = new Set(
    store.people
      .filter(p =>
        store.teamMemberships.some(m => m.personId === p.id && m.teamId === team.id),
      )
      .map(p => p.normalizedName),
  )

  function normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const toSeed = DEMO_NAMES.filter(n => !existingNorms.has(normalizeName(n)))

  if (toSeed.length === 0) {
    console.log('All demo people already promoted. Skipping.')
  } else {
    const now = new Date().toISOString()
    const scrapeRunId = 'seed-demo-' + Date.now()
    const crawledPageId = 'seed-page-' + Date.now()

    const entryInputs = toSeed.map(name => ({
      scrapeRunId,
      crawledPageId,
      teamId: team.id,
      fullName: name,
      sourceUrl: ROSTER_URL,
      seasonYear: SEASON_YEAR,
      extractionConfidence: 0.95,
      status: 'extracted' as const,
      createdAt: now,
    }))

    const saved = await saveExtractedRosterEntries(entryInputs)
    const result = await promoteRosterEntries(
      team.id,
      saved.map(e => e.id),
    )
    console.log('Promoted:', result.promotedCount, 'people created:', result.peopleCreated)
  }

  const finalStore = await readStore()
  const teamPeople = finalStore.people.filter(p =>
    finalStore.teamMemberships.some(m => m.personId === p.id && m.teamId === team.id),
  )

  console.log('People count:', teamPeople.length)

  for (const name of DEMO_NAMES) {
    const norm = normalizeName(name)
    const matches = teamPeople.filter(p => p.normalizedName === norm)
    console.log(`${name}: found=${matches.length > 0}, duplicates=${matches.length}`)
  }

  const ryanMatches = teamPeople.filter(p => p.normalizedName === normalizeName('Ryan Chang'))
  if (ryanMatches.length > 1) {
    console.error('WARNING: duplicate Ryan Chang detected:', ryanMatches.length)
    process.exit(1)
  }
})()
