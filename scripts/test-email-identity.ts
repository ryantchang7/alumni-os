/**
 * Guards the outbound email identity.
 *
 * The failure this exists to prevent is silent and reaches real people:
 * mail went out from an address that accepts no inbound mail, with no
 * reply-to, so an alum who pressed Reply had it bounce. Nothing in the
 * repo said so, because the sender came from an environment variable.
 *
 *   npx tsx scripts/test-email-identity.ts
 */

import { readFileSync } from 'fs'
import {
  CLUBHOUSE_FROM,
  CLUBHOUSE_REPLY_TO,
  CLUBHOUSE_REPLY_ADDRESS,
} from '../src/lib/email/identity'
import { renderWelcomeEmail } from '../src/lib/email/templates'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

console.log('\n── Who mail comes from ──')
ok('sender is the Clubhouse no-reply address',
  CLUBHOUSE_FROM === 'Penn Golf Clubhouse <noreply@penngolfclubhouse.com>', CLUBHOUSE_FROM)
ok('reply-to is a mailbox a person reads',
  CLUBHOUSE_REPLY_TO === 'Ryan Chang <rtchang@upenn.edu>', CLUBHOUSE_REPLY_TO)
ok('the two are different, which is the whole point',
  CLUBHOUSE_FROM !== CLUBHOUSE_REPLY_TO)
ok('reply-to is not the unmonitored domain',
  !CLUBHOUSE_REPLY_TO.includes('penngolfclubhouse.com'))

console.log('\n── The sender is decided in code, not in a dashboard ──')
const send = readFileSync('src/lib/email/send.ts', 'utf8')
ok('send.ts no longer reads EMAIL_FROM', !send.includes('EMAIL_FROM'))
ok('send.ts uses the shared sender', send.includes('CLUBHOUSE_FROM'))
ok('send.ts defaults the reply-to', send.includes('CLUBHOUSE_REPLY_TO'))
ok('nothing else hardcodes a sender address',
  !/from:\s*['"][^'"]*@penngolfclubhouse\.com/.test(send))

console.log('\n── What a recipient sees ──')
const { subject, html } = renderWelcomeEmail({
  firstName: 'Tom',
  clubhouseUrl: 'https://www.penngolfclubhouse.com/player',
})
ok('welcome subject unchanged', subject === 'Welcome to the Penn Golf Clubhouse', subject)
ok('footer says the inbox is not monitored', html.includes('This inbox'))
ok('footer offers a clickable address',
  html.includes(`mailto:${CLUBHOUSE_REPLY_ADDRESS}`))
ok('the old wording is gone', !html.includes('This address isn'))
ok('branding and call to action survived',
  html.includes('Open the Clubhouse') && html.includes('Welcome through the gate'))
ok('no stray unrendered template markers',
  !html.includes('${') && !html.includes('undefined'))

console.log(`\n${pass.length} passed, ${fail.length} failed`)
if (fail.length) {
  console.log('FAILED:', fail.join(' | '))
  process.exit(1)
}
