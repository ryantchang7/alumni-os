/**
 * Frame-accurate 4K capture at the film's native 60fps.
 *
 * Playwright's recordVideo only samples at 25fps. Feeding 25fps clips into a
 * 60fps timeline means every source frame is held for 2 or 3 output frames in
 * an uneven 2-3-2-3 cadence — which is exactly what reads as judder on a long
 * scroll. No encoder setting fixes that; the frames simply don't exist.
 *
 * So we don't record. We drive the page one output frame at a time: set the
 * scroll offset and the cursor position from an eased timeline, screenshot,
 * repeat. Every frame is a real render at an exact position, so the motion is
 * mathematically smooth and the text stays razor sharp.
 *
 *   node scripts/capture-cinematic.mjs                 # all beats
 *   node scripts/capture-cinematic.mjs teamroom home   # just these
 *
 * Read-only against prod: it scrolls, moves a drawn cursor, and follows
 * links. It never submits a form or saves anything.
 */

import { chromium } from 'playwright'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { execFileSync } from 'child_process'

const OUT = '/Users/ryanchang/dev/penn-golf-clubhouse-video/public/clips'
const TMP = '/private/tmp/claude-501/-Users-ryanchang-dev-alumni-os/cd59b3a3-009a-4541-96b9-4983cfe2ffa0/scratchpad/frames'
const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'

const FPS = 60
const VIEW = { width: 3840, height: 2160 }
const Z = 2 // CSS zoom — page coordinates are half of device pixels

const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeOut = t => 1 - Math.pow(1 - t, 3)

// A gold ring cursor drawn into the page so we can place it per frame instead
// of relying on real mouse events (which only move between screenshots).
const CURSOR = `
(() => {
  if (document.getElementById('__cine_cursor')) return
  const c = document.createElement('div')
  c.id = '__cine_cursor'
  Object.assign(c.style, {
    position: 'fixed', left: '0px', top: '0px', width: '22px', height: '22px',
    marginLeft: '-11px', marginTop: '-11px', borderRadius: '50%',
    border: '2.5px solid #c8a84b', background: 'rgba(200,168,75,0.18)',
    boxShadow: '0 0 0 4px rgba(200,168,75,0.10)', zIndex: '2147483647',
    pointerEvents: 'none', opacity: '0', transition: 'none',
  })
  document.body.appendChild(c)
  window.__cine = {
    place(x, y, opacity, scale) {
      const el = document.getElementById('__cine_cursor')
      if (!el) return
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      el.style.opacity = String(opacity)
      el.style.transform = 'scale(' + scale + ')'
    },
  }
})()
`

