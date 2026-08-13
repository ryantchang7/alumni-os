/**
 * Launch smoke check. No live network calls; inspects files, routes,
 * and seed data to catch regressions before pushing to main.
 *
 * Run with: npm run test:launch-smoke
 *
 * Exits non-zero on any FAIL.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')

interface CheckResult {
  name: string
  pass: boolean
  detail?: string
}

const results: CheckResult[] = []
let failed = 0

function check(name: string, fn: () => boolean | string): void {
  try {
    const r = fn()
    if (r === true) {
      results.push({ name, pass: true })
    } else {
      results.push({ name, pass: false, detail: typeof r === 'string' ? r : 'check returned false' })
      failed++
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    results.push({ name, pass: false, detail: msg })
    failed++
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel))
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8')
}

// ── Pages exist ───────────────────────────────────────────────────────────
const REQUIRED_PAGES: Array<[string, string]> = [
  ['Landing', 'src/app/page.tsx'],
  ['/launch', 'src/app/launch/page.tsx'],
  ['/player', 'src/app/player/page.tsx'],
  ['/member-book', 'src/app/member-book/page.tsx'],
  ['/member-map', 'src/app/member-map/page.tsx'],
  ['/the-course', 'src/app/the-course/page.tsx'],
  ['/19th-hole', 'src/app/19th-hole/page.tsx'],
  ['/career-room', 'src/app/career-room/page.tsx'],
  ['/team-room', 'src/app/team-room/page.tsx'],
  ['/moments', 'src/app/moments/page.tsx'],
  ['/support', 'src/app/support/page.tsx'],
  ['/account/setup', 'src/app/account/setup/page.tsx'],
  ['/account/profile', 'src/app/account/profile/page.tsx'],
  ['/account/pending', 'src/app/account/pending/page.tsx'],
  ['/ask', 'src/app/ask/page.tsx'],
  ['/chat', 'src/app/chat/page.tsx'],
  ['/requests/new', 'src/app/requests/new/page.tsx'],
  ['/player/requests', 'src/app/player/requests/page.tsx'],
  ['/alumni/requests', 'src/app/alumni/requests/page.tsx'],
  ['/login', 'src/app/login/page.tsx'],
  ['/parent-signup', 'src/app/parent-signup/page.tsx'],
  ['/privacy', 'src/app/privacy/page.tsx'],
  ['/terms', 'src/app/terms/page.tsx'],
  ['/internal', 'src/app/internal/page.tsx'],
  ['/internal/claims', 'src/app/internal/claims/page.tsx'],
  ['/internal/studio', 'src/app/internal/studio/page.tsx'],
  ['/internal/launch-kit', 'src/app/internal/launch-kit/page.tsx'],
  ['/internal/launch-readiness', 'src/app/internal/launch-readiness/page.tsx'],
]
for (const [label, p] of REQUIRED_PAGES) {
  check(`page exists: ${label}`, () => (exists(p) ? true : `missing: ${p}`))
}

// ── Core API routes exist ─────────────────────────────────────────────────
const REQUIRED_APIS: Array<[string, string]> = [
  ['/api/auth/[...nextauth]', 'src/app/api/auth/[...nextauth]/route.ts'],
  ['/api/account/link-person', 'src/app/api/account/link-person/route.ts'],
  ['/api/open-requests', 'src/app/api/open-requests/route.ts'],
  ['/api/chat/conversations', 'src/app/api/chat/conversations/route.ts'],
  ['/api/upload/image', 'src/app/api/upload/image/route.ts'],
  ['/api/billing/checkout', 'src/app/api/billing/checkout/route.ts'],
  ['/api/billing/webhook', 'src/app/api/billing/webhook/route.ts'],
  ['/api/profile/claims', 'src/app/api/profile/claims/route.ts'],
  ['/api/internal/site-content', 'src/app/api/internal/site-content/route.ts'],
  ['/api/internal/launch-readiness/test-email', 'src/app/api/internal/launch-readiness/test-email/route.ts'],
  ['/api/internal/launch-readiness/persistence-test', 'src/app/api/internal/launch-readiness/persistence-test/route.ts'],
  ['/api/internal/launch-readiness/metrics', 'src/app/api/internal/launch-readiness/metrics/route.ts'],
]
for (const [label, p] of REQUIRED_APIS) {
  check(`api exists: ${label}`, () => (exists(p) ? true : `missing: ${p}`))
}

// ── Founder-only gates ────────────────────────────────────────────────────
const FOUNDER_PAGES = [
  'src/app/internal/page.tsx',
  'src/app/internal/claims/page.tsx',
  'src/app/internal/launch-kit/page.tsx',
  'src/app/internal/launch-kit/teleprompter/page.tsx',
  'src/app/internal/launch-readiness/page.tsx',
  'src/app/internal/studio/page.tsx',
  'src/app/internal/requirements/page.tsx',
  'src/app/internal/add-member/page.tsx',
  'src/app/internal/current-roster/page.tsx',
  'src/app/internal/gatherings/page.tsx',
  'src/app/internal/master-list/page.tsx',
]
for (const p of FOUNDER_PAGES) {
  check(`founder gate: ${p}`, () => {
    if (!exists(p)) return `missing: ${p}`
    const src = read(p)
    if (src.includes('requireFounderOr404') || src.includes('FOUNDER_EMAILS')) return true
    return `no founder gate detected in ${p}`
  })
}

const FOUNDER_APIS = [
  'src/app/api/internal/site-content/route.ts',
  'src/app/api/internal/roles/route.ts',
  'src/app/api/internal/current-roster/route.ts',
  'src/app/api/internal/add-member/route.ts',
  'src/app/api/internal/launch-readiness/test-email/route.ts',
  'src/app/api/internal/launch-readiness/persistence-test/route.ts',
  'src/app/api/internal/launch-readiness/metrics/route.ts',
  'src/app/api/profile/claims/route.ts',
  'src/app/api/profile/claims/[id]/status/route.ts',
]
for (const p of FOUNDER_APIS) {
  check(`founder api gate: ${p}`, () => {
    if (!exists(p)) return `missing: ${p}`
    const src = read(p)
    if (src.includes('requireFounder') || src.includes('FOUNDER_EMAILS')) return true
    return `no founder gate detected in ${p}`
  })
}

// ── Captain-only API gates (the May 2026 audit fixes) ─────────────────────
const CAPTAIN_APIS = [
  'src/app/api/network/publish/route.ts',
  'src/app/api/network/unpublish/route.ts',
  'src/app/api/alumni/enrichment/route.ts',
  'src/app/api/alumni/enrichment/sources/route.ts',
  'src/app/api/roster/promote/route.ts',
  'src/app/api/roster/reject/route.ts',
  'src/app/api/scrape/roster-run/route.ts',
  'src/app/api/scrape/historical/create-run/route.ts',
  'src/app/api/scrape/historical/run-season/route.ts',
  'src/app/api/scrape/historical/complete-run/route.ts',
  'src/app/api/scrape/historical/runs/route.ts',
  'src/app/api/debug/roster-extract/route.ts',
  'src/app/api/teams/route.ts',
  'src/app/api/discovery/preview/route.ts',
]
for (const p of CAPTAIN_APIS) {
  check(`captain/founder api gate: ${p}`, () => {
    if (!exists(p)) return `missing: ${p}`
    const src = read(p)
    if (src.includes('requireCaptain') || src.includes('requireFounder')) return true
    return `no captain/founder gate detected in ${p}`
  })
}

// ── Forbidden vocab in audience-facing pages ──────────────────────────────
const PUBLIC_PAGES = [
  'src/app/page.tsx',
  'src/app/launch/page.tsx',
  'src/app/player/page.tsx',
  'src/app/the-course/CourseHero.tsx',
  'src/app/support/SupportClient.tsx',
  'src/app/account/setup/AccountSetupClient.tsx',
]
const FORBIDDEN = [
  'networking platform',
  'engagement dashboard',
  'CRM',
  'pipeline',
  'growth engine',
  'growth funnel',
  'engagement metrics',
]
for (const p of PUBLIC_PAGES) {
  check(`no forbidden vocab in ${p}`, () => {
    if (!exists(p)) return `missing: ${p}`
    const src = read(p).toLowerCase()
    for (const w of FORBIDDEN) {
      if (src.includes(w.toLowerCase())) return `found "${w}" in ${p}`
    }
    return true
  })
}

// ── Support copy does not claim payment is required ───────────────────────
check('support copy does not require payment for access', () => {
  const src = read('src/app/support/SupportClient.tsx')
  const offenders = ['pay to join', 'pay to access', 'membership required', 'paid access']
  for (const w of offenders) {
    if (src.toLowerCase().includes(w)) return `found "${w}" in support copy`
  }
  return true
})

// ── Affirmative access vs support framing exists ─────────────────────────
check('approval-based, not paywalled framing exists somewhere public', () => {
  // The support page is where it matters: its tiers list "full access" as a
  // benefit, so without this line the Clubhouse reads as pay-to-enter.
  const targets = [
    'src/app/support/SupportClient.tsx',
    'src/app/launch/page.tsx',
    'src/app/terms/page.tsx',
  ]
  for (const t of targets) {
    if (exists(t) && read(t).toLowerCase().includes('approval-based, not paywalled')) return true
  }
  return 'no public page says "approval-based, not paywalled"'
})

// ── Seed data sanity ──────────────────────────────────────────────────────
check('Ryan Chang hometown is Brookline, Mass.', () => {
  const seed = read('data/alumni-os.json')
  return /Brookline,?\s+(Mass|MA)/i.test(seed)
    ? true
    : 'No Brookline / MA found in seed for Ryan Chang'
})

check('Owen Hayes appears as alumni in bootstrap members', () => {
  const src = read('src/lib/store/local-store.ts')
  // Look at the BOOTSTRAP_MEMBERS block specifically
  const m = src.match(/BOOTSTRAP_MEMBERS[\s\S]{0,2000}?Owen Hayes[\s\S]{0,300}?memberRole:\s*'([^']+)'/)
  if (!m) return 'Owen Hayes not in BOOTSTRAP_MEMBERS'
  return m[1] === 'alumni' ? true : `Owen Hayes memberRole = ${m[1]} (expected alumni)`
})

check('current roster (2026-27) has at least 6 current_player entries', () => {
  const seed = read('data/alumni-os.json')
  const matches = seed.match(/"memberRole":\s*"current_player"/g)
  const count = matches ? matches.length : 0
  return count >= 6 ? true : `only found ${count} current_player entries`
})

check('Member Book data file exists and is non-empty', () => {
  const rel = 'data/member-book/penn-mgolf-member-book.json'
  if (!exists(rel)) return `${rel} missing`
  const stat = fs.statSync(path.join(ROOT, rel))
  return stat.size > 1024 ? true : `member book too small: ${stat.size} bytes`
})

// ── Browser title / favicon are configured ────────────────────────────────
check('layout points the favicon at the Clubhouse mark', () => {
  const src = read('src/app/layout.tsx')
  if (!src.includes('favicon-32.png')) return 'no 32px favicon configured'
  if (!exists('public/favicon-32.png')) return 'favicon-32.png is missing from /public'
  // A larger PNG too, so retina tabs and bookmarks get the detail.
  return src.includes('icon-192.png') ? true : 'no larger PNG alongside the 32px favicon'
})

check('the apple touch icon exists so the home-screen tile is not blank', () => {
  const src = read('src/app/layout.tsx')
  if (!src.includes('/apple-icon-180.png')) return 'no apple touch icon configured'
  return exists('public/apple-icon-180.png') ? true : 'apple-icon-180.png is missing from /public'
})

check('default metadata title is "Penn Golf Clubhouse"', () => {
  const src = read('src/app/layout.tsx')
  return /default:\s*'Penn Golf Clubhouse'/.test(src) ? true : 'default title is not "Penn Golf Clubhouse"'
})

// ── Footer links Privacy + Terms ──────────────────────────────────────────
check('footer links to /privacy and /terms', () => {
  const src = read('src/components/ClubhouseFooter.tsx')
  return src.includes('/privacy') && src.includes('/terms')
    ? true
    : 'footer does not link both /privacy and /terms'
})

// ── Report ────────────────────────────────────────────────────────────────
console.log('')
console.log('Launch smoke check')
console.log('═'.repeat(60))
for (const r of results) {
  const icon = r.pass ? '✓' : '✗'
  const tag = r.pass ? 'PASS' : 'FAIL'
  console.log(`${icon} [${tag}] ${r.name}${r.detail ? `\n     ↳ ${r.detail}` : ''}`)
}
console.log('═'.repeat(60))
console.log(`${results.length - failed} / ${results.length} passed.`)
if (failed > 0) {
  console.log(`${failed} FAILED.`)
  process.exit(1)
}
console.log('All checks passed.')
process.exit(0)
