/**
 * The controls a member actually touches, driven for real.
 *
 * Loading a page proves it renders. This proves the things on it WORK: search
 * narrows the list, filters filter, tabs switch, forms are fillable, the RSVP
 * button is really a button.
 *
 * Read-only by design. It types, clicks tabs and opens things, but it never
 * submits a form, never posts, never sends. Anything that would write is
 * verified by asserting the control exists and is enabled, not by pressing it.
 *
 *   node scripts/test-interactions.mjs
 */

import { chromium } from 'playwright'
import { existsSync } from 'fs'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'

const pass = []
const fail = []
const ok = (label, cond, detail = '') => {
  ;(cond ? pass : fail).push(`${label}${detail ? '  ' + detail : ''}`)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

if (!existsSync(AUTH)) {
  console.log('No saved session; run scripts/test-host-flow.mjs first.')
  process.exit(1)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const go = async path => {
  await page.goto(B + path, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1600)
}
/**
 * How many member cards are in the list right now.
 *
 * The signed-in header has its own /member-book/ link (your profile chip), and
 * it survives every search, so counting raw anchors never reaches zero.
 */
const countCards = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('a[href^="/member-book/"]')]
      .filter(a => !a.closest('header, nav, [class*="Header"], [class*="header"]')).length)

try {
  // ── Member Book: search must narrow ────────────────────────────────────────
  console.log('1. Member Book search')
  await go('/member-book')
  const allCards = await countCards()
  ok('the book lists members', allCards > 50, `${allCards} cards`)

  const search = page.locator('input[type="search"], input[placeholder*="earch" i]').first()
  ok('there is a search box', await search.count() > 0)
  if (await search.count()) {
    await search.fill('Cohen')
    await page.waitForTimeout(1200)
    const narrowed = await countCards()
    ok('typing a name narrows the list', narrowed > 0 && narrowed < allCards, `${allCards} → ${narrowed}`)

    await search.fill('zzzzqqqq')
    await page.waitForTimeout(1200)
    const emptyMsg = await page.evaluate(() =>
      /\b0 players\b|no (one|members|results|matches)/i.test(document.body.innerText))
    ok('a nonsense search reports nothing found rather than breaking', emptyMsg)

    await search.fill('')
    await page.waitForTimeout(1200)
    ok('clearing brings everyone back', (await countCards()) === allCards)
  }

  // ── Career Room: filters ───────────────────────────────────────────────────
  console.log('\n2. Career Room filters')
  await go('/career-room')
  await page.evaluate(() => window.scrollTo(0, 700))
  await page.waitForTimeout(1800)
  // Industries are links that read "Finance 3 members", one per field.
  const fields = await page.evaluate(() =>
    [...document.querySelectorAll('a')]
      .map(a => a.innerText.replace(/\s+/g, ' ').trim())
      .filter(t => /\d+\s+members?/i.test(t))
      .map(t => ({ label: t, n: Number(t.match(/(\d+)\s+members?/i)[1]) })),
  )
  ok('industries render with counts', fields.length > 3, `${fields.length} industries`)
  // The bug fixed last week: every count read zero.
  ok('no industry reads zero members',
     fields.length > 0 && fields.every(f => f.n > 0),
     fields.slice(0, 3).map(f => f.label).join(' / '))

  const firstField = page.locator('a').filter({ hasText: /\d+ members?/i }).first()
  if (await firstField.count()) {
    const label = (await firstField.innerText()).replace(/\s+/g, ' ').trim()
    await firstField.click()
    await page.waitForTimeout(2000)
    const landed = await countCards()
    ok(`opening "${label.slice(0, 22)}" shows those members`, landed > 0, `${landed} cards`)
  }

  // ── The Course: rounds and their controls ──────────────────────────────────
  console.log('\n3. The Course')
  await go('/the-course')
  const rounds = await page.evaluate(() => document.body.innerText.match(/Preseason Trip/gi)?.length ?? 0)
  ok('the real Boston rounds are on the board', rounds >= 2, `${rounds} mentions`)
  // Ryan hosts every round on the board today, so the tee sheet shows him the
  // host controls rather than an RSVP button. Either one proves it is live.
  const attend = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .map(b => b.innerText.trim())
      .filter(t => /count me in|i'?m in|rsvp|join|remove|add (a )?player/i.test(t)).length)
  ok('rounds carry working attendance controls', attend > 0, `${attend} controls`)
  const cal = await page.locator('a, button').filter({ hasText: /apple|outlook|calendar/i }).count()
  ok('a round can be added to a calendar', cal > 0)
  const detail = await page.locator('a[href^="/gatherings/"]').first()
  ok('a round opens its own page', await detail.count() > 0)
  const hostLink = await page.locator('a[href="/the-course/host"]').count()
  ok('there is a way to host a round', hostLink > 0)

  // ── Host form: every field a host needs ────────────────────────────────────
  console.log('\n4. Host a round form')
  await go('/the-course/host')
  const hostForm = await page.evaluate(() => ({
    inputs: document.querySelectorAll('input, textarea, select').length,
    submit: [...document.querySelectorAll('button')].some(b => /post|share|publish/i.test(b.innerText)),
  }))
  ok('the form has its fields', hostForm.inputs >= 5, `${hostForm.inputs} inputs`)
  ok('the form has a post button', hostForm.submit)

  const titleBox = page.locator('input').first()
  await titleBox.fill('Typing test, never submitted')
  ok('fields accept typing', (await titleBox.inputValue()).includes('Typing test'))

  // The notify choice shipped this week; it must be on the page and switchable.
  const notify = await page.evaluate(() =>
    /nearby|invite specific|don'?t notify|quiet/i.test(document.body.innerText))
  ok('the notify choice is on the form', notify)
  const inviteBtn = page.locator('button, label', { hasText: /invite specific people/i }).first()
  if (await inviteBtn.count()) {
    await inviteBtn.click()
    await page.waitForTimeout(900)
    const picker = await page.evaluate(() =>
      document.querySelectorAll('input[type="checkbox"], [role="checkbox"], button[aria-pressed]').length)
    ok('choosing invite reveals a people picker', picker > 0, `${picker} choosable`)
  }

  // ── 19th Hole ──────────────────────────────────────────────────────────────
  console.log('\n5. The 19th Hole')
  await go('/19th-hole')
  const maps = await page.evaluate(() => document.querySelectorAll('iframe').length)
  const emptyBoxes = await page.evaluate(() =>
    [...document.querySelectorAll('iframe')].filter(f => f.clientHeight < 20).length)
  ok('cards render their maps', maps > 0, `${maps} maps`)
  ok('no card shows an empty map box', emptyBoxes === 0, `${emptyBoxes} empty`)

  await go('/19th-hole/host')
  ok('the 19th Hole host form has the notify choice too',
     await page.evaluate(() => /nearby|invite specific|don'?t notify|quiet/i.test(document.body.innerText)))

  // ── Ask / chat composer ────────────────────────────────────────────────────
  console.log('\n6. Ask and chat')
  await go('/ask')
  // /ask is the guided request: pick what you need, then it drafts the note.
  const kinds = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .map(b => b.innerText.replace(/\s+/g, ' ').trim())
      .filter(t => /career advice|interview prep|resume|referral|warm intro|coffee chat/i.test(t)))
  ok('the request types are offered', kinds.length >= 5, `${kinds.length} kinds`)
  const firstKind = page.locator('button').filter({ hasText: /career advice/i }).first()
  if (await firstKind.count()) {
    // Continue may be on the page from the start, but it must not be usable
    // until a purpose is chosen.
    const contBtn = () => page.locator('button').filter({ hasText: /continue/i }).last()
    const liveBefore = (await contBtn().count()) > 0 && !(await contBtn().isDisabled())
    ok('Continue is not usable before a purpose is picked', !liveBefore)

    await firstKind.click()
    await page.waitForTimeout(1400)
    const cont = contBtn()
    ok('picking a purpose enables Continue',
       (await cont.count()) > 0 && !(await cont.isDisabled()))

    await cont.click()
    await page.waitForTimeout(2000)
    const step2 = await page.evaluate(() => ({
      inputs: document.querySelectorAll('input, textarea').length,
      onContext: /what.{0,3}s the situation|context/i.test(document.body.innerText),
    }))
    ok('Continue opens step 2', step2.onContext && step2.inputs > 0, `${step2.inputs} inputs`)
    // Step 2 must not let you through empty, or the alum gets a blank note.
    const gated = await page.locator('button').filter({ hasText: /continue/i }).last().isDisabled()
    ok('step 2 will not continue while empty', gated)
  }

  await go('/chat')
  ok('the chat room lists conversations or offers a new one',
     await page.evaluate(() => /new (chat|conversation|message)|start a/i.test(document.body.innerText)))

  // ── Map ────────────────────────────────────────────────────────────────────
  console.log('\n7. Member Map')
  await go('/member-map')
  await page.waitForTimeout(2500)
  // Nav icons are svgs as well, so measure the biggest thing on the page.
  const mapH = await page.evaluate(() =>
    Math.max(0, ...[...document.querySelectorAll('canvas, svg, .leaflet-container, iframe')]
      .map(c => c.clientHeight)))
  ok('the map paints', mapH > 300, `${mapH}px tall`)
  const toggles = await page.locator('button').filter({ hasText: /hometowns|where they are now/i }).count()
  ok('you can switch hometowns and where they are now', toggles >= 2, `${toggles} toggles`)
  const places = await page.evaluate(() => /pennsylvania|new york|texas|california/i.test(document.body.innerText))
  ok('places are labelled', places)

  // ── Moments ────────────────────────────────────────────────────────────────
  console.log('\n8. Moments')
  await go('/moments')
  const photos = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 200).length)
  ok('moments show photos', photos > 0, `${photos} images`)
  const locker = await page.evaluate(() => /locker room/i.test(document.body.innerText))
  ok('the Locker Room is visible as a place', locker)

  // ── Profile ────────────────────────────────────────────────────────────────
  console.log('\n9. Your card')
  await go('/account/profile')
  const manage = page.locator('a').filter({ hasText: /manage profile/i }).first()
  ok('the hub offers Manage profile', await manage.count() > 0)
  ok('the hub links to your Member Book card',
     await page.locator('a[href^="/member-book/"]').count() > 0)
  ok('the hub links to your inbox', await page.locator('a[href="/alumni/requests"]').count() > 0)

  if (await manage.count()) {
    await manage.click()
    await page.waitForTimeout(2600)
    const editable = await page.evaluate(() => document.querySelectorAll('input, textarea, select').length)
    ok('Manage profile opens an editable card', editable >= 3, `${editable} fields`)
    const saveBtn = await page.locator('button').filter({ hasText: /save|update/i }).count()
    ok('there is a save button', saveBtn > 0)
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('\n10. The front door')
  const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const lp = await anon.newPage()
  await lp.goto(B + '/login', { waitUntil: 'domcontentloaded' })
  await lp.waitForTimeout(1500)
  ok('Google sign-in is offered',
     await lp.locator('button, a').filter({ hasText: /google/i }).count() > 0)
  // Email sign-in sits behind a toggle so Google stays the obvious first choice.
  const useEmail = lp.locator('button, a').filter({ hasText: /use my email/i }).first()
  ok('email sign-in is offered as an alternative', await useEmail.count() > 0)
  if (await useEmail.count()) {
    await useEmail.click()
    await lp.waitForTimeout(1400)
    const emailIn = lp.locator('input[type="email"], input[name="email"], input[type="text"]').first()
    ok('choosing email reveals the box', await emailIn.count() > 0)
    if (await emailIn.count()) {
      await emailIn.fill('someone@example.com')
      ok('the email box takes an address', (await emailIn.inputValue()).includes('@'))
      ok('there is a send-link button',
         await lp.locator('button').filter({ hasText: /link|email|continue|send/i }).count() > 0)
    }
  }
  await anon.close()
} finally {
  await browser.close()
  console.log('\n' + '='.repeat(70))
  console.log(`  ${pass.length} passed, ${fail.length} failed`)
  if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
  console.log('='.repeat(70))
}
process.exit(fail.length ? 1 : 0)
