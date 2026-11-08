/**
 * Refresh the saved Playwright session, and nothing else.
 *
 * `test-host-flow.mjs` already does this, but only as the first step of a
 * run that then creates a round on production and messages its sheet. When
 * all you need is a session, that is far too much blast radius, so the
 * capture lives here on its own. This script only reads: it opens a
 * browser, waits for a human to sign in, saves the cookies, checks the
 * session is a linked member, and stops.
 *
 * The saved session is what lets an agent shell verify members-only
 * surfaces. Without it, every gated page answers with its own sign-in door
 * and a probe reports an empty or broken site that is fine. The last
 * session expired 2026-09-05 and three sessions of work went unverified
 * because of it.
 *
 *   node scripts/capture-auth.mjs
 *   node scripts/capture-auth.mjs --check     (report status, open nothing)
 */

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'
const CHECK_ONLY = process.argv.includes('--check')

/** Ask the site who it thinks we are, from inside the page so cookies apply. */
async function sessionIdentity(storageState) {
  const browser = await chromium.launch()
  try {
    const ctx = await browser.newContext(storageState ? { storageState } : {})
    const p = await ctx.newPage()
    await p.goto(B + '/player', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(1500)
    return await p.evaluate(async b => {
      const r = await fetch(b + '/api/auth/session')
      const j = await r.json().catch(() => ({}))
      return { email: j?.user?.email ?? null, linkedPersonId: j?.linkedPersonId ?? null }
    }, B)
  } finally {
    await browser.close()
  }
}

const existing = existsSync(AUTH) ? await sessionIdentity(AUTH) : null
if (existing?.linkedPersonId) {
  console.log(`Session is good: ${existing.email}`)
  process.exit(0)
}
console.log(existsSync(AUTH) ? 'Saved session is expired.' : 'No saved session.')
if (CHECK_ONLY) process.exit(1)

console.log('\n' + '='.repeat(62))
console.log('  A browser window is opening. Sign in with Google.')
console.log('  Nothing is typed, read or stored by this script except')
console.log('  the resulting session cookie.')
console.log('='.repeat(62) + '\n')

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await page.goto(B + '/login')

const deadline = Date.now() + 15 * 60 * 1000
let who = null
while (Date.now() < deadline) {
  await page.waitForTimeout(3000)
  try {
    who = await page.evaluate(async b => {
      const r = await fetch(b + '/api/auth/session')
      const j = await r.json().catch(() => ({}))
      return j?.linkedPersonId ? { email: j?.user?.email ?? null } : null
    }, B)
  } catch {
    /* mid-navigation, try again */
  }
  if (who) break
}

if (!who) {
  console.log('Timed out waiting for sign-in. Nothing was saved.')
  await browser.close()
  process.exit(1)
}

mkdirSync(dirname(AUTH), { recursive: true })
await ctx.storageState({ path: AUTH })
await browser.close()
console.log(`\nSigned in as ${who.email}. Session saved to ${AUTH}`)
