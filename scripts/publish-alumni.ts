/**
 * Publish all alumni into the Penn Golf Clubhouse Member Book.
 *
 * What it does:
 *   1. Reads penn_mgolf_alumni_master_2000_2026.csv from ~/Desktop
 *   2. For each alumni row (membership_status = "alumnus"):
 *      - Sets publishedToNetwork: true on existing TeamMembership
 *      - Fills in classYearEstimate if missing
 *      - Sets memberStatus: 'imported' if not already set
 *      - Imports the record if missing entirely
 *   3. Current players (active_2025_26) are left untouched
 *   4. Self-edited enrichment fields are never overwritten
 *
 * Usage:
 *   npx tsx scripts/publish-alumni.ts          # dry-run
 *   npx tsx scripts/publish-alumni.ts --apply  # writes changes
 */

import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import { parse } from 'csv-parse/sync'

const APPLY = process.argv.includes('--apply')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'data', 'backups')
const CSV_PATH = path.join(
  process.env.HOME ?? '/Users/ryanchang',
  'Desktop',
  'penn_mgolf_alumni_master_2000_2026.csv',
)
const PENN_GOLF_SLUG = 'penn-mens-golf'

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function backup(store: object): string {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dest = path.join(BACKUPS_DIR, `alumni-os_publish_${ts}.json`)
  fs.writeFileSync(dest, JSON.stringify(store, null, 2))
  return dest
}

interface CsvRow {
  id: string
  canonical_name: string
  start_season: string
  end_season: string
  start_year: string
  finish_year: string
  season_count: string
  class_year_estimate: string
  latest_roster_class: string
  hometown: string
  high_school: string
  membership_status: string
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

async function main() {
  // Load CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`)
    process.exit(1)
  }
  const raw = fs.readFileSync(CSV_PATH, 'utf-8')
  const rows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true })

  // Load store
  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
  const team = store.teams.find((t: { slug: string }) => t.slug === PENN_GOLF_SLUG)
  if (!team) {
    console.error('Penn Golf team not found in store')
    process.exit(1)
  }

  // Index existing data
  const peopleByNorm = new Map<string, { id: string; canonicalName: string; normalizedName: string; firstName?: string; lastName?: string; createdAt: string }>()
  for (const p of store.people) {
    peopleByNorm.set(p.normalizedName, p)
  }
  const membershipByPersonId = new Map<string, { id: string; personId: string; teamId: string; [key: string]: unknown }>()
  for (const m of store.teamMemberships) {
    if (m.teamId === team.id) membershipByPersonId.set(m.personId, m)
  }

  const stats = {
    alumni: 0,
    published: 0,
    alreadyPublished: 0,
    classYearFilled: 0,
    memberStatusSet: 0,
    newImports: 0,
    skipped: 0,
  }

  const now = new Date().toISOString()

  // Only process alumni rows
  const alumniRows = rows.filter(r =>
    r.membership_status === 'alumnus' || r.membership_status === 'alumnus_needs_review'
  )

  console.log(`\nCSV rows total: ${rows.length}  |  alumni rows: ${alumniRows.length}`)
  if (!APPLY) console.log('DRY RUN — pass --apply to write changes\n')

  for (const row of alumniRows) {
    stats.alumni++
    const norm = normalizeName(row.canonical_name)
    const classYearEstimate = row.class_year_estimate?.trim() || undefined
    const startYear = parseInt(row.start_year, 10) || undefined
    const finishYear = parseInt(row.finish_year, 10) || undefined

    let person = peopleByNorm.get(norm)

    if (!person) {
      // Person is completely missing — import them
      const parts = row.canonical_name.trim().split(/\s+/)
      const personId = randomUUID()
      person = {
        id: personId,
        canonicalName: row.canonical_name.trim(),
        normalizedName: norm,
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || undefined,
        createdAt: now,
      }
      if (APPLY) store.people.push(person)
      peopleByNorm.set(norm, person)
      console.log(`  + NEW person: ${row.canonical_name}`)
      stats.newImports++
    }

    let membership = membershipByPersonId.get(person.id)

    if (!membership) {
      // TeamMembership missing — create it
      const newMembership = {
        id: randomUUID(),
        personId: person.id,
        teamId: team.id,
        memberRole: 'alumni',
        memberStatus: 'imported',
        rosterStartYear: startYear,
        rosterEndYear: finishYear,
        classYearEstimate,
        classLabel: row.latest_roster_class?.trim() || undefined,
        hometown: row.hometown?.trim() || undefined,
        highSchool: row.high_school?.trim() || undefined,
        bioUrls: [],
        sourceUrls: row.source_urls ? row.source_urls.split(',').map((u: string) => u.trim()).filter(Boolean) : [],
        confidence: 0.9,
        publishedToNetwork: true,
        publishedAt: now,
        publishedByRole: 'admin',
        createdAt: now,
        updatedAt: now,
      }
      if (APPLY) {
        store.teamMemberships.push(newMembership)
        membershipByPersonId.set(person.id, newMembership)
      }
      console.log(`  + NEW membership: ${row.canonical_name} (${startYear}–${finishYear})`)
      stats.newImports++
    } else {
      // Existing membership — update selectively
      let changed = false
      const updates: Record<string, unknown> = {}

      if (membership.memberRole !== 'alumni' && membership.memberRole !== 'current_player') {
        updates.memberRole = 'alumni'
        changed = true
      }

      if (!membership.memberStatus) {
        updates.memberStatus = 'imported'
        changed = true
        stats.memberStatusSet++
      }

      if (!membership.classYearEstimate && classYearEstimate) {
        updates.classYearEstimate = classYearEstimate
        changed = true
        stats.classYearFilled++
      }

      if (!membership.hometown && row.hometown?.trim()) {
        updates.hometown = row.hometown.trim()
        changed = true
      }

      if (!membership.highSchool && row.high_school?.trim()) {
        updates.highSchool = row.high_school.trim()
        changed = true
      }

      if (!membership.publishedToNetwork) {
        updates.publishedToNetwork = true
        updates.publishedAt = now
        updates.publishedByRole = 'admin'
        changed = true
        stats.published++
      } else {
        stats.alreadyPublished++
      }

      if (changed) {
        updates.updatedAt = now
        if (APPLY) {
          const idx = store.teamMemberships.findIndex((m: { id: string }) => m.id === membership!.id)
          if (idx !== -1) {
            store.teamMemberships[idx] = { ...store.teamMemberships[idx], ...updates }
          }
        } else {
          console.log(`  ~ UPDATE ${row.canonical_name}: ${Object.keys(updates).join(', ')}`)
        }
      }
    }
  }

  console.log('\n── Summary ─────────────────────────')
  console.log(`Alumni rows processed:    ${stats.alumni}`)
  console.log(`Newly published:          ${stats.published}`)
  console.log(`Already published:        ${stats.alreadyPublished}`)
  console.log(`classYearEstimate added:  ${stats.classYearFilled}`)
  console.log(`memberStatus set:         ${stats.memberStatusSet}`)
  console.log(`New imports:              ${stats.newImports}`)
  console.log(`Skipped:                  ${stats.skipped}`)

  if (APPLY) {
    if (!store.profileClaimRequests) store.profileClaimRequests = []
    const backupPath = backup(JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')))
    console.log(`\nBackup: ${backupPath}`)
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    console.log('Store written.')
  } else {
    console.log('\nRun with --apply to write changes.')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
