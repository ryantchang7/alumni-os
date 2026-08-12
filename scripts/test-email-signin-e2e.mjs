/**
 * Drives the email sign-in flow through a real browser against a local server.
 *
 * The one thing it cannot do is open an inbox, so it reads the link out of the
 * dev server log, which prints it only when no Resend key is configured. Every
 * other step is the real UI and the real routes.
 *
 *   node scripts/test-email-signin-e2e.mjs <path-to-dev.log>
 */

import { chromium } from 'playwright'
import { readFileSync } from 'fs'

const B = 'http://localhost:3100'
const LOG = process.argv[2]
const ADDR = `e2e-${Date.now()}@example.com`

const pass = []
const fail = []
const ok = (label, cond, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

try {
  // ── 1. The login page offers both doors ────────────────────────────────────
  console.log('1. The login page')
  await page.goto(B + '/login', { waitUntil: 'domcontentloaded' })
  ok('Google button is still there', await page.getByRole('button', { name: /Continue with Google/i }).isVisible())
  const emailToggle = page.getByRole('button', { name: /Use my email instead/i })
  ok('email option is offered', await emailToggle.isVisible())

  // ── 2. Ask for a link ──────────────────────────────────────────────────────
  console.log('\n2. Requesting a link')
  await emailToggle.click()
  await page.locator('#signin-email').fill(ADDR)
  await page.getByRole('button', { name: /Email me a sign-in link/i }).click()
  await page.waitForTimeout(2500)
  ok('confirms without saying whether the address is a member',
     await page.getByText(/Check your email/i).isVisible())

  // ── 3. Pull the link out of the dev log ────────────────────────────────────
  console.log('\n3. Redeeming the link')
  const log = readFileSync(LOG, 'utf8')
  const match = [...log.matchAll(/Link: (http:\/\/\S+)/g)].pop()
  const link = match?.[1]
  ok('a link was generated', !!link)
  if (!link) throw new Error('no link in the log')
  ok('link carries a token', /[?&]token=/.test(link))

  await page.goto(link, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)

  const session = await page.evaluate(async b => {
    const r = await fetch(b + '/api/auth/session')
    return r.json().catch(() => null)
  }, B)
  ok('signed in', !!session?.accountId, session?.user?.email ?? '')
  ok('session carries the right address', session?.user?.email === ADDR, String(session?.user?.email))

  // ── 4. The gate still holds ────────────────────────────────────────────────
  console.log('\n4. Signing in is not approval')
  ok('no linked person yet', !session?.linkedPersonId, String(session?.linkedPersonId))

  const gated = await page.evaluate(async b => {
    const r = await fetch(b + '/api/gatherings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'round', title: 'should not work', hostName: 'x',
        dateText: 'today', audience: 'both' }),
    })
    return { status: r.status }
  }, B)
  ok('cannot host a round while unapproved', gated.status === 403, `got ${gated.status}`)

  const members = await page.evaluate(async b => {
    const r = await fetch(b + '/api/gatherings?teamSlug=penn-mens-golf')
    const j = await r.json().catch(() => ({}))
    return (j.gatherings ?? []).length
  }, B)
  ok('member-only content stays empty', members === 0, `${members} gatherings visible`)

  // ── 5. The link is spent ───────────────────────────────────────────────────
  console.log('\n5. The link cannot be reused')
  const ctx2 = await browser.newContext()
  const p2 = await ctx2.newPage()
  await p2.goto(link, { waitUntil: 'domcontentloaded' })
  await p2.waitForTimeout(3000)
  ok('a second use is refused', await p2.getByText(/has expired/i).isVisible())
  const s2 = await p2.evaluate(async b => {
    const r = await fetch(b + '/api/auth/session')
    return r.json().catch(() => null)
  }, B)
  ok('and grants no session', !s2?.accountId)
  await ctx2.close()

  // ── 6. A junk token is refused ─────────────────────────────────────────────
  console.log('\n6. A forged token is refused')
  const ctx3 = await browser.newContext()
  const p3 = await ctx3.newPage()
  await p3.goto(B + '/login/link?token=totally-made-up-token', { waitUntil: 'domcontentloaded' })
  await p3.waitForTimeout(3000)
  ok('forged token is rejected', await p3.getByText(/has expired/i).isVisible())
  const s3 = await p3.evaluate(async b => {
    const r = await fetch(b + '/api/auth/session')
    return r.json().catch(() => null)
  }, B)
  ok('no session from a forged token', !s3?.accountId)
  await ctx3.close()
} finally {
  console.log('\n' + '='.repeat(60))
  console.log(`  ${pass.length} passed, ${fail.length} failed`)
  if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
  console.log('='.repeat(60))
  await browser.close()
}
process.exit(fail.length ? 1 : 0)
