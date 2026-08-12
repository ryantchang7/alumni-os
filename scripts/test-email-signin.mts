/**
 * Verifies the email sign-in primitives without a browser or a live site.
 *
 * Covers the parts that are easy to get wrong and expensive to get wrong:
 * a token must work exactly once, an address must resolve to ONE account no
 * matter which door it came through, and signing in must never confer approval.
 *
 * Writes to the local JSON store, so back up data/alumni-os.json first.
 *
 *   npx tsx scripts/test-email-signin.mts
 */

import {
  issueEmailLinkToken,
  consumeEmailLinkToken,
  isPlausibleEmail,
  normalizeEmail,
} from '../src/lib/auth/email-link'
import {
  upsertAccount,
  upsertAccountByEmail,
  getAccountById,
  readStore,
  getTeamBySlug,
  EMAIL_SUB_PREFIX,
} from '../src/lib/store/local-store'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

const team = await getTeamBySlug('penn-mens-golf')
if (!team) {
  console.error('No team in the local store, cannot run.')
  process.exit(1)
}

// ── 1. Token lifecycle ───────────────────────────────────────────────────────
console.log('\n1. Token lifecycle')
const addr = 'test-emaillink@example.com'
const token = await issueEmailLinkToken(addr)
ok('mints a token', typeof token === 'string' && (token?.length ?? 0) > 30)
ok('token is not the address in disguise', !token?.includes('example.com'))

const first = await consumeEmailLinkToken(token!)
ok('redeems to the right address', first === addr, String(first))
const second = await consumeEmailLinkToken(token!)
ok('cannot be redeemed twice', second === null, String(second))

ok('rejects an unknown token', (await consumeEmailLinkToken('not-a-real-token')) === null)
ok('rejects an empty token', (await consumeEmailLinkToken('')) === null)
ok('rejects an absurdly long token', (await consumeEmailLinkToken('x'.repeat(500))) === null)

// ── 2. Address validation ────────────────────────────────────────────────────
console.log('\n2. Address validation')
ok('accepts a normal address', isPlausibleEmail('ryan@upenn.edu'))
ok('rejects no domain', !isPlausibleEmail('ryan'))
ok('rejects no tld', !isPlausibleEmail('ryan@upenn'))
ok('rejects spaces', !isPlausibleEmail('ry an@upenn.edu'))
ok('lowercases and trims', normalizeEmail('  Ryan@UPenn.Edu ') === 'ryan@upenn.edu')

// ── 3. One address, one account ──────────────────────────────────────────────
console.log('\n3. One address means one account, whichever door they use')
const emailFirst = `emailfirst-${Date.now()}@example.com`

const a1 = await upsertAccountByEmail({ email: emailFirst, teamId: team.id })
ok('creates an account', !!a1.id)
ok('carries the placeholder sub', a1.googleSub.startsWith(EMAIL_SUB_PREFIX))
ok('signing in is NOT approval', !a1.linkedPersonId, String(a1.linkedPersonId))

const a2 = await upsertAccountByEmail({ email: emailFirst.toUpperCase(), teamId: team.id })
ok('same address in caps returns the same account', a2.id === a1.id)

// Same person later signs in with Google: must adopt the row, not fork it.
const a3 = await upsertAccount({
  email: emailFirst,
  googleSub: 'google-sub-12345',
  name: 'Email First',
  teamId: team.id,
  emailVerified: true,
})
ok('Google sign-in adopts the existing row', a3.id === a1.id, `${a3.id.slice(0, 8)} vs ${a1.id.slice(0, 8)}`)
ok('row now carries the real Google sub', a3.googleSub === 'google-sub-12345')

const storeAfter = await readStore()
const dupes = storeAfter.accounts.filter(
  a => (a.email ?? '').toLowerCase() === emailFirst.toLowerCase(),
)
ok('exactly one account exists for the address', dupes.length === 1, `found ${dupes.length}`)

// And the reverse: Google first, then an email link.
const googleFirst = `googlefirst-${Date.now()}@example.com`
const b1 = await upsertAccount({
  email: googleFirst,
  googleSub: 'google-sub-67890',
  teamId: team.id,
  emailVerified: true,
})
const b2 = await upsertAccountByEmail({ email: googleFirst, teamId: team.id })
ok('email link finds the Google account', b2.id === b1.id)
ok('does not clobber the real Google sub', b2.googleSub === 'google-sub-67890', b2.googleSub)

// ── 4. Unverified Google addresses do not merge ──────────────────────────────
console.log('\n4. An unverified Google address must not adopt someone else\'s row')
const victim = `victim-${Date.now()}@example.com`
const v1 = await upsertAccountByEmail({ email: victim, teamId: team.id })
const attacker = await upsertAccount({
  email: victim,
  googleSub: 'attacker-sub-99999',
  teamId: team.id,
  emailVerified: false,
})
ok('unverified sign-in gets its own row', attacker.id !== v1.id)
ok('the original row keeps its placeholder sub',
   (await getAccountById(v1.id))?.googleSub.startsWith(EMAIL_SUB_PREFIX) === true)

// ── 5. Approval is still earned, not granted ─────────────────────────────────
console.log('\n5. Approval is still earned')
const fresh = await upsertAccountByEmail({ email: `fresh-${Date.now()}@example.com`, teamId: team.id })
ok('a brand new email account has no linked person', !fresh.linkedPersonId)

console.log('\n' + '='.repeat(60))
console.log(`  ${pass.length} passed, ${fail.length} failed`)
if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
console.log('='.repeat(60))
process.exit(fail.length ? 1 : 0)
