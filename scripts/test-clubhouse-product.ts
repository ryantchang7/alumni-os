/**
 * Penn Golf Clubhouse — product correctness tests
 *
 * Usage: npx tsx scripts/test-clubhouse-product.ts
 *
 * Tests invariants that must hold before any deploy.
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

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'alumni-os.json')

interface TestResult {
  name: string
  pass: boolean
  detail?: string
}

function test(name: string, fn: () => void): TestResult {
  try {
    fn()
    return { name, pass: true }
  } catch (err) {
    return { name, pass: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(msg)
}

async function main() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log('Penn Golf Clubhouse — Product Tests')
  console.log('─'.repeat(60))

  const raw = fs.readFileSync(STORE_PATH, 'utf-8')
  const store = JSON.parse(raw)

  const { people, teamMemberships, personEnrichments } = store as {
    people: Array<{ id: string; canonicalName: string; normalizedName: string }>
    teamMemberships: Array<{
      id: string
      personId: string
      teamId: string
      memberRole?: string
      publishedToNetwork?: boolean
      hometown?: string
      highSchool?: string
      classLabel?: string
      classYearEstimate?: string
      rosterEndYear?: number
    }>
    personEnrichments: Array<{
      id: string
      personId: string
      city?: string
      verificationStatus?: string
      visibleToPlayers?: boolean
    }>
  }

  // 2026-27 roster — all 9 current players
  const CURRENT_PLAYER_NAMES = [
    'hayden adams', 'max fonseca',
    'ryan chang', 'wesley hu',
    'kayden wang', 'arjun caprihan', 'henry chen',
    'oliver uribe', 'sean curran',
  ]

  function normName(s: string) {
    return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  const personByNorm = new Map(people.map(p => [normName(p.canonicalName), p]))
  const membershipByPersonId = new Map(teamMemberships.map(m => [m.personId, m]))

  const results: TestResult[] = []

  // T1: All 9 current players exist in store
  results.push(test('T1: All 9 current players (2026-27) exist in store', () => {
    for (const name of CURRENT_PLAYER_NAMES) {
      assert(personByNorm.has(name), `Missing person: ${name}`)
    }
  }))

  // T2: All 9 current players have memberRole = current_player
  results.push(test('T2: All 9 current players have memberRole=current_player', () => {
    for (const name of CURRENT_PLAYER_NAMES) {
      const person = personByNorm.get(name)
      assert(!!person, `Person not found: ${name}`)
      const m = membershipByPersonId.get(person.id)
      assert(!!m, `No membership for ${name}`)
      assert(
        m.memberRole === 'current_player',
        `${name} has memberRole=${m.memberRole}, expected current_player`,
      )
    }
  }))

  // T3: At least 50 alumni exist
  results.push(test('T3: At least 50 alumni in store', () => {
    const count = teamMemberships.filter(m => m.memberRole === 'alumni').length
    assert(count >= 50, `Only ${count} alumni found`)
  }))

  // T4: All 9 current players are published to network (Member Book)
  results.push(test('T4: All 9 current players are published to Member Book', () => {
    for (const name of CURRENT_PLAYER_NAMES) {
      const person = personByNorm.get(name)
      if (!person) continue
      const m = membershipByPersonId.get(person.id)
      if (!m) continue
      assert(
        m.publishedToNetwork === true,
        `${name} has publishedToNetwork=${m.publishedToNetwork} — current players must appear in Member Book`,
      )
    }
  }))

  // T5: Ryan Chang hometown is Brookline, Mass.
  results.push(test('T5: Ryan Chang hometown = Brookline, Mass.', () => {
    const person = personByNorm.get('ryan chang')
    assert(!!person, 'Ryan Chang not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Ryan Chang membership not found')
    assert(
      m.hometown === 'Brookline, Mass.',
      `Ryan Chang hometown is "${m.hometown}", expected "Brookline, Mass."`,
    )
  }))

  // T6: Ryan Chang highSchool is Windermere (Fla.) Prep
  results.push(test('T6: Ryan Chang highSchool = Windermere (Fla.) Prep', () => {
    const person = personByNorm.get('ryan chang')
    assert(!!person, 'Ryan Chang not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Ryan Chang membership not found')
    assert(
      m.highSchool === 'Windermere (Fla.) Prep',
      `Ryan Chang highSchool is "${m.highSchool}"`,
    )
  }))

  // T7: Ryan Chang enrichment city is NOT San Francisco
  results.push(test('T7: Ryan Chang enrichment city is not San Francisco', () => {
    const person = personByNorm.get('ryan chang')
    assert(!!person, 'Ryan Chang not found')
    const enr = personEnrichments.find(e => e.personId === person.id)
    if (enr) {
      const city = (enr.city ?? '').toLowerCase()
      assert(
        !city.includes('san francisco'),
        `Ryan Chang enrichment city is "${enr.city}" — should not be San Francisco`,
      )
    }
  }))

  // T8: Hayden Adams hometown is Lexington, Ky.
  results.push(test('T8: Hayden Adams hometown = Lexington, Ky.', () => {
    const person = personByNorm.get('hayden adams')
    assert(!!person, 'Hayden Adams not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Hayden Adams membership not found')
    assert(
      m.hometown === 'Lexington, Ky.',
      `Hayden Adams hometown is "${m.hometown}", expected "Lexington, Ky."`,
    )
  }))

  // T9: Hayden Adams memberRole = current_player (2026-27 roster)
  results.push(test('T9: Hayden Adams has memberRole=current_player (Senior 2026-27)', () => {
    const person = personByNorm.get('hayden adams')
    assert(!!person, 'Hayden Adams not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Hayden Adams membership not found')
    assert(m.memberRole === 'current_player', `Hayden Adams memberRole=${m.memberRole}`)
  }))

  // T10: All memberships have a memberRole set
  results.push(test('T10: All memberships have memberRole set', () => {
    const missing = teamMemberships.filter(m => !m.memberRole)
    assert(
      missing.length === 0,
      `${missing.length} memberships have no memberRole`,
    )
  }))

  // T11: No forbidden internal terms in source files
  results.push(test('T11: No forbidden internal terms in UI source files', () => {
    const FORBIDDEN = ['confidence', 'extraction', 'promoted', 'source_backed', 'manually_verified', 'scraper', 'pipeline', 'enrichment', 'CRM', 'leads']
    const UI_DIRS = ['src/app/player', 'src/app/career-room', 'src/app/the-course', 'src/app/19th-hole', 'src/app/events', 'src/app/member-map', 'src/app/team-room', 'src/app/alumni']
    const violations: string[] = []

    function scanDir(dirPath: string) {
      if (!fs.existsSync(dirPath)) return
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name)
        if (entry.isDirectory()) { scanDir(full); continue }
        if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue
        const content = fs.readFileSync(full, 'utf-8')
        for (const term of FORBIDDEN) {
          // Only flag if the term appears as literal visible text in JSX (not inside {} expressions)
          const jsxTextPattern = new RegExp(`>[^{}<\\n]*\\b${term}\\b[^{}<\\n]*<`, 'i')
          if (jsxTextPattern.test(content)) {
            violations.push(`${path.relative(PROJECT_ROOT, full)}: "${term}"`)
          }
        }
      }
    }

    for (const dir of UI_DIRS) {
      scanDir(path.join(PROJECT_ROOT, dir))
    }

    assert(violations.length === 0, `Forbidden terms in UI:\n  ${violations.join('\n  ')}`)
  }))

  // T12: store has at least 70 people
  results.push(test('T12: Store has at least 70 people', () => {
    assert(people.length >= 70, `Only ${people.length} people in store`)
  }))

  // T13: store has at least 60 memberships
  results.push(test('T13: Store has at least 60 team memberships', () => {
    assert(teamMemberships.length >= 60, `Only ${teamMemberships.length} memberships`)
  }))

  // T14: memberRole breakdown adds up to total memberships
  results.push(test('T14: current_player + alumni = total memberships', () => {
    const cp = teamMemberships.filter(m => m.memberRole === 'current_player').length
    const al = teamMemberships.filter(m => m.memberRole === 'alumni').length
    assert(
      cp + al === teamMemberships.length,
      `cp(${cp}) + alumni(${al}) = ${cp + al} but total is ${teamMemberships.length}`,
    )
  }))

  // T15: No emoji pictographs in player/alumni-facing UI files
  results.push(test('T15: No emoji pictographs in player/alumni-facing UI files', () => {
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u
    const PLAYER_DIRS = ['src/app/player', 'src/app/career-room', 'src/app/the-course', 'src/app/19th-hole', 'src/app/events', 'src/app/member-map', 'src/app/team-room', 'src/app/alumni']
    const violations: string[] = []

    function scanDir(dirPath: string) {
      if (!fs.existsSync(dirPath)) return
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name)
        if (entry.isDirectory()) { scanDir(full); continue }
        if (!entry.name.endsWith('.tsx')) continue
        const content = fs.readFileSync(full, 'utf-8')
        if (emojiPattern.test(content)) {
          violations.push(path.relative(PROJECT_ROOT, full))
        }
      }
    }

    for (const dir of PLAYER_DIRS) {
      scanDir(path.join(PROJECT_ROOT, dir))
    }

    assert(violations.length === 0, `Emoji pictographs found in player-facing UI:\n  ${violations.join('\n  ')}`)
  }))

  // T16: No local-store imports in client components
  results.push(test('T16: No local-store imports in client components', () => {
    const violations: string[] = []

    function scanDir(dirPath: string) {
      if (!fs.existsSync(dirPath)) return
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name)
        if (entry.isDirectory()) { scanDir(full); continue }
        if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue
        const content = fs.readFileSync(full, 'utf-8')
        const isClient = content.includes("'use client'") || content.includes('"use client"')
        if (isClient && /from ['"]@\/lib\/store\/local-store['"]/.test(content)) {
          violations.push(path.relative(PROJECT_ROOT, full))
        }
      }
    }

    scanDir(path.join(PROJECT_ROOT, 'src'))
    assert(violations.length === 0, `Client components importing local-store:\n  ${violations.join('\n  ')}`)
  }))

  // T17: Exactly 9 current players in store
  results.push(test('T17: Exactly 9 current_player memberships in store', () => {
    const count = teamMemberships.filter(m => m.memberRole === 'current_player').length
    assert(count === 9, `Expected 9 current players, found ${count}`)
  }))

  // T18: Owen Hayes is alumni (not current_player)
  results.push(test('T18: Owen Hayes has memberRole=alumni', () => {
    const person = personByNorm.get('owen hayes')
    assert(!!person, 'Owen Hayes not found in store')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Owen Hayes membership not found')
    assert(m.memberRole === 'alumni', `Owen Hayes memberRole=${m.memberRole}, expected alumni`)
  }))

  // T19: Oliver Uribe exists and hometown = Scottsdale, Ariz.
  results.push(test('T19: Oliver Uribe exists with hometown = Scottsdale, Ariz.', () => {
    const person = personByNorm.get('oliver uribe')
    assert(!!person, 'Oliver Uribe not found in store')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Oliver Uribe membership not found')
    assert(
      m.hometown === 'Scottsdale, Ariz.',
      `Oliver Uribe hometown is "${m.hometown}", expected "Scottsdale, Ariz."`,
    )
  }))

  // T20: Sean Curran exists and hometown = Newtown Square, Pa.
  results.push(test('T20: Sean Curran exists with hometown = Newtown Square, Pa.', () => {
    const person = personByNorm.get('sean curran')
    assert(!!person, 'Sean Curran not found in store')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Sean Curran membership not found')
    assert(
      m.hometown === 'Newtown Square, Pa.',
      `Sean Curran hometown is "${m.hometown}", expected "Newtown Square, Pa."`,
    )
  }))

  // T21: Ryan Chang classLabel = Jr. and classYearEstimate = Junior / Rising Junior
  results.push(test('T21: Ryan Chang classLabel=Jr. classYearEstimate=Junior / Rising Junior', () => {
    const person = personByNorm.get('ryan chang')
    assert(!!person, 'Ryan Chang not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Ryan Chang membership not found')
    assert(m.classLabel === 'Jr.', `Ryan Chang classLabel="${m.classLabel}", expected "Jr."`)
    assert(
      m.classYearEstimate === 'Junior / Rising Junior',
      `Ryan Chang classYearEstimate="${m.classYearEstimate}"`,
    )
  }))

  // T22: Hayden Adams classLabel = Sr. and classYearEstimate = Senior / Rising Senior
  results.push(test('T22: Hayden Adams classLabel=Sr. classYearEstimate=Senior / Rising Senior', () => {
    const person = personByNorm.get('hayden adams')
    assert(!!person, 'Hayden Adams not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Hayden Adams membership not found')
    assert(m.classLabel === 'Sr.', `Hayden Adams classLabel="${m.classLabel}", expected "Sr."`)
    assert(
      m.classYearEstimate === 'Senior / Rising Senior',
      `Hayden Adams classYearEstimate="${m.classYearEstimate}"`,
    )
  }))

  // T23: Oliver Uribe and Sean Curran are Freshmen
  results.push(test('T23: Oliver Uribe and Sean Curran classLabel=Fr.', () => {
    for (const name of ['oliver uribe', 'sean curran']) {
      const person = personByNorm.get(name)
      assert(!!person, `${name} not found`)
      const m = membershipByPersonId.get(person.id)
      assert(!!m, `${name} membership not found`)
      assert(m.classLabel === 'Fr.', `${name} classLabel="${m.classLabel}", expected "Fr."`)
    }
  }))

  // Results
  console.log()
  let passed = 0
  let failed = 0
  for (const r of results) {
    if (r.pass) {
      console.log(`  PASS  ${r.name}`)
      passed++
    } else {
      console.log(`  FAIL  ${r.name}`)
      if (r.detail) console.log(`        ${r.detail}`)
      failed++
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${passed} passed, ${failed} failed`)
  console.log('─'.repeat(60))

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