/** Beats. Each is a list of moves rendered at exactly FPS. */
const BEATS = {
  // Home: ride the whole page, then reach for "Visit the Hall of Fame".
  home: {
    out: 'home-to-hof.mp4',
    start: '/player',
    // Paced to the narration: three stops down the page rather than one long
    // ride, so the eye lands on a section while it is being talked about.
    seconds: 20.0,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'scroll', frac: 0.35, s: 5.2 },
      { kind: 'hold', s: 1.5 },
      { kind: 'scroll', frac: 0.7, s: 4.6 },
      { kind: 'hold', s: 1.6 },
      { kind: 'scrollBottom', s: 3.4 },
      { kind: 'hold', s: 0.8 },
      { kind: 'reach', s: 1.5, text: /visit the hall of fame/i },
      // Pulse, don't click: the beat has to END on the home page or the next
      // beat cross-dissolves the Hall of Fame with itself.
      { kind: 'pulse', s: 0.4 },
      { kind: 'hold', s: 0.55 },
    ],
  },
  // Team Room: the long one — news, captains, roster, coaching staff, The
  // Season, then Ask the Team.
  teamroom: {
    out: 'teamroom.mp4',
    start: '/team-room',
    seconds: 24.6,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'scroll', frac: 0.4, s: 5.0 },
      { kind: 'hold', s: 1.6 },
      { kind: 'scroll', frac: 0.75, s: 4.4 },
      { kind: 'hold', s: 1.5 },
      { kind: 'scrollBottom', s: 3.6 },
      { kind: 'hold', s: 0.9 },
      { kind: 'reach', s: 1.5, role: 'link', name: /ask the team/i },
      { kind: 'click', s: 0.35 },
      { kind: 'navHold', s: 4.75 },
    ],
  },
  // Ryan's card: one clean ride down everything a member can fill in.
  profile: {
    out: 'profile.mp4',
    start: '/member-book/ryan-chang',
    seconds: 12.3,
    redactContact: true,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'scroll', to: 880, s: 9.0, cap: true },
      { kind: 'hold', s: 2.3 },
    ],
  },
  // Member Book: ride into the grid, search a name, open the card.
  memberbook: {
    out: 'memberbook.mp4',
    start: '/member-book',
    // Straight to the search. An earlier version rode deep into the grid and
    // came back up to fill a longer beat, which just looked like the camera
    // could not find what it wanted.
    seconds: 15.65,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'scroll', to: 380, s: 2.2 },
      { kind: 'hold', s: 0.8 },
      { kind: 'reach', s: 1.2, selector: '[aria-label="Search the Member Book"]' },
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'type', s: 2.0, text: 'Cohen' },
      { kind: 'hold', s: 1.2 },
      { kind: 'reach', s: 1.3, text: /adam s\.? cohen/i },
      { kind: 'click', s: 0.35 },
      { kind: 'navHold', s: 1.4 },
      { kind: 'scroll', to: 420, s: 2.4, cap: true },
      { kind: 'hold', s: 1.5 },
    ],
  },
  // Member Map: the hometowns toggle lights the country up, then two states
  // open their panels of real names. The state targets are SVG paths with no
  // text to aim at, so these are coordinates (CSS px in the zoomed page).
  map: {
    out: 'map.mp4',
    start: '/member-map',
    seconds: 15.2,
    moves: [
      { kind: 'hold', s: 0.8 },
      { kind: 'scroll', to: 340, s: 1.6 },
      { kind: 'reach', s: 1.1, text: /^hometowns$/i },
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'hold', s: 1.5 },
      { kind: 'moveTo', s: 1.0, x: 1038, y: 640 }, // Pennsylvania
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'hold', s: 2.5 },
      { kind: 'moveTo', s: 0.9, x: 775, y: 830 }, // Texas
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'hold', s: 4.9 },
    ],
  },
  // Chat: the list, then the thread with Ryan's dad. The whole exchange fits
  // on one screen — hold on it; scrolling drives the messages off the top.
  chat: {
    out: 'chat.mp4',
    start: '/chat',
    seconds: 9.2,
    moves: [
      { kind: 'hold', s: 0.9 },
      { kind: 'reach', s: 1.5, text: /raymond chang/i },
      { kind: 'click', s: 0.35 },
      { kind: 'navHold', s: 6.45 },
    ],
  },
  // Start a chat: pick two people — the page's own copy offers "a few for a
  // group chat". Never presses START CHAT.
  chatnew: {
    out: 'chat-new.mp4',
    start: '/chat/new',
    seconds: 9.0,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'reach', s: 1.4, text: /raymond chang/i },
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'hold', s: 1.0 },
      { kind: 'reach', s: 1.2, text: /wesley hu/i },
      { kind: 'click', s: 0.3, noNav: true },
      { kind: 'hold', s: 3.8 },
    ],
  },
  // Ryan's dad's card — the book is not only players.
  family: {
    out: 'family.mp4',
    start: '/player/alumni/12db62ee-eaea-4eb6-9bb9-9a2e1f7bec0e',
    seconds: 7.3,
    // Tighter crop on purpose: it holds on the name, "Penn Golf Family" and
    // "Parent of Ryan Chang C'28" and never reaches the CONTACT row, which
    // carries a real email and phone number.
    zoom: 3.1,
    moves: [
      { kind: 'hold', s: 1.8 },
      { kind: 'scroll', to: 120, s: 3.0 },
      { kind: 'hold', s: 2.5 },
    ],
  },
  // The Course: the round finder, then the whole Host a Round form.
  course: {
    out: 'course-flow.mp4',
    start: '/the-course',
    seconds: 30.8,
    moves: [
      { kind: 'hold', s: 1.0 },
      { kind: 'scroll', to: 900, s: 3.6 },
      { kind: 'hold', s: 2.0 },
      // Past the first round card into the rest of the board, so the tee
      // sheets read as a real list before the beat turns to hosting one.
      { kind: 'scroll', frac: 0.55, s: 3.2 },
      { kind: 'hold', s: 2.2 },
      { kind: 'scroll', to: 150, s: 2.6 },
      { kind: 'hold', s: 0.8 },
      { kind: 'reach', s: 1.3, selector: '[data-testid="host-a-round"]' },
      { kind: 'click', s: 0.35 },
      { kind: 'navHold', s: 1.6 },
      { kind: 'scroll', frac: 0.45, s: 4.0 },
      { kind: 'hold', s: 1.8 },
      { kind: 'scrollBottom', s: 4.6 },
      { kind: 'hold', s: 1.7 },
    ],
  },
}

