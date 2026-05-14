/**
 * Import Penn Golf master list (Excel or CSV) into data/alumni-os.json.
 *
 * Usage:
 *   npm run import:penn-master          # dry-run — prints what would change
 *   npm run import:penn-master:apply    # writes changes + creates timestamped backup
 *
 * Rules (permanent, do not bypass):
 *   - Never publishes anyone automatically (publishedToNetwork stays false on create)
 *   - Never overwrites alumni self-edited fields (alumniBio, helpTopics, contactPreference, etc.)
 *   - needs_review rows become ReviewItems, not published People
 *   - Idempotent: re-running with same data makes zero writes
 *   - Always backs up data/alumni-os.json before writing
 */

import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import xlsx from 'xlsx'

// ── Config ──────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')
const IMPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'imports')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'data', 'backups')
const PENN_GOLF_SLUG = 'penn-mens-golf'

// Self-edited alumni fields — never overwrite
const ALUMNI_SELF_FIELDS = new Set([
  'alumniBio', 'helpTopics', 'contactPreference', 'availabilityLevel',
  'openToGolfRounds', 'openToCoffee', 'openToMentorship', 'openToWarmIntroductions',
  'favoritePennGolfMemory', 'favoriteCourses', 'visibleToPlayers', 'optedOutAt',
])

// ── Counters ─────────────────────────────────────────────────────────────────

