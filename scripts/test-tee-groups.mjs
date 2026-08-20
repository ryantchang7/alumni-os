/**
 * Host group controls on a tee sheet, against production.
 *
 * Creates its own throwaway round with no location (so selectNearbyRecipients
 * returns nobody and it cannot mail the roster), moves people between groups,
 * dissolves one, and deletes the round in the finally block. It never touches
 * a real gathering.
 *
 *   node scripts/test-tee-groups.mjs
 */

import { chromium } from 'playwright'
import { existsSync } from 'fs'

const AUTH = '/Users/ryanchang/dev/penn-golf-clubhouse-video/assets/capture/auth.json'
const B = 'https://www.penngolfclubhouse.com'
const RYAN = '4a41af96-b5f4-455d-8d94-55a52efa6ad8'

const pass = [], fail = []
const ok = (l, c, d = '') => { (c ? pass : fail).push(l); console.log(`  ${c ? 'PASS' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`) }

if (!existsSync(AUTH)) { console.log('No saved session.'); process.exit(1) }
const browser = await chromium.launch()
const page = await (await browser.newContext({ storageState: AUTH })).newPage()
await page.goto(B + '/the-course', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

const api = (path, init) => page.evaluate(async ({ b, path, init }) => {
  const r = await fetch(b + path, init)
  let body = null; try { body = await r.json() } catch {}
  return { status: r.status, body }
}, { b: B, path, init })
const J = (m, p) => ({ method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })

let id = null
try {
  const made = await api('/api/gatherings', J('POST', {
    teamSlug: 'penn-mens-golf', type: 'round', audience: 'both', vibe: 'casual',
    hostName: 'Ryan Chang', hostPersonId: RYAN,
    dateText: 'Saturday, September 27, 2026', timeText: '9:00 AM',
    venue: 'Group test, safe to delete', title: 'TEST groups, safe to delete',
    notifyMode: 'quiet',
  }))
  id = made.body?.gathering?.id
  ok('created a throwaway round', made.status === 201 && !!id, `${made.status}`)
  if (!id) throw new Error('no gathering')

  // The endpoint takes a people[] batch, not one person per call.
  const added = await api(`/api/gatherings/${id}/attendees/add`, J('POST', {
    people: [
      { name: 'Test Player One', groupLabel: 'Group 1' },
      { name: 'Test Player Two', groupLabel: 'Group 1' },
      { name: 'Test Player Three', groupLabel: 'Group 2' },
    ],
  }))
  ok('added three people', added.status === 200 || added.status === 201, `${added.status}`)

  const sheet1 = await api(`/api/gatherings/${id}/attendees`)
  const rows = sheet1.body?.attendees ?? []
  ok('three people on the sheet', rows.length === 3, `${rows.length}`)
  ok('groups came through', rows.filter(r => r.groupLabel === 'Group 1').length === 2)

  console.log('\n1a. Guests: someone with no Member Book card')
  const guest = rows.find(r => r.name === 'Test Player Three')
  ok('a non-member goes on the sheet', !!guest)
  ok('and carries no card link', guest && !guest.bookId && !guest.personId,
     `bookId=${guest?.bookId} personId=${guest?.personId}`)
  ok('one request added all three', rows.length === 3, `${rows.length}`)

  console.log('\n1. Move one person to a brand new group')
  const mover = rows.find(r => r.name === 'Test Player Two')
  const mv = await api(`/api/gatherings/${id}/attendees`,
    J('PATCH', { requestId: mover.requestId, groupLabel: 'Group 4' }))
  ok('move accepted', mv.status === 200, `${mv.status}`)
  let now = (await api(`/api/gatherings/${id}/attendees`)).body.attendees
  ok('they are in Group 4', now.find(r => r.name === 'Test Player Two')?.groupLabel === 'Group 4')
  ok('a new group needs no create step', now.some(r => r.groupLabel === 'Group 4'))

  console.log('\n2. Ungroup someone without removing them')
  const un = await api(`/api/gatherings/${id}/attendees`,
    J('PATCH', { requestId: mover.requestId, groupLabel: '' }))
  ok('ungroup accepted', un.status === 200)
  now = (await api(`/api/gatherings/${id}/attendees`)).body.attendees
  ok('label is cleared', !now.find(r => r.name === 'Test Player Two')?.groupLabel)
  ok('they are still on the sheet', now.length === 3, `${now.length}`)

  console.log('\n3. Rename a whole group')
  const rn = await api(`/api/gatherings/${id}/attendees`,
    J('PATCH', { group: 'Group 2', renameTo: 'Alumni group' }))
  ok('rename accepted', rn.status === 200 && rn.body?.moved === 1, `moved ${rn.body?.moved}`)
  now = (await api(`/api/gatherings/${id}/attendees`)).body.attendees
  ok('the label changed', now.some(r => r.groupLabel === 'Alumni group'))
  ok('the old label is gone', !now.some(r => r.groupLabel === 'Group 2'))

  console.log('\n4. Dissolve a group, keeping its people')
  const ds = await api(`/api/gatherings/${id}/attendees`, J('PATCH', { group: 'Group 1', renameTo: '' }))
  ok('dissolve accepted', ds.status === 200 && ds.body?.moved === 1, `moved ${ds.body?.moved}`)
  now = (await api(`/api/gatherings/${id}/attendees`)).body.attendees
  ok('nobody was uninvited', now.length === 3, `${now.length}`)
  ok('Group 1 is gone', !now.some(r => r.groupLabel === 'Group 1'))

  console.log('\n5. It is host-only and validated')
  const bad = await api(`/api/gatherings/${id}/attendees`, J('PATCH', { requestId: 'nope' }))
  ok('unknown attendee is rejected', bad.status === 404, `${bad.status}`)
  const empty = await api(`/api/gatherings/${id}/attendees`, J('PATCH', { group: '   ' }))
  ok('a blank group name is rejected', empty.status === 400, `${empty.status}`)
  const long = await api(`/api/gatherings/${id}/attendees`,
    J('PATCH', { requestId: mover.requestId, groupLabel: 'x'.repeat(300) }))
  now = (await api(`/api/gatherings/${id}/attendees`)).body.attendees
  const lab = now.find(r => r.name === 'Test Player Two')?.groupLabel ?? ''
  ok('a 300-character label is capped', long.status === 200 && lab.length <= 40, `${lab.length} chars`)
} finally {
  if (id) {
    const d = await api(`/api/gatherings?id=${id}`, { method: 'DELETE' })
    ok('throwaway round deleted', d.status === 200, `${d.status}`)
  }
  const left = (await api('/api/gatherings?teamSlug=penn-mens-golf')).body?.gatherings ?? []
  ok('no test rounds left behind', !left.some(g => /safe to delete/i.test(g.title)))
  ok('the real preseason rounds are untouched',
     left.filter(g => /Preseason Trip/i.test(g.title)).length === 2)
  console.log('\n' + '='.repeat(60))
  console.log(`  ${pass.length} passed, ${fail.length} failed`)
  if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
  console.log('='.repeat(60))
  await browser.close()
}
process.exit(fail.length ? 1 : 0)
