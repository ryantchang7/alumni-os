import fs from 'fs/promises'
import path from 'path'

const STORE_PATH = path.join(process.cwd(), 'data', 'alumni-os.json')
const EMPTY = {
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

void (async () => {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY, null, 2))
  console.log('Store reset:', STORE_PATH)
})()
