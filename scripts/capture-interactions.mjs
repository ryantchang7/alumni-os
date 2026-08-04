// Penn Golf Clubhouse — REAL interaction footage for the launch video.
// Records smooth scroll-throughs and genuine click-throughs (with a visible
// gold cursor + click pulse) so the video shows the product being *used*.
//
//   node scripts/capture-interactions.mjs            # all clips
//   node scripts/capture-interactions.mjs profile-edit course-host   # subset
//
// Read-only: navigates, scrolls, and clicks INTO forms/wizards, but never
// submits (never clicks Save/Post/Send) so nothing on the live site mutates.
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUTDIR = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/iclips'
const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const BASE = 'https://penngolfclubhouse.com'
// True-4K recording: 3840x2160 viewport with the document zoomed 2x — the
// layout computes exactly as at 1920 CSS px, but every pixel is retina.
// Playwright can't record above viewport size, so this is the only way.
const VIEW = { width: 3840, height: 2160 }
const Z = 2 // multiply FIXED pixel targets (scrollTo offsets, mouse coords)
mkdirSync(OUTDIR, { recursive: true })

// A gold cursor + click pulse, injected before every page's own scripts and
// re-attached on each navigation.
const CURSOR = () => {
  const install = () => {
    if (document.getElementById('__cur')) return
    const s = document.createElement('style')
    s.textContent =
      '#__cur{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2.5px solid rgba(200,168,75,.95);background:rgba(200,168,75,.16);box-shadow:0 0 14px rgba(200,168,75,.55);pointer-events:none;left:-100px;top:-100px;transition:transform .08s ease}' +
      '#__cur.dn{transform:scale(.72)}'
    document.documentElement.appendChild(s)
    const c = document.createElement('div')
    c.id = '__cur'
    document.body.appendChild(c)
    const move = (e) => {
      c.style.left = e.clientX + 'px'
      c.style.top = e.clientY + 'px'
    }
    document.addEventListener('mousemove', move, true)
    document.addEventListener('mousedown', (e) => {
      c.classList.add('dn')
      setTimeout(() => c.classList.remove('dn'), 220)
      const r = document.createElement('div')
      r.style.cssText =
        'position:fixed;z-index:2147483646;border-radius:50%;border:2px solid rgba(200,168,75,.8);pointer-events:none;width:12px;height:12px;margin:-6px 0 0 -6px;left:' +
        e.clientX + 'px;top:' + e.clientY + 'px'
      document.body.appendChild(r)
      r.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(5)', opacity: 0 }], {
        duration: 520,
        easing: 'ease-out',
      })
      setTimeout(() => r.remove(), 540)
    }, true)
  }
  if (document.body) install()
  else window.addEventListener('DOMContentLoaded', install)
}

async function settle(p, ms = 1400) {
  await p.waitForLoadState('networkidle').catch(() => {})
  await p.waitForTimeout(ms)
}

async function scrollTo(p, targetY, ms = 2200) {
  await p.evaluate(
    ({ targetY, ms }) =>
      new Promise((res) => {
        const startY = window.scrollY
        const dist = targetY - startY
        const t0 = performance.now()
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
        const step = (now) => {
          const t = Math.min(1, (now - t0) / ms)
          window.scrollTo(0, startY + dist * ease(t))
          if (t < 1) requestAnimationFrame(step)
          else res()
        }
        requestAnimationFrame(step)
      }),
    { targetY, ms }
  )
}

async function scrollBottom(p, ms = 4200) {
  const h = await p.evaluate(() => document.body.scrollHeight - window.innerHeight)
  await scrollTo(p, h, ms)
}

// glide the mouse to an element and click it (visible in the recording)
async function moveClick(p, locator, { pauseBefore = 500, pauseAfter = 300 } = {}) {
  const el = locator.first()
  if (!(await el.count())) return false
  await el.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(500)
  const box = await el.boundingBox()
  if (!box) return false
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 })
  await p.waitForTimeout(pauseBefore)
  await p.mouse.down()
  await p.waitForTimeout(90)
  await p.mouse.up()
  await p.waitForTimeout(pauseAfter)
  return true
}

const byTest = (p, id) => p.locator(`[data-testid="${id}"]`)

