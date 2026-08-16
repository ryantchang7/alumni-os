/**
 * Every internal link on the site, followed.
 *
 * Crawls each page as an approved member, collects every same-origin href,
 * then loads each one and records the status. Read-only: it follows links,
 * it never submits anything.
 *
 * A dead link is the single most embarrassing thing to ship, and the build
 * cannot catch one because most of these hrefs are built from data.
 *
 *   node scripts/test-links.mjs
 */

import { chromium } from 'playwright'
import { existsSync } from 'fs'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'

const SEEDS = [
  '/', '/launch', '/member-book', '/member-map', '/hall-of-fame', '/player',
  '/the-course', '/19th-hole', '/moments', '/career-room', '/team-room',
  '/team/updates', '/support', '/ask', '/chat', '/invite', '/spotlight',
  '/scotland', '/account/profile', '/login',
]

/** Links we deliberately do not follow. */
const SKIP = /^(mailto:|tel:|#)|\/api\/|\/auth\/|signout|logout/i

const browser = await chromium.launch()
const ctx = await browser.newContext(
  existsSync(AUTH) ? { storageState: AUTH } : {},
)
const page = await ctx.newPage()

// ── Collect ──────────────────────────────────────────────────────────────────
const found = new Map() // path -> first page that linked to it
console.log(`Collecting links from ${SEEDS.length} pages...`)
for (const seed of SEEDS) {
  try {
    await page.goto(B + seed, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(900)
  } catch {
    console.log(`  (could not load ${seed})`)
    continue
  }
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href') ?? ''),
  )
  for (const h of hrefs) {
    if (!h || SKIP.test(h)) continue
    let path = h
    if (h.startsWith('http')) {
      try {
        const u = new URL(h)
        if (u.host !== new URL(B).host) continue // external, not ours to vouch for
        path = u.pathname + u.search
      } catch { continue }
    }
    if (!path.startsWith('/')) continue
    if (!found.has(path)) found.set(path, seed)
  }
}
console.log(`  ${found.size} distinct internal links\n`)

// ── Follow ───────────────────────────────────────────────────────────────────
const broken = []
let checked = 0
for (const [path, from] of found) {
  let status = 0
  try {
    const res = await page.goto(B + path, { waitUntil: 'domcontentloaded', timeout: 45000 })
    status = res?.status() ?? 0
  } catch (e) {
    broken.push({ path, from, status: String(e).slice(0, 50) })
    continue
  }
  // A 200 that renders Next's not-found body is still a dead link.
  const notFound = await page.evaluate(() =>
    /404|could not be found|page not found/i.test(document.body?.innerText?.slice(0, 400) ?? ''),
  )
  if (status !== 200 || notFound) broken.push({ path, from, status: notFound ? '200 but 404 page' : status })
  checked++
  if (checked % 25 === 0) console.log(`  ...${checked}/${found.size}`)
}

await browser.close()

console.log('\n' + '='.repeat(70))
console.log(`  ${found.size - broken.length} links good, ${broken.length} broken`)
if (broken.length) {
  console.log('\nBROKEN:')
  for (const b of broken) console.log(`  ${b.status}  ${b.path}   (linked from ${b.from})`)
}
console.log('='.repeat(70))
process.exit(broken.length ? 1 : 0)
