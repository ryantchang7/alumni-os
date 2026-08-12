/**
 * Verifies that a fan-out is paced and that rate-limited sends are retried.
 *
 * Uses an injected sender, so no network and no Resend key.
 *
 *   npx tsx scripts/test-email-batch.mts
 */

import { sendEmailBatch } from '../src/lib/email/send'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

const msg = (i: number) => ({ to: `p${i}@example.com`, subject: 's', html: '<p>h</p>' })

// ── 1. Pacing ────────────────────────────────────────────────────────────────
console.log('1. A fan-out is paced, not fired all at once')
const t0 = Date.now()
const stamps: number[] = []
const res = await sendEmailBatch(
  Array.from({ length: 6 }, (_, i) => msg(i)),
  async () => {
    stamps.push(Date.now() - t0)
    return { ok: true, id: 'x' }
  },
)
ok('every message is sent', res.length === 6 && res.every(r => r.ok))
const groups = new Set(stamps.map(s => Math.round(s / 500)))
ok('spread over time rather than one burst', groups.size >= 3,
   `${groups.size} distinct windows, last at ${stamps[stamps.length - 1]}ms`)
ok('no more than 2 land in the same instant',
   stamps.filter(s => s < 200).length <= 2, `${stamps.filter(s => s < 200).length} immediate`)

// ── 2. Retry on rate limit ───────────────────────────────────────────────────
console.log('\n2. A rate-limited send is retried')
let attempts = 0
const retried = await sendEmailBatch([msg(1)], async () => {
  attempts++
  return attempts === 1
    ? { ok: false, error: 'Too many requests (429)' }
    : { ok: true, id: 'ok' }
})
ok('eventually succeeds', retried[0].ok === true)
ok('took more than one attempt', attempts === 2, `attempts=${attempts}`)

// ── 3. A real failure is not retried forever ─────────────────────────────────
console.log('\n3. A genuine failure gives up and is reported')
let hardAttempts = 0
const hard = await sendEmailBatch([msg(2)], async () => {
  hardAttempts++
  return { ok: false, error: 'Invalid recipient address' }
})
ok('reports the failure', hard[0].ok === false)
ok('does not retry a non-rate-limit error', hardAttempts === 1, `attempts=${hardAttempts}`)

// ── 4. Empty input ───────────────────────────────────────────────────────────
console.log('\n4. Nothing to send')
let called = 0
const none = await sendEmailBatch([], async () => { called++; return { ok: true } })
ok('no sends, no error', none.length === 0 && called === 0)

console.log('\n' + '='.repeat(60))
console.log(`  ${pass.length} passed, ${fail.length} failed`)
if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
console.log('='.repeat(60))
process.exit(fail.length ? 1 : 0)
