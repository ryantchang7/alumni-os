/**
 * Penn Golf Clubhouse — product correctness tests
 *
 * Usage: npx tsx scripts/test-clubhouse-product.ts
 *
 * Tests 16 invariants that must hold before any deploy.
 */

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
    }>
    personEnrichments: Array<{
      id: string
      personId: string
      city?: string
      verificationStatus?: string
      visibleToPlayers?: boolean
    }>
  }

  const CURRENT_PLAYER_NAMES = [
    'ryan chang', 'wesley hu', 'kayden wang',
    'arjun caprihan', 'henry chen', 'max fonseca',
  ]

  function normName(s: string) {
    return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  const personByNorm = new Map(people.map(p => [normName(p.canonicalName), p]))
  const membershipByPersonId = new Map(teamMemberships.map(m => [m.personId, m]))

  const results: TestResult[] = []

  // T1: All 6 current players exist
  results.push(test('T1: All 6 current players exist in store', () => {
    for (const name of CURRENT_PLAYER_NAMES) {
      assert(personByNorm.has(name), `Missing person: ${name}`)
    }
  }))

  // T2: All 6 current players have memberRole = current_player
  results.push(test('T2: 6 current players have memberRole=current_player', () => {
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

  // T4: No current_player has publishedToNetwork = true
  results.push(test('T4: No current player is published to network', () => {
    for (const name of CURRENT_PLAYER_NAMES) {
      const person = personByNorm.get(name)
      if (!person) continue
      const m = membershipByPersonId.get(person.id)
      if (!m) continue
      assert(
        m.publishedToNetwork !== true,
        `${name} has publishedToNetwork=true — current players must not appear in Member Book`,
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

  // T9: Hayden Adams memberRole = alumni
  results.push(test('T9: Hayden Adams has memberRole=alumni', () => {
    const person = personByNorm.get('hayden adams')
    assert(!!person, 'Hayden Adams not found')
    const m = membershipByPersonId.get(person.id)
    assert(!!m, 'Hayden Adams membership not found')
    assert(m.memberRole === 'alumni', `Hayden Adams memberRole=${m.memberRole}`)
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
          // Match: >...term...< on the same line, where no { or } or newline appears
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
    // Only actual emoji pictographs (not checkmarks, arrows, dashes)
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
