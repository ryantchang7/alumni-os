/**
 * End-to-end test of the hosting flow, driven start to finish.
 *
 * Opens a browser for Google sign-in (the one step that needs a human), waits
 * for the session, saves it, then exercises every host capability against the
 * live site and cleans up after itself.
 *
 * Blast radius is deliberately zero: it creates its own throwaway round and
 * puts ONLY Ryan on the sheet, so the "message the sheet" step emails nobody
 * else. The real Boston rounds are read for comparison but never modified.
 *
 *   node scripts/test-host-flow.mjs
 */

import { chromium } from 'playwright'
import { existsSync } from 'fs'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'
const RYAN_PERSON_ID = '4a41af96-b5f4-455d-8d94-55a52efa6ad8'

const pass = []
const fail = []
const ok = (label, cond, detail = '') => {
  ;(cond ? pass : fail).push(`${label}${detail ? '  ' + detail : ''}`)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

/** Call the site's own API from inside the page so cookies apply. */
const api = (page, path, init) =>
  page.evaluate(
    async ({ b, path, init }) => {
      const res = await fetch(b + path, init)
      let body = null
      try { body = await res.json() } catch { body = null }
      return { status: res.status, body }
    },
    { b: B, path, init },
  )

const J = (method, payload) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

async function ensureSession() {
  if (existsSync(AUTH)) {
    const browser = await chromium.launch()
    const p = await (await browser.newContext({ storageState: AUTH })).newPage()
    await p.goto(B + '/clubhouse', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2000)
    const live = await p.evaluate(async b => {
      const r = await fetch(b + '/api/auth/session')
      const j = await r.json().catch(() => ({}))
      return !!j?.linkedPersonId
    }, B)
    await browser.close()
    if (live) {
      console.log('Existing session is still good.\n')
      return
    }
  }

  console.log('\n' + '='.repeat(64))
  console.log('  A browser window is opening. Sign in with Google.')
  console.log('  That is the only step I cannot do for you.')
  console.log('  Everything after it runs automatically.')
  console.log('='.repeat(64) + '\n')

  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  await p.goto(B + '/login')

  // Poll for the session instead of asking for a keypress.
  const deadline = Date.now() + 30 * 60 * 1000
  let signedIn = false
  while (Date.now() < deadline) {
    await p.waitForTimeout(4000)
    try {
      signedIn = await p.evaluate(async b => {
        const r = await fetch(b + '/api/auth/session')
        const j = await r.json().catch(() => ({}))
        return !!j?.linkedPersonId
      }, B)
    } catch { /* mid-navigation */ }
    if (signedIn) break
  }
  if (!signedIn) {
    console.log('Timed out waiting for sign-in.')
    await browser.close()
    process.exit(1)
  }
  await ctx.storageState({ path: AUTH })
  console.log('Signed in, session saved. Running the tests.\n')
  await browser.close()
}

await ensureSession()

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: AUTH })
const page = await ctx.newPage()
await page.goto(B + '/the-course', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

const me = await api(page, '/api/auth/session')
console.log(`Signed in as ${me.body?.user?.email}\n`)

let testId = null
try {
  // ── 1. Post a round ───────────────────────────────────────────────────────
  console.log('1. Hosting a round')
  const created = await api(page, '/api/gatherings', J('POST', {
    type: 'round', audience: 'both', vibe: 'casual',
    title: 'TEST ROUND, safe to delete',
    hostName: 'Ryan Chang', hostPersonId: RYAN_PERSON_ID,
    dateText: 'Saturday, September 27, 2026',
    timeText: '9:00 AM',
    venue: 'Merion Golf Club', city: 'Ardmore', state: 'PA',
    description: 'Automated test of the hosting flow.',
  }))
  testId = created.body?.gathering?.id
  ok('creates the round', created.status === 201 && !!testId, testId?.slice(0, 8) ?? '')
  ok('host is linked so the name can be clicked', created.body?.gathering?.hostPersonId === RYAN_PERSON_ID)

  // ── 2. It shows up ────────────────────────────────────────────────────────
  console.log('\n2. It appears on The Course')
  const listed = await api(page, '/api/gatherings?teamSlug=penn-mens-golf')
  const found = (listed.body?.gatherings ?? []).find(g => g.id === testId)
  ok('appears in the list', !!found)
  ok('sorted by date, soonest first', (() => {
    const ds = (listed.body?.gatherings ?? []).map(g => Date.parse(g.dateText)).filter(n => !Number.isNaN(n))
    return ds.every((d, i) => i === 0 || ds[i - 1] <= d)
  })())

  // ── 3. Edit it ────────────────────────────────────────────────────────────
  console.log('\n3. Editing it (the thing that used to require deleting)')
  const edited = await api(page, `/api/gatherings?id=${testId}`, J('PATCH', {
    timeText: '7:45 AM', venue: 'Aronimink Golf Club', title: 'TEST ROUND, edited',
  }))
  ok('edit saves', edited.status === 200)
  ok('time changed', edited.body?.gathering?.timeText === '7:45 AM', edited.body?.gathering?.timeText)
  ok('venue changed', edited.body?.gathering?.venue === 'Aronimink Golf Club')
  ok('untouched fields survive', edited.body?.gathering?.city === 'Ardmore')

  // ── 4. Put someone on the sheet ───────────────────────────────────────────
  console.log('\n4. Adding to the tee sheet')
  const added = await api(page, `/api/gatherings/${testId}/attendees/add`, J('POST', {
    people: [{ name: 'Ryan Chang', personId: RYAN_PERSON_ID, groupLabel: 'Group 1' }],
  }))
  ok('adds a player', added.status === 200 && added.body?.count === 1)
  const sheet = await api(page, `/api/gatherings/${testId}/attendees`)
  const rows = sheet.body?.attendees ?? []
  ok('appears on the sheet', rows.length === 1)
  ok('carries the group', rows[0]?.groupLabel === 'Group 1')
  ok('name links to a profile', !!(rows[0]?.bookId || rows[0]?.personId))
  ok('marked as in', rows[0]?.status === 'accepted')

  // adding twice must not duplicate
  await api(page, `/api/gatherings/${testId}/attendees/add`, J('POST', {
    people: [{ name: 'Ryan Chang', personId: RYAN_PERSON_ID, groupLabel: 'Group 2' }],
  }))
  const sheet2 = await api(page, `/api/gatherings/${testId}/attendees`)
  ok('re-adding does not duplicate', (sheet2.body?.attendees ?? []).length === 1)
  ok('re-adding updates the group', sheet2.body?.attendees?.[0]?.groupLabel === 'Group 2')

  // ── 5. Message the sheet ──────────────────────────────────────────────────
  console.log('\n5. Messaging the sheet (only Ryan is on it, so only Ryan is contacted)')
  const msg = await api(page, `/api/gatherings/${testId}/message`, J('POST', {
    message: 'Automated test of the host message. Safe to ignore.',
  }))
  ok('message sends', msg.status === 200 && msg.body?.ok === true,
     `emailed ${msg.body?.emailed}, notified ${msg.body?.notified}`)
  ok('reached at least one person', (msg.body?.emailed ?? 0) + (msg.body?.notified ?? 0) >= 1)
  const empty = await api(page, `/api/gatherings/${testId}/message`, J('POST', { message: '   ' }))
  ok('rejects an empty note', empty.status === 400)

  // ── 6. Validation ─────────────────────────────────────────────────────────
  console.log('\n6. Validation')
  const blankTitle = await api(page, `/api/gatherings?id=${testId}`, J('PATCH', { title: '' }))
  ok('refuses a blank title', blankTitle.status === 400)
  const nothing = await api(page, `/api/gatherings?id=${testId}`, J('PATCH', {}))
  ok('refuses an empty edit', nothing.status === 400)
  const ghost = await api(page, '/api/gatherings?id=does-not-exist', J('PATCH', { title: 'x' }))
  ok('404s an unknown round', ghost.status === 404)

  // ── 7. The real rounds are untouched ──────────────────────────────────────
  console.log('\n7. The real Boston rounds are unaffected')
  const all = await api(page, '/api/gatherings?teamSlug=penn-mens-golf')
  const boston = (all.body?.gatherings ?? []).filter(g => /Preseason Trip/i.test(g.title))
  ok('both Boston rounds still there', boston.length === 2)
  for (const g of boston) {
    const s = await api(page, `/api/gatherings/${g.id}/attendees`)
    ok(`${g.title.slice(0, 34)} still has 10`, (s.body?.attendees ?? []).length === 10)
  }
} finally {
  // ── 8. Clean up ───────────────────────────────────────────────────────────
  if (testId) {
    console.log('\n8. Cleaning up')
    const del = await api(page, `/api/gatherings?id=${testId}`, { method: 'DELETE' })
    ok('test round removed', del.status === 200)
    const after = await api(page, '/api/gatherings?teamSlug=penn-mens-golf')
    ok('gone from the list', !(after.body?.gatherings ?? []).some(g => g.id === testId))
  }
  console.log('\n' + '='.repeat(64))
  console.log(`  ${pass.length} passed, ${fail.length} failed`)
  if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
  console.log('='.repeat(64))
  await browser.close()
}