async function shoot(page, dir, idx) {
  await page.evaluate(() => window.__redact?.()).catch(() => {})
  await page.screenshot({
    type: 'jpeg',
    quality: 94,
    path: `${dir}/f${String(idx).padStart(6, '0')}.jpg`,
  })
}

async function runBeat(browser, key) {
  const beat = BEATS[key]
  const dir = `${TMP}/${key}`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 1,
    storageState: AUTH,
  })
  const zoom = beat.zoom ?? Z
  await ctx.addInitScript(zoomLevel => {
    const z = () => {
      document.documentElement.style.zoom = String(zoomLevel)
    }
    if (document.readyState !== 'loading') z()
    else window.addEventListener('DOMContentLoaded', z)
  }, zoom)
  const page = await ctx.newPage()
  await page.goto(B + beat.start, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3500)

  if (beat.redactContact) {
    // Keep the CONTACT section on screen — it's part of what a card offers —
    // but blur the actual values. Re-applied after any scroll in case the page
    // re-renders.
    await page.addStyleTag({
      content: '.__redact{filter:blur(7px);-webkit-filter:blur(7px);user-select:none}',
    })
    await page.evaluate(() => {
      window.__redact = () => {
        const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/
        const PHONE = /(\+?\d[\d\s().-]{7,}\d)/
        for (const el of document.querySelectorAll('a,span,p,div,li')) {
          if (el.children.length > 0) continue
          const t = (el.textContent || '').trim()
          if (!t || t.length > 60) continue
          if (EMAIL.test(t) || PHONE.test(t)) el.classList.add('__redact')
        }
      }
      window.__redact()
    })
  }
  // Mount every lazy section before we start measuring heights.
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 180))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1200)
  await page.evaluate(CURSOR)

  let frame = 0
  let scrollY = 0
  // Cursor lives in CSS pixels; park it off to the side until it's needed.
  let cur = { x: VIEW.width / zoom - 120, y: VIEW.height / zoom - 140 }
  let target = null

  for (const move of beat.moves) {
    const n = Math.round(move.s * FPS)

    if (move.kind === 'hold' || move.kind === 'navHold') {
      for (let i = 0; i < n; i++) {
        await page.evaluate(
          ({ x, y, o }) => window.__cine?.place(x, y, o, 1),
          { x: cur.x, y: cur.y, o: move.kind === 'navHold' ? 0.55 : 0.55 },
        )
        await shoot(page, dir, frame++)
      }
      continue
    }

    if (move.kind === 'scrollBottom' || move.kind === 'scroll') {
      const max = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      )
      // With `cap`, never travel past the last thing that actually paints —
      // sparse cards are tall but mostly empty, and scrolling to the true
      // bottom parks the shot on white.
      const limit = move.cap
        ? await page.evaluate(() => {
            let bottom = 0
            const root = document.querySelector('main') ?? document.body
            for (const el of root.querySelectorAll('*')) {
              if (el.closest('footer')) continue
              const r = el.getBoundingClientRect()
              if (r.height < 6 || r.width < 40) continue
              if (!(el.textContent || '').trim() && el.tagName !== 'IMG') continue
              bottom = Math.max(bottom, r.bottom + window.scrollY)
            }
            return Math.max(0, Math.round(bottom) - window.innerHeight + 120)
          })
        : max
      const from = scrollY
      // `frac` targets a share of the page rather than a pixel row, which is
      // what you want for a pause partway down a page whose height you don't
      // know. `to` stays absolute for the shots that aim at a known element.
      const to =
        move.kind === 'scrollBottom'
          ? Math.min(max, limit)
          : move.frac !== undefined
            ? Math.min(Math.round(Math.min(max, limit) * move.frac), max, limit)
            : Math.min(move.to * zoom, max, limit)
      for (let i = 0; i < n; i++) {
        const y = from + (to - from) * easeInOut((i + 1) / n)
        await page.evaluate(
          ({ y, cx, cy }) => {
            window.scrollTo(0, y)
            window.__cine?.place(cx, cy, 0.55, 1)
          },
          { y, cx: cur.x, cy: cur.y },
        )
        await shoot(page, dir, frame++)
      }
      scrollY = to
      continue
    }

    if (move.kind === 'moveTo') {
      const from = { ...cur }
      for (let i = 0; i < n; i++) {
        const t = easeOut((i + 1) / n)
        const x = from.x + (move.x - from.x) * t
        const y = from.y + (move.y - from.y) * t
        await page.evaluate(({ x, y }) => window.__cine?.place(x, y, 0.95, 1), { x, y })
        await shoot(page, dir, frame++)
      }
      cur = { x: move.x, y: move.y }
      continue
    }

    if (move.kind === 'type') {
      // Type one character at a time, paced across the move so the text grows
      // at 60fps like everything else instead of jumping between screenshots.
      let typed = 0
      for (let i = 0; i < n; i++) {
        const want = Math.floor(((i + 1) / n) * move.text.length)
        while (typed < want) {
          await page.keyboard.type(move.text[typed])
          typed++
        }
        await page.evaluate(
          ({ x, y }) => window.__cine?.place(x, y, 0.95, 1),
          { x: cur.x, y: cur.y },
        )
        await shoot(page, dir, frame++)
      }
      continue
    }

    if (move.kind === 'reach') {
      const loc = move.selector
        ? page.locator(move.selector).first()
        : move.role
          ? page.getByRole(move.role, { name: move.name }).first()
          : page.getByText(move.text).first()
      await loc.scrollIntoViewIfNeeded().catch(() => {})
      await page.waitForTimeout(120)
      const box = await loc.boundingBox().catch(() => null)
      if (!box) {
        console.warn(`  ⚠️  ${key}: could not find the reach target — holding instead`)
        for (let i = 0; i < n; i++) await shoot(page, dir, frame++)
        continue
      }
      // boundingBox is in device px; the cursor is positioned in CSS px.
      target = { x: (box.x + box.width / 2) / zoom, y: (box.y + box.height / 2) / zoom }
      const from = { ...cur }
      for (let i = 0; i < n; i++) {
        const t = easeOut((i + 1) / n)
        const x = from.x + (target.x - from.x) * t
        const y = from.y + (target.y - from.y) * t
        await page.evaluate(({ x, y }) => window.__cine?.place(x, y, 0.95, 1), { x, y })
        await shoot(page, dir, frame++)
      }
      cur = target
      continue
    }

    if (move.kind === 'pulse') {
      // The press-in, without the click. Lets a beat end on the page it
      // started on while still reading as "and you tap this".
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n
        const scale = t < 0.5 ? 1 - t * 0.5 : 0.75 + (t - 0.5) * 0.9
        await page.evaluate(
          ({ x, y, s }) => window.__cine?.place(x, y, 0.95, s),
          { x: cur.x, y: cur.y, s: scale },
        )
        await shoot(page, dir, frame++)
      }
      continue
    }

    if (move.kind === 'click') {
      // A quick press-in on the ring, then follow the link for real.
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n
        const scale = t < 0.5 ? 1 - t * 0.5 : 0.75 + (t - 0.5) * 0.9
        await page.evaluate(
          ({ x, y, s }) => window.__cine?.place(x, y, 0.95, s),
          { x: cur.x, y: cur.y, s: scale },
        )
        await shoot(page, dir, frame++)
      }
      await page.mouse.click(cur.x * zoom, cur.y * zoom).catch(() => {})
      if (move.noNav) {
        // Focusing a field, not leaving the page — keep our scroll position.
        await page.waitForTimeout(200)
        continue
      }
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(900)
      await page.evaluate(CURSOR)
      scrollY = 0
      continue
    }
  }

  await ctx.close()

  const outPath = `${OUT}/${beat.out}`
  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    '-framerate', String(FPS),
    '-i', `${dir}/f%06d.jpg`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', String(FPS),
    outPath,
  ])
  rmSync(dir, { recursive: true, force: true })
  console.log(`  ✓ ${key}: ${frame} frames → ${beat.out} (${(frame / FPS).toFixed(2)}s @ ${FPS}fps)`)
}

const wanted = process.argv.slice(2)
const keys = wanted.length ? wanted.filter(k => BEATS[k]) : Object.keys(BEATS)
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })

const browser = await chromium.launch()
console.log(`Cinematic capture at ${FPS}fps →`, OUT, '\n')
for (const k of keys) {
  console.log(`• ${k}`)
  await runBeat(browser, k)
}
await browser.close()
console.log('\nDone.')