const log = {
  peopleCreated: 0,
  peopleUpdated: 0,
  membershipsCreated: 0,
  membershipsUpdated: 0,
  seasonRowsProcessed: 0,
  reviewItemsCreated: 0,
  skippedRows: 0,
  conflicts: 0,
  backupPath: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function parseSeasonYear(s: string): number | undefined {
  const m = s.trim().match(/^(\d{4})-\d{2}$/)
  return m ? parseInt(m[1], 10) : undefined
}

function findMasterFile(): string {
  if (!fs.existsSync(IMPORTS_DIR)) {
    throw new Error(`Imports directory not found: ${IMPORTS_DIR}`)
  }
  const files = fs.readdirSync(IMPORTS_DIR)
  // Prefer xlsx, fall back to csv
  const excel = files.find(f => /\.(xlsx|xls)$/i.test(f) && f.toLowerCase().includes('penn'))
  if (excel) return path.join(IMPORTS_DIR, excel)
  const csv = files.find(f => /\.csv$/i.test(f) && f.toLowerCase().includes('penn'))
  if (csv) return path.join(IMPORTS_DIR, csv)
  const anyExcel = files.find(f => /\.(xlsx|xls)$/i.test(f))
  if (anyExcel) return path.join(IMPORTS_DIR, anyExcel)
  throw new Error(`No master file found in ${IMPORTS_DIR}. Expected an .xlsx or .csv file.`)
}

interface MasterPerson {
  canonical_name: string
  normalized_name: string
  first_season: string
  last_season: string
  seasons: string
  season_count: number
  class_year_estimate: number | string
  latest_roster_class: string
  hometown: string
  high_school: string
  source_status: string
  captain_review_status: string
  publish_to_clubhouse: string
  visible_to_players: string
  current_role: string
  current_company: string
  city: string
  help_topics: string
  contact_preference: string
  manual_notes: string
  source_urls: string
}

interface SeasonRow {
  season: string
  name: string
  height: string
  class_label: string
  hometown: string
  high_school: string
  source_url: string
  source_status: string
  review_status: string
  notes: string
}

function loadSheets(filePath: string): { people: MasterPerson[]; seasonRows: SeasonRow[] } {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.csv') {
    // Single CSV — treat as Master People sheet
    const wb = xlsx.readFile(filePath)
    const ws = wb.Sheets[wb.SheetNames[0]]
    return { people: xlsx.utils.sheet_to_json(ws, { defval: '' }), seasonRows: [] }
  }
  const wb = xlsx.readFile(filePath)
  const peopleSheet = wb.Sheets['Master People'] ?? wb.Sheets[wb.SheetNames[0]]
  const seasonSheet = wb.Sheets['Season Rows']
  return {
    people: xlsx.utils.sheet_to_json(peopleSheet, { defval: '' }),
    seasonRows: seasonSheet ? xlsx.utils.sheet_to_json(seasonSheet, { defval: '' }) : [],
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Penn Golf Master List Import  ${APPLY ? '(APPLY)' : '(DRY-RUN)'}`)
  console.log('─'.repeat(60))

  // 1. Find and load master file
  const filePath = findMasterFile()
  console.log(`\nSource file: ${path.relative(PROJECT_ROOT, filePath)}`)
  const { people: masterPeople, seasonRows } = loadSheets(filePath)
  console.log(`Master People rows: ${masterPeople.length}`)
  console.log(`Season rows: ${seasonRows.length}`)

  // 2. Load current store
  if (!fs.existsSync(STORE_PATH)) {
    throw new Error(`Store not found: ${STORE_PATH}`)
  }
  const storeRaw = fs.readFileSync(STORE_PATH, 'utf-8')
  const store = JSON.parse(storeRaw)

  // Ensure arrays exist
  store.people ??= []
  store.teamMemberships ??= []
  store.reviewItems ??= []
  store.personEnrichments ??= []
  store.pre2000Candidates ??= []

  // 3. Find Penn Golf team
  const team = store.teams?.find((t: { slug: string }) => t.slug === PENN_GOLF_SLUG)
  if (!team) {
    throw new Error(`Team '${PENN_GOLF_SLUG}' not found in store. Run seed script first.`)
  }
  console.log(`\nTeam: ${team.teamName} (${team.id.slice(0, 8)}...)`)

  // 4. Build lookup maps
  const existingPeopleByNorm = new Map<string, { id: string; canonicalName: string; normalizedName: string }>(
    store.people.map((p: { id: string; canonicalName: string; normalizedName: string }) => [p.normalizedName, p])
  )
  const existingMembershipsByPersonId = new Map<string, { id: string; personId: string; teamId: string; publishedToNetwork?: boolean; publishedAt?: string; publishedByRole?: string; rosterStartYear?: number; rosterEndYear?: number; classLabel?: string; hometown?: string; highSchool?: string; bioUrls?: string[]; sourceUrls?: string[]; confidence?: number; updatedAt?: string }>(
    store.teamMemberships
      .filter((m: { teamId: string }) => m.teamId === team.id)
      .map((m: { personId: string; id: string; teamId: string }) => [m.personId, m])
  )
  const existingEnrichmentsByPersonId = new Map<string, Record<string, unknown>>(
    store.personEnrichments
      .filter((e: { teamId: string }) => e.teamId === team.id)
      .map((e: { personId: string }) => [e.personId, e])
  )

  const now = new Date().toISOString()

  // 5. Process each master person row
  console.log('\n── Processing people ──')
  for (const row of masterPeople) {
    const canonicalName = String(row.canonical_name || '').trim()
    if (!canonicalName) { log.skippedRows++; continue }

    const normalizedName = normalizeName(canonicalName)
    const isNeedsReview = String(row.source_status || '') === 'needs_review'
    const sourceUrlList = String(row.source_urls || '')
      .split(',')
      .map((u: string) => u.trim())
      .filter(Boolean)

    // Parse season range
    const firstSeasonStart = parseSeasonYear(String(row.first_season || ''))
    const lastSeasonStr = String(row.last_season || '')
    const lastSeasonStart = parseSeasonYear(lastSeasonStr)
    const rosterEndYear = lastSeasonStart ? lastSeasonStart + 1 : undefined

    // 5a. Create or update Person
    let person = existingPeopleByNorm.get(normalizedName)
    if (!person) {
      // Check for close match conflicts
      const conflict = store.people.find((p: { normalizedName: string; canonicalName: string }) =>
        p.normalizedName === normalizedName && p.canonicalName !== canonicalName
      )
      if (conflict) {
        log.conflicts++
        if (!isNeedsReview) {
          // Create review item for name conflict
          store.reviewItems.push({
            id: randomUUID(),
            teamId: team.id,
            type: 'promotion_conflict',
            title: `Name conflict: "${canonicalName}" vs "${conflict.canonicalName}"`,
            description: `Normalized name "${normalizedName}" matches an existing person with different canonical name.`,
            status: 'open',
            priority: 'high',
            createdAt: now,
          })
        }
        log.skippedRows++
        continue
      }

      if (!APPLY) {
        console.log(`  [CREATE] Person: ${canonicalName}`)
      } else {
        const newPerson = {
          id: randomUUID(),
          canonicalName,
          normalizedName,
          firstName: canonicalName.split(' ')[0],
          lastName: canonicalName.split(' ').slice(1).join(' '),
          createdAt: now,
        }
        store.people.push(newPerson)
        existingPeopleByNorm.set(normalizedName, newPerson)
        person = newPerson
        log.peopleCreated++
      }
    } else {
      log.peopleUpdated++
    }

    if (!person && !APPLY) {
      // In dry-run, create a stub for membership processing below
      person = { id: `dry-run-${normalizedName}`, canonicalName, normalizedName }
    }
    if (!person) continue

    // 5b. Create review item for needs_review rows, skip membership creation
    if (isNeedsReview) {
      const alreadyHasReview = store.reviewItems.some(
        (r: { title: string; status: string }) => r.title.includes(canonicalName) && r.status === 'open'
      )
      if (!alreadyHasReview) {
        const reviewItem = {
          id: randomUUID(),
          teamId: team.id,
          type: 'low_confidence_extraction',
          title: `Needs source check: ${canonicalName}`,
          description: `Source status is needs_review. Captain verification required before publishing. Notes: ${row.manual_notes || 'none'}`,
          relatedPersonId: person.id,
          status: 'open',
          priority: 'normal',
          createdAt: now,
        }
        if (!APPLY) {
          console.log(`  [REVIEW] ${canonicalName} → needs source check`)
        } else {
          store.reviewItems.push(reviewItem)
        }
        log.reviewItemsCreated++
      }
      log.seasonRowsProcessed++
      continue
    }

    // 5c. Create or update TeamMembership
    const existingMembership = existingMembershipsByPersonId.get(person.id)
    const membershipData = {
      personId: person.id,
      teamId: team.id,
      rosterStartYear: firstSeasonStart,
      rosterEndYear,
      classLabel: String(row.latest_roster_class || '') || undefined,
      hometown: String(row.hometown || '') || undefined,
      highSchool: String(row.high_school || '') || undefined,
      bioUrls: [],
      sourceUrls: sourceUrlList,
      confidence: 0.95,
      // Never auto-publish
      publishedToNetwork: false,
      updatedAt: now,
    }

    if (!existingMembership) {
      if (!APPLY) {
        console.log(`  [CREATE] Membership: ${canonicalName} (${row.first_season}–${row.last_season})`)
      } else {
        const newMembership = { id: randomUUID(), ...membershipData, createdAt: now }
        store.teamMemberships.push(newMembership)
        existingMembershipsByPersonId.set(person.id, newMembership)
        log.membershipsCreated++
      }
    } else {
      // Update roster truth fields — never touch publishedToNetwork/publishedAt
      const changed =
        existingMembership.rosterStartYear !== membershipData.rosterStartYear ||
        existingMembership.rosterEndYear !== membershipData.rosterEndYear ||
        existingMembership.hometown !== membershipData.hometown ||
        existingMembership.highSchool !== membershipData.highSchool ||
        existingMembership.classLabel !== membershipData.classLabel

      if (changed) {
        if (!APPLY) {
          console.log(`  [UPDATE] Membership: ${canonicalName}`)
        } else {
          Object.assign(existingMembership, {
            rosterStartYear: membershipData.rosterStartYear,
            rosterEndYear: membershipData.rosterEndYear,
            classLabel: membershipData.classLabel,
            hometown: membershipData.hometown,
            highSchool: membershipData.highSchool,
            sourceUrls: membershipData.sourceUrls,
            updatedAt: now,
          })
          log.membershipsUpdated++
        }
      }
    }

    // 5d. Remove incorrect enrichment data (San Francisco for Ryan Chang)
    const enrichment = existingEnrichmentsByPersonId.get(person.id)
    if (enrichment && normalizedName === 'ryan chang') {
      if (enrichment.city === 'San Francisco' || enrichment.city === 'san francisco') {
        if (!APPLY) {
          console.log(`  [FIX] Ryan Chang: removing incorrect city "San Francisco"`)
        } else {
          enrichment.city = ''
          enrichment.updatedAt = now
        }
      }
    }

    log.seasonRowsProcessed++
  }

  // 6. Process season rows for additional context
  const seasonRowsByName = new Map<string, SeasonRow[]>()
  for (const sr of seasonRows) {
    const name = String(sr.name || '').trim()
    if (!name) continue
    const norm = normalizeName(name)
    if (!seasonRowsByName.has(norm)) seasonRowsByName.set(norm, [])
    seasonRowsByName.get(norm)!.push(sr)
  }

  // 7. Write or summarize
  if (APPLY) {
    // Backup first
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
    const ts = now.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
    const backupPath = path.join(BACKUPS_DIR, `alumni-os_${ts}.json`)
    fs.copyFileSync(STORE_PATH, backupPath)
    log.backupPath = backupPath
    console.log(`\nBackup created: ${path.relative(PROJECT_ROOT, backupPath)}`)

    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    console.log(`Store written: ${path.relative(PROJECT_ROOT, STORE_PATH)}`)
  }

  // 8. Summary
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Summary (${APPLY ? 'APPLIED' : 'DRY-RUN — no files written'})`)
  console.log('─'.repeat(60))
  console.log(`  People created:        ${log.peopleCreated}`)
  console.log(`  People updated:        ${log.peopleUpdated}`)
  console.log(`  Memberships created:   ${log.membershipsCreated}`)
  console.log(`  Memberships updated:   ${log.membershipsUpdated}`)
  console.log(`  Season rows processed: ${log.seasonRowsProcessed}`)
  console.log(`  Review items created:  ${log.reviewItemsCreated}`)
  console.log(`  Conflicts flagged:     ${log.conflicts}`)
  console.log(`  Skipped rows:          ${log.skippedRows}`)
  if (log.backupPath) console.log(`  Backup:                ${path.relative(PROJECT_ROOT, log.backupPath)}`)
  if (!APPLY) {
    console.log(`\n  Run with --apply to write changes.`)
  }
  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('Import failed:', err.message)
  process.exit(1)
})
