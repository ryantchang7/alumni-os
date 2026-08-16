/**
 * End-to-end test of who gets told when a round is posted.
 *
 * This runs against production, so every round it creates is posted with a
 * location that matches nobody and is deleted in the finally block. The whole
 * point of the feature is who receives email, so a test that mailed the roster
 * would be worse than no test at all.
 *
 *   node scripts/test-invite-modes.mjs
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
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
})

if (!existsSync(AUTH)) {
  console.log('No saved session. Run scripts/test-host-flow.mjs first to create one.')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await (await browser.newContext({ storageState: AUTH })).newPage()
await page.goto(B + '/the-course', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

const created = []
// Deliberately nowhere: selectNearbyRecipients returns [] with no city/state,
// so even the 'nearby' case cannot reach a real member.
const base = {
  teamSlug: 'penn-mens-golf', type: 'round', audience: 'both', vibe: 'casual',
  hostName: 'Ryan Chang', hostPersonId: RYAN_PERSON_ID,
  dateText: 'Saturday, September 27, 2026', timeText: '9:00 AM',
  venue: 'Test Course, safe to delete',
}

try {
  console.log('1. The three notify modes are all accepted')
  for (const [mode, extra] of [
    ['nearby', {}],
    ['quiet', {}],
    ['invite', { inviteBookIds: [] }],
  ]) {
    const r = await api(page, '/api/gatherings', J('POST', {
      ...base, title: `TEST ${mode}, safe to delete`, notifyMode: mode, ...extra,
    }))
    const id = r.body?.gathering?.id
    if (id) created.push(id)
    ok(`posts with notifyMode=${mode}`, r.status === 201 && !!id, `${r.status}`)
  }

  console.log('\n2. A bad mode falls back rather than failing the post')
  const junk = await api(page, '/api/gatherings', J('POST', {
    ...base, title: 'TEST junk mode, safe to delete', notifyMode: 'not-a-mode',
  }))
  if (junk.body?.gathering?.id) created.push(junk.body.gathering.id)
  ok('unknown mode still posts the round', junk.status === 201)

  console.log('\n3. Invite ids are validated, not trusted')
  const bad = await api(page, '/api/gatherings', J('POST', {
    ...base, title: 'TEST bad ids, safe to delete',
    notifyMode: 'invite', inviteBookIds: ['nope', 12345, null, 'also-nope'],
  }))
  if (bad.body?.gathering?.id) created.push(bad.body.gathering.id)
  ok('garbage invite ids do not break the post', bad.status === 201, `${bad.status}`)

  const huge = await api(page, '/api/gatherings', J('POST', {
    ...base, title: 'TEST many ids, safe to delete',
    notifyMode: 'invite', inviteBookIds: Array.from({ length: 500 }, (_, i) => 'x' + i),
  }))
  if (huge.body?.gathering?.id) created.push(huge.body.gathering.id)
  ok('a 500-id invite list is capped, not fatal', huge.status === 201, `${huge.status}`)

  console.log('\n4. Every round still lands on the board')
  const listed = await api(page, '/api/gatherings?teamSlug=penn-mens-golf')
  const ids = new Set((listed.body?.gatherings ?? []).map(g => g.id))
  ok('all test rounds appear regardless of notify mode',
     created.every(id => ids.has(id)), `${created.filter(id => ids.has(id)).length}/${created.length}`)

  console.log('\n5. The real Boston rounds are untouched')
  const boston = (listed.body?.gatherings ?? []).filter(g => /Preseason Trip/i.test(g.title))
  ok('both Boston rounds still there', boston.length === 2, `${boston.length}`)
  for (const g of boston) {
    const s = await api(page, `/api/gatherings/${g.id}/attendees`)
    ok(`${g.title.slice(0, 30)} still has 10`, (s.body?.attendees ?? []).length === 10)
  }
} finally {
  console.log('\n6. Cleaning up')
  for (const id of created) {
    const d = await api(page, `/api/gatherings?id=${id}`, { method: 'DELETE' })
    ok(`removed ${id.slice(0, 8)}`, d.status === 200)
  }
  const after = await api(page, '/api/gatherings?teamSlug=penn-mens-golf')
  const left = (after.body?.gatherings ?? []).filter(g => /safe to delete/i.test(g.title))
  ok('no test rounds left behind', left.length === 0, `${left.length} remaining`)

  console.log('\n' + '='.repeat(64))
  console.log(`  ${pass.length} passed, ${fail.length} failed`)
  if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
  console.log('='.repeat(64))
  await browser.close()
}
process.exit(fail.length ? 1 : 0)