const CLIPS = [
  // ——— ASK 1: your profile — what a member can put ———
  {
    id: 'profile-card',
    start: '/member-book/ryan-chang',
    steps: async (p) => {
      await scrollTo(p, 260 * Z, 1400) // reveal badges + identity
      await p.waitForTimeout(900)
      await scrollBottom(p, 5200) // through class, clubhouse profile, interests, contact, golf
      await p.waitForTimeout(900)
    },
  },
  {
    id: 'profile-edit',
    start: '/member-book/ryan-chang',
    steps: async (p) => {
      await scrollBottom(p, 2600)
      await p.waitForTimeout(500)
      const clicked = await moveClick(p, byTest(p, 'member-detail-claim-cta'))
      if (!clicked) await moveClick(p, p.getByRole('link', { name: /update profile/i }))
      await p.waitForURL(/\/alumni\/profile\//, { timeout: 15000 }).catch(() => {})
      await settle(p, 1600)
      await scrollBottom(p, 7000) // the whole edit form: hometown → open-to → how I can help
      await p.waitForTimeout(700)
    },
  },
  // ——— ASK 2: scroll the site & click into things ———
  {
    id: 'clubhouse-scroll',
    start: '/player',
    steps: async (p) => {
      await p.waitForTimeout(700)
      await scrollBottom(p, 6500) // Your Era, activity, latest moment
      await p.waitForTimeout(700)
    },
  },
  {
    id: 'book-to-profile',
    start: '/member-book',
    steps: async (p) => {
      await scrollTo(p, 420, 1600)
      await p.waitForTimeout(700)
      const clicked = await moveClick(p, byTest(p, 'member-entry'))
      if (!clicked) await moveClick(p, p.getByText(/view member/i))
      await p.waitForURL(/\/member-book\/[^/]+$/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1400)
      await scrollTo(p, 300, 1600)
      await p.waitForTimeout(800)
    },
  },
  {
    id: 'course-host',
    start: '/the-course',
    steps: async (p) => {
      await scrollTo(p, 200, 1200)
      await moveClick(p, byTest(p, 'host-a-round'))
      await p.waitForURL(/\/the-course\/host/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1500)
      await scrollBottom(p, 4200) // the host form fields
      await p.waitForTimeout(700)
    },
  },
  {
    id: 'career-post',
    start: '/career-room',
    steps: async (p) => {
      await p.waitForTimeout(600)
      const clicked = await moveClick(p, byTest(p, 'post-career-cta'))
      if (!clicked) await moveClick(p, p.getByRole('link', { name: /post the first one|^post$/i }))
      await p.waitForURL(/\/career-room\/post/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1500)
      await scrollBottom(p, 3200)
      await p.waitForTimeout(700)
    },
  },
  {
    // home page: scroll ALL the way down, then click "Visit the Hall of Fame →"
    id: 'home-to-hof',
    start: '/player',
    steps: async (p) => {
      await scrollBottom(p, 6800)
      await p.waitForTimeout(700)
      const clicked = await moveClick(p, p.getByRole('link', { name: /visit the hall of fame/i }))
      if (!clicked) await moveClick(p, p.getByText(/visit the hall of fame/i))
      await p.waitForURL(/hall-of-fame/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1800)
    },
  },
  {
    // member book: use the search box, type "Adams", click into Hayden Adams
    id: 'book-adams',
    start: '/member-book',
    steps: async (p) => {
      await scrollTo(p, 380 * Z, 1500)
      await p.waitForTimeout(600)
      const search = p.locator('[aria-label="Search the Member Book"]').first()
      if (await search.count()) {
        await moveClick(p, search, { pauseAfter: 400 })
        await p.keyboard.type('Cohen', { delay: 130 })
        await p.waitForTimeout(1200)
      }
      const entry = p.getByText(/adam s\.? cohen/i).first()
      await moveClick(p, entry, { pauseAfter: 500 })
      await p.waitForURL(/member-book\/[^/]+$/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1400)
      await scrollTo(p, 360 * Z, 1800)
      await p.waitForTimeout(700)
    },
  },
  {
    // map: hometowns toggle → click PA then TX on the map itself (fixed coords
    // at scroll position 340) → member panels show the guys from each state
    id: 'map-states',
    start: '/member-map',
    steps: async (p) => {
      await scrollTo(p, 340 * Z, 1500)
      await p.waitForTimeout(800)
      const home = p.getByText(/^hometowns$/i).first()
      if (await home.count()) await moveClick(p, home, { pauseAfter: 1700 })
      for (const [x, y] of [[1038 * Z, 640 * Z], [775 * Z, 830 * Z]]) {
        await p.mouse.move(x, y, { steps: 30 })
        await p.waitForTimeout(450)
        await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up()
        await p.waitForTimeout(2300)
      }
      await p.waitForTimeout(400)
    },
  },
  {
    // course: click Find a Round → down to the example tee time → back up → Host a Round
    id: 'course-flow',
    start: '/the-course',
    steps: async (p) => {
      await p.waitForTimeout(600)
      const find = p.getByText(/find a round/i).first()
      if (await find.count()) await moveClick(p, find, { pauseAfter: 1200 })
      await scrollTo(p, 900 * Z, 2200) // the example tee time (Merion card)
      await p.waitForTimeout(1300)
      await scrollTo(p, 150 * Z, 1600) // back up to the banner
      await p.waitForTimeout(500)
      await moveClick(p, byTest(p, 'host-a-round'))
      await p.waitForURL(/the-course\/host/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1500)
      await scrollBottom(p, 4800) // the WHOLE host form, no cut
      await p.waitForTimeout(700)
    },
  },
  {
    // chat: the conversation list → open the thread with Ryan's dad. The old
    // Wesley thread was deleted; this is the real exchange we shot for.
    // Hold on the messages long enough to actually read them.
    id: 'chat-flow',
    start: '/chat',
    steps: async (p) => {
      await p.waitForTimeout(600)
      await moveClick(p, p.getByText(/raymond chang/i).first(), { pauseBefore: 350, pauseAfter: 900 })
      await p.waitForURL(/chat\/[a-f0-9-]+/, { timeout: 15000 }).catch(() => {})
      // The whole thread fits on one screen — hold on it and let it read.
      // Do NOT scroll: scrolling drives the messages off the top.
      await settle(p, 5200)
    },
  },
  {
    // group chat: the Start-a-chat modal — select dad + a teammate ("or a few
    // for a group chat" is the page's own copy). Never click START CHAT.
    id: 'chat-new',
    start: '/chat/new',
    steps: async (p) => {
      await settle(p, 1200)
      await moveClick(p, p.getByText(/raymond chang/i).first(), { pauseBefore: 800, pauseAfter: 1200 })
      await moveClick(p, p.getByText(/wesley hu/i).first(), { pauseBefore: 600, pauseAfter: 2200 })
      await p.waitForTimeout(600)
    },
  },
  {
    // team room: full scroll (updates, roster, schedule, alumni) → Ask the Team → modal
    id: 'teamroom-full',
    start: '/team-room',
    steps: async (p) => {
      await scrollBottom(p, 7000)
      await p.waitForTimeout(600)
      const banner = p.getByRole('link', { name: /ask the team/i }).first()
      const clicked = await moveClick(p, banner)
      if (!clicked) await moveClick(p, p.getByText(/ask the team/i).last())
      await p.waitForURL(/meet-the-team/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1200)
      const ask = p.getByRole('button', { name: /^ask/i }).first()
      if (await ask.count()) await moveClick(p, ask, { pauseAfter: 2000 })
      await p.waitForTimeout(600)
    },
  },
  {
    // map: scroll the filters+map into frame, then toggle views — no CSS zoom
    id: 'map-views',
    start: '/member-map',
    steps: async (p) => {
      await scrollTo(p, 340, 1600)
      await p.waitForTimeout(900)
      const home = p.getByText(/^hometowns$/i).first()
      if (await home.count()) await moveClick(p, home, { pauseAfter: 1600 })
      const fam = p.getByText(/family & affiliate/i).first()
      if (await fam.count()) await moveClick(p, fam, { pauseAfter: 1800 })
      await p.waitForTimeout(600)
    },
  },
  {
    id: 'ask-wizard',
    start: '/member-book/wesley-hu',
    steps: async (p) => {
      await scrollTo(p, 240, 1200)
      const clicked = await moveClick(p, byTest(p, 'member-detail-reach-out-cta'))
      if (!clicked) await moveClick(p, p.getByRole('link', { name: /send a request/i }))
      await p.waitForURL(/\/ask/, { timeout: 15000 }).catch(() => {})
      await settle(p, 1400)
      // pick a purpose chip to advance the wizard a step
      await moveClick(p, p.getByText(/career advice|warm intro|coffee chat/i))
      await p.waitForTimeout(1600)
    },
  },
]

const wanted = process.argv.slice(2)
const list = wanted.length ? CLIPS.filter((c) => wanted.includes(c.id)) : CLIPS

const browser = await chromium.launch()
console.log('Recording interaction clips →', OUTDIR, '\n')
for (const c of list) {
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 1,
    storageState: AUTH,
    recordVideo: { dir: OUTDIR, size: { width: 3840, height: 2160 } },
  })
  await ctx.addInitScript(() => {
    const z = () => { document.documentElement.style.zoom = '2' }
    if (document.readyState !== 'loading') z()
    else window.addEventListener('DOMContentLoaded', z)
  })
  await ctx.addInitScript(CURSOR)
  const p = await ctx.newPage()
  try {
    await p.goto(`${BASE}${c.start}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await settle(p, 1500)
    await c.steps(p)
  } catch (e) {
    console.warn(`  ⚠️  ${c.id}: ${e.message.slice(0, 80)}`)
  }
  const video = p.video()
  const finalUrl = p.url()
  await ctx.close() // finalizes webm
  const path = video ? await video.path() : '(none)'
  console.log(`  ✓ ${c.id}  ended at ${finalUrl}\n     → ${path}`)
}
await browser.close()
console.log('\nDone.')
