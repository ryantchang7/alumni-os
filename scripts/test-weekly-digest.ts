/**
 * Unit tests for the weekly digest.
 *
 * This email is assembled and sent with nobody reading it first, so the
 * things worth pinning down are the editorial rules rather than the markup:
 * that the team leads, that the subject picks the most newsworthy item, that
 * sections cap instead of dumping, and that a member's own words cannot
 * break the HTML.
 *
 *   npx tsx scripts/test-weekly-digest.ts
 */

import { renderWeeklyDigest } from '../src/lib/email/templates'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

const base = {
  teamName: "Penn Men's Golf",
  weekOf: 'Week of Aug 30–Sep 6',
  newMembers: [] as Array<{ name: string; classLabel?: string }>,
  asks: [] as Array<{ kind: 'ask'; headline: string; sector: string; postedByName: string }>,
  offers: [] as Array<{ kind: 'offer'; headline: string; sector: string; postedByName: string }>,
  gatherings: [] as Array<{ title: string; dateText: string; city?: string }>,
  moments: [] as Array<{ caption: string; postedByName: string; photoUrl?: string; mediaType?: 'image' | 'video' }>,
  newsItems: [] as Array<{ title: string; sourceUrl: string }>,
  clubhouseUrl: 'https://www.penngolfclubhouse.com/player',
}

const RESULT = {
  eventName: 'Alex Lagowitz Memorial',
  resultText: '6th of 13 · 873 (+9)',
  dateRange: 'Sep 5–6',
  leaderboardUrl: 'https://scoreboard.clippd.com/tournaments/246006',
}
const NEXT = { eventName: 'Macdonald Cup', dateRange: 'Sep 26–27', locationText: 'New Haven, CT', daysAway: 20 }
const GATHER = { title: 'Kingsbarns', dateText: 'Thursday, October 15, 2026', city: 'St Andrews' }
const ASK = { kind: 'ask' as const, headline: 'Advice on private credit?', sector: 'Finance', postedByName: 'Wesley Hu' }

console.log('\n── The subject leads with the most newsworthy thing ──')
ok(
  'a result beats everything else',
  renderWeeklyDigest({ ...base, result: RESULT, nextUp: NEXT, gatherings: [GATHER], asks: [ASK], newMembers: [{ name: 'X' }] })
    .subject === "Penn Men's Golf · 6th of 13 at Alex Lagowitz Memorial",
  renderWeeklyDigest({ ...base, result: RESULT }).subject,
)
ok(
  'an imminent event beats gatherings',
  renderWeeklyDigest({ ...base, nextUp: { ...NEXT, daysAway: 3 }, gatherings: [GATHER] })
    .subject === "Penn Men's Golf · Macdonald Cup in 3 days",
)
ok(
  'a far-off event does NOT take the subject',
  !renderWeeklyDigest({ ...base, nextUp: NEXT, gatherings: [GATHER] }).subject.includes('Macdonald'),
)
ok(
  'one gathering is named',
  renderWeeklyDigest({ ...base, gatherings: [GATHER] }).subject === "Penn Men's Golf · Kingsbarns",
)
ok(
  'several gatherings are counted',
  renderWeeklyDigest({ ...base, gatherings: [GATHER, GATHER, GATHER] }).subject.includes('3 rounds on the board'),
)
ok(
  'a lone new member is named, not tallied',
  renderWeeklyDigest({ ...base, newMembers: [{ name: 'Kayden Wang' }] }).subject.includes('Kayden Wang joined'),
)
ok(
  'an empty week still produces a sane subject',
  renderWeeklyDigest(base).subject === "Penn Men's Golf · This week at the Clubhouse",
)

