/**
 * Fix 2026-27 Penn Golf current roster.
 *
 * Usage:
 *   npx tsx scripts/fix-2026-current-roster.ts          # dry-run
 *   npx tsx scripts/fix-2026-current-roster.ts --apply  # writes changes
 *
 * What this does:
 * - Sets exactly 9 current_player members for 2026-27
 * - Creates Oliver Uribe and Sean Curran if missing
 * - Sets Hayden Adams back to current_player (was incorrectly alumni)
 * - Sets Owen Hayes to alumni (was possibly current_player)
 * - Updates class labels to 2026-27 (Jr. → Sr., So. → Jr., Fr. → So., new Fr.)
 * - Publishes all 9 current players to Member Book
 * - Does NOT overwrite alumni self-edited enrichment fields
 * - Does NOT invent career data, companies, or emails
 * - Idempotent
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const APPLY = process.argv.includes('--apply')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'data', 'backups')
const TEAM_SLUG = 'penn-mens-golf'
const SOURCE_URL = 'https://pennathletics.com/sports/mens-golf/roster/2025-26'

function uuid() {
  return crypto.randomUUID()
}

function normName(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function firstName(full: string) {
  return full.split(' ')[0]
}

function lastName(full: string) {
  const parts = full.split(' ')
  return parts.slice(1).join(' ')
}

// 2026-27 canonical roster
// classLabel = what Penn Athletics uses (short form)
// classDisplay = what the UI shows (long form)
const CURRENT_ROSTER_2026 = [
  {
    canonicalName: 'Hayden Adams',
    classLabel: 'Sr.',
    classDisplay: 'Senior / Rising Senior',
    rosterStartYear: 2023,
    rosterEndYear: 2027,
    hometown: 'Lexington, Ky.',
    highSchool: 'Sayre School',
  },
  {
    canonicalName: 'Max Fonseca',
    classLabel: 'Sr.',
    classDisplay: 'Senior / Rising Senior',
    rosterStartYear: 2023,
    rosterEndYear: 2027,
    hometown: 'Miami, Fla.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Ryan Chang',
    classLabel: 'Jr.',
    classDisplay: 'Junior / Rising Junior',
    rosterStartYear: 2024,
    rosterEndYear: 2028,
    hometown: 'Brookline, Mass.',
    highSchool: 'Windermere (Fla.) Prep',
  },
  {
    canonicalName: 'Wesley Hu',
    classLabel: 'Jr.',
    classDisplay: 'Junior / Rising Junior',
    rosterStartYear: 2024,
    rosterEndYear: 2028,
    hometown: 'Suwanee, Ga.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Kayden Wang',
    classLabel: 'So.',
    classDisplay: 'Sophomore / Rising Sophomore',
    rosterStartYear: 2025,
    rosterEndYear: 2029,
    hometown: 'San Diego, Calif.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Arjun Caprihan',
    classLabel: 'So.',
    classDisplay: 'Sophomore / Rising Sophomore',
    rosterStartYear: 2025,
    rosterEndYear: 2029,
    hometown: 'Short Hills, N.J.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Henry Chen',
    classLabel: 'So.',
    classDisplay: 'Sophomore / Rising Sophomore',
    rosterStartYear: 2025,
    rosterEndYear: 2029,
    hometown: 'Hillsborough, Calif.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Oliver Uribe',
    classLabel: 'Fr.',
    classDisplay: 'Freshman / Rising Freshman',
    rosterStartYear: 2026,
    rosterEndYear: 2030,
    hometown: 'Scottsdale, Ariz.',
    highSchool: undefined,
  },
  {
    canonicalName: 'Sean Curran',
    classLabel: 'Fr.',
    classDisplay: 'Freshman / Rising Freshman',
    rosterStartYear: 2026,
    rosterEndYear: 2030,
    hometown: 'Newtown Square, Pa.',
    highSchool: undefined,
  },
]

const CURRENT_PLAYER_NORMS = new Set(CURRENT_ROSTER_2026.map(r => normName(r.canonicalName)))

// Alumni who should be set back to alumni if they were incorrectly flagged
const FORCE_ALUMNI_NORMS = new Set(['owen hayes'])

interface Store {
  teams: Array<{ id: string; slug: string; [k: string]: unknown }>
  people: Array<{ id: string; canonicalName: string; normalizedName: string; firstName?: string; lastName?: string; createdAt: string }>
  teamMemberships: Array<{
    id: string
    personId: string
    teamId: string
    memberRole?: string
    rosterStartYear?: number
    rosterEndYear?: number
    classLabel?: string
    classYearEstimate?: string
    hometown?: string
    highSchool?: string
    bioUrls: string[]
    sourceUrls: string[]
    confidence: number
    publishedToNetwork?: boolean
    publishedAt?: string
    publishedByRole?: string
    visibleToPlayers?: boolean
    createdAt: string
    updatedAt: string
  }>
  personEnrichments: Array<{
    id: string
    personId: string
    teamId: string
    alumniBio?: string
    helpTopics?: string[]
    contactPreference?: string
    availabilityLevel?: string
    openToGolfRounds?: boolean
    openToCoffee?: boolean
    openToMentorship?: boolean
    openToWarmIntroductions?: boolean
    favoritePennGolfMemory?: string
    favoriteCourses?: string
    visibleToPlayers?: boolean
    city?: string
    verificationStatus: string
    sourceUrls: string[]
    createdAt: string
    updatedAt: string
    [k: string]: unknown
  }>
  reviewItems: Array<{ id: string; [k: string]: unknown }>
  [k: string]: unknown
}

async function main() {
  console.log(`\n${'─'.repeat(64)}`)
  console.log(`Fix 2026-27 Penn Golf Current Roster  ${APPLY ? '(APPLY)' : '(DRY-RUN)'}`)
  console.log('─'.repeat(64))

  const raw = fs.readFileSync(STORE_PATH, 'utf-8')
  const store = JSON.parse(raw) as Store

  const team = store.teams.find(t => t.slug === TEAM_SLUG)
  if (!team) { console.error('Team not found:', TEAM_SLUG); process.exit(1) }

  const now = new Date().toISOString()
  const personByNorm = new Map(store.people.map(p => [normName(p.canonicalName), p]))
  const membershipByPersonId = new Map(store.teamMemberships.map(m => [m.personId, m]))

  let created = 0
  let rolesFixed = 0
  let classFixed = 0
  let hometownFixed = 0
  let publishFixed = 0

  // ── 1. Ensure all 9 current players exist as Person + Membership ────────
  for (const roster of CURRENT_ROSTER_2026) {
    const norm = normName(roster.canonicalName)
    let person = personByNorm.get(norm)

    if (!person) {
      // Create new person
      const newPerson = {
        id: uuid(),
        canonicalName: roster.canonicalName,
        normalizedName: norm,
        firstName: firstName(roster.canonicalName),
        lastName: lastName(roster.canonicalName),
        createdAt: now,
      }
      console.log(`  [CREATE PERSON] ${roster.canonicalName}`)
      if (APPLY) {
        store.people.push(newPerson)
        personByNorm.set(norm, newPerson)
      }
      person = newPerson
      created++
    }

    let membership = store.teamMemberships.find(m => m.personId === person!.id && m.teamId === team.id)

    if (!membership) {
      // Create new membership
      const newMembership = {
        id: uuid(),
        personId: person.id,
        teamId: team.id,
        memberRole: 'current_player',
        rosterStartYear: roster.rosterStartYear,
        rosterEndYear: roster.rosterEndYear,
        classLabel: roster.classLabel,
        classYearEstimate: roster.classDisplay,
        hometown: roster.hometown,
        highSchool: roster.highSchool,
        bioUrls: [],
        sourceUrls: [SOURCE_URL],
        confidence: 1.0,
        publishedToNetwork: true,
        publishedAt: now,
        publishedByRole: 'admin',
        createdAt: now,
        updatedAt: now,
      }
      console.log(`  [CREATE MEMBERSHIP] ${roster.canonicalName}`)
      if (APPLY) {
        store.teamMemberships.push(newMembership)
        membershipByPersonId.set(person.id, newMembership)
      }
      membership = newMembership
      created++
    } else {
      // Update existing membership
      const updates: string[] = []

      if (membership.memberRole !== 'current_player') {
        console.log(`  [ROLE] ${roster.canonicalName}: ${membership.memberRole} → current_player`)
        if (APPLY) membership.memberRole = 'current_player'
        rolesFixed++
        updates.push('role')
      }

      if (membership.classLabel !== roster.classLabel) {
        console.log(`  [CLASS] ${roster.canonicalName}: "${membership.classLabel}" → "${roster.classLabel}" (${roster.classDisplay})`)
        if (APPLY) {
          membership.classLabel = roster.classLabel
          membership.classYearEstimate = roster.classDisplay
        }
        classFixed++
        updates.push('class')
      } else if (membership.classYearEstimate !== roster.classDisplay) {
        console.log(`  [CLASS DISPLAY] ${roster.canonicalName}: "${membership.classYearEstimate}" → "${roster.classDisplay}"`)
        if (APPLY) membership.classYearEstimate = roster.classDisplay
        classFixed++
      }

      if (roster.hometown && membership.hometown !== roster.hometown) {
        console.log(`  [HOMETOWN] ${roster.canonicalName}: "${membership.hometown}" → "${roster.hometown}"`)
        if (APPLY) membership.hometown = roster.hometown
        hometownFixed++
        updates.push('hometown')
      }

      if (roster.highSchool && membership.highSchool !== roster.highSchool) {
        console.log(`  [HIGHSCHOOL] ${roster.canonicalName}: "${membership.highSchool}" → "${roster.highSchool}"`)
        if (APPLY) membership.highSchool = roster.highSchool
        hometownFixed++
      }

      if (!membership.publishedToNetwork) {
        console.log(`  [PUBLISH] ${roster.canonicalName}: publishedToNetwork → true`)
        if (APPLY) {
          membership.publishedToNetwork = true
          membership.publishedAt = now
          membership.publishedByRole = 'admin'
        }
        publishFixed++
        updates.push('publish')
      }

      if (APPLY && updates.length > 0) {
        membership.updatedAt = now
      }
    }

    // Ensure enrichment exists for current player (no career data invented)
    const enrichment = store.personEnrichments.find(
      e => e.personId === person!.id && e.teamId === team.id,
    )
    if (!enrichment && APPLY) {
      store.personEnrichments.push({
        id: uuid(),
        personId: person.id,
        teamId: team.id,
        verificationStatus: 'unverified',
        sourceUrls: [],
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // ── 2. Set non-roster people to alumni if they are incorrectly current_player ──
  for (const m of store.teamMemberships) {
    if (m.teamId !== team.id) continue
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const norm = normName(person.canonicalName)

    // Force specific people to alumni
    if (FORCE_ALUMNI_NORMS.has(norm) && m.memberRole !== 'alumni') {
      console.log(`  [ALUMNI] ${person.canonicalName}: ${m.memberRole} → alumni`)
      if (APPLY) { m.memberRole = 'alumni'; m.updatedAt = now }
      rolesFixed++
    }

    // Correct anyone marked current_player who is NOT on the 2026 roster
    if (m.memberRole === 'current_player' && !CURRENT_PLAYER_NORMS.has(norm)) {
      console.log(`  [ALUMNI CORRECTION] ${person.canonicalName}: current_player → alumni (not on 2026 roster)`)
      if (APPLY) { m.memberRole = 'alumni'; m.updatedAt = now }
      rolesFixed++
    }
  }

  // ── 3. Write store ──────────────────────────────────────────────────────
  if (APPLY) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
    const backupPath = path.join(BACKUPS_DIR, `alumni-os_2026roster_${ts}.json`)
    fs.copyFileSync(STORE_PATH, backupPath)
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    console.log(`\n  Backup: data/backups/${path.basename(backupPath)}`)
    console.log(`  Store written: data/alumni-os.json`)
  }

  // ── 4. Summary ──────────────────────────────────────────────────────────
  const finalMemberships = APPLY ? store.teamMemberships : store.teamMemberships
  const cpCount = finalMemberships.filter(m => m.teamId === team.id && m.memberRole === 'current_player').length
  const alumniCount = finalMemberships.filter(m => m.teamId === team.id && m.memberRole === 'alumni').length
  const publishedCP = finalMemberships.filter(m => m.teamId === team.id && m.memberRole === 'current_player' && m.publishedToNetwork).length

  console.log(`\n${'─'.repeat(64)}`)
  console.log(`Summary (${APPLY ? 'APPLIED' : 'DRY-RUN'})`)
  console.log('─'.repeat(64))
  console.log(`  Records created:       ${created}`)
  console.log(`  Roles fixed:           ${rolesFixed}`)
  console.log(`  Class labels fixed:    ${classFixed}`)
  console.log(`  Hometown/HS fixed:     ${hometownFixed}`)
  console.log(`  Publish flags fixed:   ${publishFixed}`)
  console.log(`  Current players (${APPLY ? 'after' : 'before'}): ${cpCount}`)
  console.log(`  Alumni (${APPLY ? 'after' : 'before'}):          ${alumniCount}`)
  console.log(`  Current players published: ${publishedCP}`)
  if (!APPLY) console.log(`\n  Run with --apply to write changes.`)
  console.log('─'.repeat(64))
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
