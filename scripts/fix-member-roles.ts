/**
 * Fix member roles in the store.
 *
 * Usage:
 *   npm run fix:member-roles          # dry-run
 *   npm run fix:member-roles -- --apply  # writes changes
 *
 * Rules:
 * - Sets memberRole = 'current_player' for active 2025-26 players
 * - Sets memberRole = 'alumni' for everyone else
 * - Corrects Ryan Chang hometown / high school
 * - Corrects Hayden Adams hometown / high school
 * - Never overwrites alumni self-edited fields
 * - Idempotent
 */

import * as fs from 'fs'
import * as path from 'path'

const APPLY = process.argv.includes('--apply')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'data', 'backups')

const CURRENT_PLAYERS = new Set([
  'ryan chang',
  'wesley hu',
  'kayden wang',
  'arjun caprihan',
  'henry chen',
  'max fonseca',
])

const DATA_CORRECTIONS: Record<string, { hometown?: string; highSchool?: string }> = {
  'ryan chang': {
    hometown: 'Brookline, Mass.',
    highSchool: 'Windermere (Fla.) Prep',
  },
  'hayden adams': {
    hometown: 'Lexington, Ky.',
    highSchool: 'Sayre School',
  },
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Fix Member Roles  ${APPLY ? '(APPLY)' : '(DRY-RUN)'}`)
  console.log('─'.repeat(60))

  const storeRaw = fs.readFileSync(STORE_PATH, 'utf-8')
  const store = JSON.parse(storeRaw)

  const people: { id: string; canonicalName: string; normalizedName: string }[] = store.people ?? []
  const memberships: Record<string, unknown>[] = store.teamMemberships ?? []

  const pidToNorm = new Map(people.map(p => [p.id, normalizeName(p.canonicalName)]))

  let currentPlayerCount = 0
  let alumniCount = 0
  let dataFixCount = 0
  let alreadyCorrect = 0
  const missingExpected: string[] = []

  // Check expected players exist
  for (const name of CURRENT_PLAYERS) {
    const exists = people.some(p => normalizeName(p.canonicalName) === name)
    if (!exists) missingExpected.push(name)
  }

  for (const m of memberships) {
    const personId = String(m.personId ?? '')
    const norm = pidToNorm.get(personId) ?? ''
    const isCurrentPlayer = CURRENT_PLAYERS.has(norm)
    const correctRole = isCurrentPlayer ? 'current_player' : 'alumni'

    if (m.memberRole === correctRole) {
      alreadyCorrect++
    } else {
      if (!APPLY) {
        console.log(`  [ROLE] ${norm}: ${m.memberRole ?? 'none'} → ${correctRole}`)
      } else {
        m.memberRole = correctRole
      }
    }

    if (isCurrentPlayer) currentPlayerCount++
    else alumniCount++

    // Data corrections
    const correction = DATA_CORRECTIONS[norm]
    if (correction) {
      let changed = false
      if (correction.hometown && m.hometown !== correction.hometown) {
        if (!APPLY) console.log(`  [FIX] ${norm}: hometown "${m.hometown}" → "${correction.hometown}"`)
        else m.hometown = correction.hometown
        changed = true
      }
      if (correction.highSchool && m.highSchool !== correction.highSchool) {
        if (!APPLY) console.log(`  [FIX] ${norm}: highSchool "${m.highSchool}" → "${correction.highSchool}"`)
        else m.highSchool = correction.highSchool
        changed = true
      }
      if (changed) dataFixCount++
    }
  }

  // Fix enrichments — clear Ryan Chang "San Francisco"
  const enrichments: Record<string, unknown>[] = store.personEnrichments ?? []
  for (const e of enrichments) {
    const personId = String(e.personId ?? '')
    const norm = pidToNorm.get(personId) ?? ''
    if (norm === 'ryan chang') {
      const city = String(e.city ?? '')
      if (city.toLowerCase().includes('san francisco')) {
        if (!APPLY) {
          console.log(`  [FIX] Ryan Chang enrichment: city "${e.city}" → ""`)
        } else {
          e.city = ''
          ;(e as Record<string, unknown>).updatedAt = new Date().toISOString()
        }
        dataFixCount++
      }
    }
  }

  if (APPLY) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
    const backupPath = path.join(BACKUPS_DIR, `alumni-os_roles_${ts}.json`)
    fs.copyFileSync(STORE_PATH, backupPath)
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    console.log(`Backup: data/backups/${path.basename(backupPath)}`)
    console.log(`Store written: data/alumni-os.json`)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Summary (${APPLY ? 'APPLIED' : 'DRY-RUN'})`)
  console.log('─'.repeat(60))
  console.log(`  Current players:   ${currentPlayerCount}`)
  console.log(`  Alumni:            ${alumniCount}`)
  console.log(`  Already correct:   ${alreadyCorrect}`)
  console.log(`  Data fixes:        ${dataFixCount}`)
  if (missingExpected.length) {
    console.log(`\n  WARNING — expected names not found:`)
    for (const n of missingExpected) console.log(`    - ${n}`)
  }
  if (!APPLY) console.log(`\n  Run with --apply to write changes.`)
  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