console.log('\n── The team leads the body ──')
{
  const html = renderWeeklyDigest({
    ...base, result: RESULT, nextUp: NEXT, newMembers: [{ name: 'Kayden Wang', classLabel: "'29" }],
    gatherings: [GATHER], asks: [ASK], newsItems: [{ title: 'Headline', sourceUrl: 'https://x.test' }],
  }).html
  const at = (s: string) => html.indexOf(s)
  ok('the team section is present', at('THE TEAM') === -1 ? at('The team') > 0 : true)
  ok('the team comes before new members', at('The team') < at('New in the book'))
  ok('the team comes before Penn headlines', at('The team') < at('From the box'))
  ok('what you can attend comes before who joined', at('Where you could play') < at('New in the book'))
  ok("Penn's own headlines come last", at('From the box') > at('Where you could play'))
  ok('the score is rendered', html.includes('6th of 13 · 873 (+9)'))
  ok('the leaderboard is linked', html.includes(RESULT.leaderboardUrl))
  ok('next up carries its distance', html.includes('in 20 days'))
}

console.log('\n── Sections cap instead of dumping ──')
{
  const many = Array.from({ length: 7 }, (_, i) => ({ ...GATHER, title: `Round ${i + 1}` }))
  const html = renderWeeklyDigest({ ...base, gatherings: many }).html
  ok('only three gatherings are listed', html.includes('Round 3') && !html.includes('Round 4'))
  ok('the remainder is counted', html.includes('and 4 more on the board.'))
}
{
  const html = renderWeeklyDigest({ ...base, asks: [ASK, ASK, ASK, ASK, ASK] }).html
  ok('asks cap at three with a remainder', html.includes('and 2 more asks.'))
}

console.log('\n── Empty sections do not render ──')
{
  const html = renderWeeklyDigest({ ...base, result: RESULT }).html
  ok('no empty "Where you could play"', !html.includes('Where you could play'))
  ok('no empty "New in the book"', !html.includes('New in the book'))
  ok('no empty asks heading', !html.includes('Someone is asking'))
}

console.log('\n── Moments carry the picture ──')
{
  const withPhoto = renderWeeklyDigest({
    ...base,
    moments: [{ caption: 'Gear day.', postedByName: 'Ryan Chang', photoUrl: 'https://x.test/a.jpg', mediaType: 'image' }],
  }).html
  ok('an image moment embeds the image', withPhoto.includes('<img src="https://x.test/a.jpg"'))
  const videoOnly = renderWeeklyDigest({
    ...base,
    moments: [{ caption: 'Range session.', postedByName: 'Ryan Chang', photoUrl: 'https://x.test/v.mp4', mediaType: 'video' }],
  }).html
  ok('a video is not embedded as an image', !videoOnly.includes('<img src="https://x.test/v.mp4"'))
  ok('the caption still shows for a video', videoOnly.includes('Range session.'))
}

console.log('\n── A member cannot break the email ──')
{
  const html = renderWeeklyDigest({
    ...base,
    newMembers: [{ name: '<script>alert(1)</script>', classLabel: "'29" }],
    moments: [{ caption: '<img onerror=alert(1)>', postedByName: 'A & B' }],
    gatherings: [{ title: 'Round "quoted"', dateText: 'Sat', city: '<b>NY</b>' }],
  }).html
  ok('a script tag in a name is escaped', !html.includes('<script>alert(1)</script>'))
  ok('a tag in a caption is escaped', !html.includes('<img onerror=alert(1)>'))
  ok('an ampersand in a name is escaped', html.includes('A &amp; B'))
  ok('a tag in a city is escaped', !html.includes('<b>NY</b>'))
}

console.log('\n── A quiet week still renders ──')
{
  const html = renderWeeklyDigest(base).html
  ok('the shell survives with no sections', html.includes('This week at the Clubhouse'))
  ok('the call to action is still there', html.includes('Open the Clubhouse'))
  ok('the unsubscribe is still there', html.includes('Turn it off'))
  ok('Ryan is reachable in the footer', html.includes('rtchang@upenn.edu'))
}

console.log(`\n${pass.length} passed, ${fail.length} failed`)
if (fail.length) {
  console.log('FAILED:', fail.join(' | '))
  process.exit(1)
}
