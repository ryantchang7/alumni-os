/**
 * Export current store state back to a CSV master list.
 *
 * Usage:
 *   npm run export:penn-master    # writes data/exports/penn_master_export_TIMESTAMP.csv
 *
 * Columns match import schema so the CSV can be round-tripped through the import script.
 */

import * as fs from 'fs'
import * as path from 'path'
import xlsx from 'xlsx'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')
const EXPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'exports')
const PENN_GOLF_SLUG = 'penn-mens-golf'

async function main() {
  console.log('\n' + '─'.repeat(60))
  console.log('Penn Golf Master List Export')
  console.log('─'.repeat(60))

  if (!fs.existsSync(STORE_PATH)) {
    throw new Error(`Store not found: ${STORE_PATH}`)
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))

  const team = store.teams?.find((t: { slug: string }) => t.slug === PENN_GOLF_SLUG)
  if (!team) throw new Error(`Team '${PENN_GOLF_SLUG}' not found in store.`)

  const memberships: Record<string, unknown>[] = (store.teamMemberships ?? []).filter(
    (m: { teamId: string }) => m.teamId === team.id
  )
  const enrichments: Record<string, unknown>[] = store.personEnrichments ?? []
  const enrichByPersonId = new Map(enrichments.map((e: { personId: string }) => [e.personId, e]))
  const membershipByPersonId = new Map(memberships.map((m: { personId: string }) => [m.personId, m]))

  const rows = (store.people ?? []).map((p: {
    id: string
    canonicalName: string
    normalizedName: string
  }) => {
    const m = membershipByPersonId.get(p.id) as Record<string, unknown> | undefined
    const e = enrichByPersonId.get(p.id) as Record<string, unknown> | undefined
    const startYear = m?.rosterStartYear as number | undefined
    const endYear = m?.rosterEndYear as number | undefined
    const firstSeason = startYear ? `${startYear}-${String(startYear + 1).slice(2)}` : ''
    const lastSeason = endYear ? `${endYear - 1}-${String(endYear).slice(2)}` : ''
    return {
      canonical_name: p.canonicalName,
      normalized_name: p.normalizedName,
      first_season: firstSeason,
      last_season: lastSeason,
      latest_roster_class: m?.classLabel ?? '',
      hometown: m?.hometown ?? '',
      high_school: m?.highSchool ?? '',
      source_status: m ? 'source_backed' : 'needs_review',
      publish_to_clubhouse: m?.publishedToNetwork ? 'Yes' : 'No',
      visible_to_players: e?.visibleToPlayers === false ? 'No' : 'Yes',
      current_role: e?.currentRole ?? '',
      current_company: e?.currentCompany ?? '',
      city: e?.city ?? '',
      help_topics: Array.isArray(e?.helpTopics) ? (e.helpTopics as string[]).join(', ') : '',
      contact_preference: e?.contactPreference ?? '',
      manual_notes: e?.notes ?? '',
      source_urls: Array.isArray(m?.sourceUrls) ? (m.sourceUrls as string[]).join(', ') : '',
    }
  })

  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const outPath = path.join(EXPORTS_DIR, `penn_master_export_${ts}.csv`)

  const wb = xlsx.utils.book_new()
  const ws = xlsx.utils.json_to_sheet(rows)
  xlsx.utils.book_append_sheet(wb, ws, 'Master People')
  xlsx.writeFile(wb, outPath)

  console.log(`\nExported ${rows.length} people to: ${path.relative(PROJECT_ROOT, outPath)}`)
  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('Export failed:', err.message)
  process.exit(1)
})
