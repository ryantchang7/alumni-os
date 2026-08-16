// Penn Golf Clubhouse — site capture for the launch video.
//
// Runs from ~/dev/alumni-os because Playwright + Chromium are already
// installed and verified here (zero new packages). Outputs land in the
// VIDEO project so Remotion can consume them.
//
//   Step 1 (you, once):   node scripts/capture-clubhouse.mjs --login
//       → opens a real Chrome window. Sign in with Google. When you're on
//         /player, come back to the terminal and press ENTER. Saves auth.json.
//   Step 2 (me, anytime): node scripts/capture-clubhouse.mjs
//       → uses auth.json, captures full-page 2x stills + interaction clips,
//         flags any page that loads short/empty.
//   Optional: --clips-only  or  --stills-only
//
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture'
const AUTH = `${OUT}/auth.json`
const BASE = 'https://penngolfclubhouse.com'
const VIEW = { width: 1920, height: 1080 }
const DSF = 2

mkdirSync(`${OUT}/clips`, { recursive: true })

const args = process.argv.slice(2)
const LOGIN = args.includes('--login')
const CLIPS_ONLY = args.includes('--clips-only')
const STILLS_ONLY = args.includes('--stills-only')

// Full-page stills. `waits` are selectors that MUST be present before we
// shoot, so we never grab a half-loaded page (map svg, GHIN chips, feeds).
const ROUTES = [
  { id: '01-player',       path: '/player',       waits: ['text=In the Clubhouse'], note: 'clubhouse photo header · Your Era · activity feed' },
  { id: '02-hall-of-fame', path: '/hall-of-fame', waits: ['text=/hall of fame/i'] },
  { id: '03-member-book',  path: '/member-book',  waits: ['[data-testid="member-book-title"]', '[data-testid="member-entry"]'] },
  { id: '04-member-map',   path: '/member-map',   waits: ['text=The Member Map', 'svg path'], note: 'US map svg must render' },
  { id: '05-the-course',   path: '/the-course',   waits: ['text=The Course'], softWaits: ['text=GHIN'], note: 'GHIN chip should be present' },
  { id: '06-19th-hole',    path: '/19th-hole',    waits: ['text=The 19th Hole'] },
  { id: '07-moments',      path: '/moments',      waits: ['text=Moments'] },
  { id: '08-career-room',  path: '/career-room',  waits: ['text=Career Room'] },
  { id: '09-team-room',    path: '/team-room',    waits: ['text=/team room/i'] },
  { id: '10-support',      path: '/support',      waits: ['text=Support Penn'], softWaits: ['text=Clubhouse merch is coming'], note: 'merch teaser at bottom' },
]

// Short scripted interaction clips (recorded as webm, converted later).
// Selectors are best-effort; first run will confirm/adjust them.
const CLIPS = [
  { id: 'map-toggles',  path: '/member-map', steps: async (p) => {
      for (const label of ['Current', 'Hometown', 'Family']) {
        const b = p.getByRole('button', { name: new RegExp(label, 'i') }).first()
        if (await b.count()) { await b.click().catch(() => {}); await p.waitForTimeout(1400) }
      }
    } },
  { id: 'moments-locker', path: '/moments', steps: async (p) => {
      const b = p.getByRole('link', { name: /locker room/i }).first()
      if (await b.count()) { await b.click().catch(() => {}); await p.waitForTimeout(1800) }
    } },
  { id: 'course-openreq', path: '/the-course', steps: async (p) => {
      await p.waitForTimeout(1200)
      const b = p.getByRole('link', { name: /post a request|host a round/i }).first()
      if (await b.count()) { await b.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(1400) }
    } },
  { id: 'ask-the-team', path: '/meet-the-team', steps: async (p) => {
      const b = p.getByRole('button', { name: /^ask/i }).first()
      if (await b.count()) { await b.click().catch(() => {}); await p.waitForTimeout(1800) }
    } },
]

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1200)
  // trigger lazy-loaded images by scrolling through, then return to top
  await page.evaluate(() => new Promise((res) => {
    let y = 0
    const t = setInterval(() => {
      window.scrollBy(0, 700); y += 700
      if (y >= document.body.scrollHeight) { clearInterval(t); window.scrollTo(0, 0); res() }
    }, 70)
  }))
  await page.waitForTimeout(900)
}

async function doLogin() {
  const b = await chromium.launch({ headless: false })
  const ctx = await b.newContext({ viewport: VIEW, deviceScaleFactor: DSF })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`)
  console.log('\n>>> Sign in with Google in the window. When you land on /player, press ENTER here.\n')
  await new Promise((r) => process.stdin.once('data', r))
  await ctx.storageState({ path: AUTH })
  console.log('Saved auth →', AUTH)
  await b.close()
}

async function doStills(ctx) {
  for (const r of ROUTES) {
    const p = await ctx.newPage()
    await p.goto(`${BASE}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    for (const w of r.waits) {
      try { await p.waitForSelector(w, { timeout: 15000 }) }
      catch { console.warn(`  ⚠️  ${r.id}: never saw "${w}"`) }
    }
    for (const w of (r.softWaits || [])) {
      try { await p.waitForSelector(w, { timeout: 6000 }) }
      catch { console.warn(`  ℹ️  ${r.id}: soft-missing "${w}" (may be empty data)`) }
    }
    await settle(p)
    const h = await p.evaluate(() => document.body.scrollHeight)
    if (h < 800) console.warn(`  🚩 FLAG ${r.id}: page only ${h}px tall — looks short/empty`)
    await p.screenshot({ path: `${OUT}/${r.id}.png`, fullPage: true })
    console.log(`  ✓ ${r.id}  (${h}px)${r.note ? '  — ' + r.note : ''}`)
    await p.close()
  }
}

async function doClips(browser) {
  for (const c of CLIPS) {
    const ctx = await browser.newContext({
      viewport: VIEW, deviceScaleFactor: DSF, storageState: AUTH,
      recordVideo: { dir: `${OUT}/clips`, size: VIEW },
    })
    const p = await ctx.newPage()
    await p.goto(`${BASE}${c.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await settle(p)
    try { await c.steps(p) } catch (e) { console.warn(`  ⚠️  clip ${c.id}: ${e.message.slice(0, 60)}`) }
    await p.waitForTimeout(600)
    const video = p.video()
    await ctx.close() // finalizes the webm
    if (video) { const path = await video.path(); console.log(`  ✓ clip ${c.id} → ${path}`) }
  }
}

const browser = await chromium.launch()
if (LOGIN) { await doLogin(); process.exit(0) }
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, storageState: AUTH })
console.log('Capturing Penn Golf Clubhouse …\n')
if (!CLIPS_ONLY) await doStills(ctx)
if (!STILLS_ONLY) await doClips(browser)
await browser.close()
console.log('\nDone. Assets in', OUT)
