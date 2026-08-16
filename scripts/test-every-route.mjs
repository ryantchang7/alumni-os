/**
 * Every route, as a signed-out visitor and as an approved member, on desktop
 * and phone. Read-only: it loads pages and reads the DOM, never submits.
 *
 * Catches the things a build cannot: a page that 500s only when signed in, an
 * image that 404s, a React error boundary, a link to nowhere.
 *
 *   node scripts/test-every-route.mjs
 */

import { chromium } from 'playwright'
import { existsSync } from 'fs'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'

/** [path, reachableWhenSignedOut] */
const ROUTES = [
  ['/', true], ['/launch', true], ['/login', true], ['/member-book', true],
  ['/member-map', true], ['/hall-of-fame', true], ['/player', true],
  ['/the-course', true], ['/the-course/host', true], ['/19th-hole', true],
  ['/19th-hole/host', true], ['/moments', true], ['/career-room', true],
  ['/team-room', true], ['/team/updates', true], ['/team/questions', true],
  ['/support', true], ['/ask', true], ['/chat', true], ['/chat/new', true],
  ['/account/setup', true], ['/account/profile', true], ['/parent-signup', true],
  ['/alumni/requests', true], ['/requests/new', true], ['/invite', true],
  ['/privacy', true], ['/terms', true], ['/community-guidelines', true],
  ['/subscription-terms', true], ['/suggest', true], ['/scotland', true],
  ['/spotlight', true], ['/moments/new', true],
]

const results = []
const note = (mode, route, label, cond, detail = '') =>
  results.push({ mode, route, label, ok: cond, detail })

async function sweep(browser, mode, storageState, viewport) {
  const ctx = await browser.newContext({
    viewport,
    ...(storageState ? { storageState } : {}),
  })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', m => {
    if (m.type() !== 'error') return
    const t = m.text()
    // Third-party noise we do not control and cannot fix.
    if (/favicon|Failed to load resource.*(google|gstatic|stripe|vercel-insights)/i.test(t)) return
    // Gated pages probe their own API and render the right door from the
    // status. The browser still logs the 401/403; that is the design working,
    // not an error.
    if (/Failed to load resource.*status of (401|403)/i.test(t)) return
    consoleErrors.push(t)
  })

  for (const [route] of ROUTES) {
    consoleErrors.length = 0
    let status = 0
    try {
      const res = await page.goto(B + route, { waitUntil: 'domcontentloaded', timeout: 45000 })
      status = res?.status() ?? 0
      await page.waitForTimeout(1200)
    } catch (e) {
      note(mode, route, 'loads', false, String(e).slice(0, 80))
      continue
    }

    note(mode, route, 'responds 200', status === 200, `${status}`)

    const dom = await page.evaluate(() => {
      const bodyText = document.body?.innerText ?? ''
      return {
        crashed: /Application error|Unhandled Runtime Error|client-side exception/i.test(bodyText),
        empty: bodyText.trim().length < 40,
        brokenImgs: [...document.querySelectorAll('img')]
          .filter(i => i.complete && i.naturalWidth === 0)
          .map(i => (i.currentSrc || i.src || '').split('/').pop())
          .slice(0, 4),
      }
    })
    note(mode, route, 'no error boundary', !dom.crashed)
    note(mode, route, 'renders content', !dom.empty)
    note(mode, route, 'no broken images', dom.brokenImgs.length === 0, dom.brokenImgs.join(','))
    note(mode, route, 'no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 70) ?? '')
  }
  await ctx.close()
}

const browser = await chromium.launch()
console.log(`Sweeping ${ROUTES.length} routes...\n`)

await sweep(browser, 'anon-desktop', null, { width: 1440, height: 900 })
console.log('  anon desktop done')
await sweep(browser, 'anon-phone', null, { width: 390, height: 844 })
console.log('  anon phone done')
if (existsSync(AUTH)) {
  await sweep(browser, 'member-desktop', AUTH, { width: 1440, height: 900 })
  console.log('  member desktop done')
  await sweep(browser, 'member-phone', AUTH, { width: 390, height: 844 })
  console.log('  member phone done')
} else {
  console.log('  (no saved session, skipping the signed-in passes)')
}
await browser.close()

const failed = results.filter(r => !r.ok)
const byMode = {}
for (const r of results) {
  byMode[r.mode] ??= { pass: 0, fail: 0 }
  byMode[r.mode][r.ok ? 'pass' : 'fail']++
}
console.log('\n' + '='.repeat(70))
for (const [m, c] of Object.entries(byMode)) {
  console.log(`  ${m.padEnd(16)} ${c.pass} passed, ${c.fail} failed`)
}
console.log(`  ${results.length} checks total, ${failed.length} failed`)
if (failed.length) {
  console.log('\nFAILURES:')
  for (const f of failed) console.log(`  [${f.mode}] ${f.route}  ${f.label}  ${f.detail}`)
}
console.log('='.repeat(70))
process.exit(failed.length ? 1 : 0)
