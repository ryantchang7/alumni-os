/**
 * Who gets emailed when a round is posted.
 *
 * Pure-function tests over a synthetic roster. No server, no store, no mail.
 *
 *   npx tsx scripts/test-nearby-recipients.mts
 */

import { selectNearbyRecipients, placeLabel } from '../src/lib/gatherings/nearby'
import type { Account, PersonEnrichment, TeamMembership, ClubhouseGathering } from '../src/lib/store/types'

const TEAM = 'team-1'
const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

const acct = (id: string, personId?: string): Account =>
  ({ id, email: `${id}@example.com`, googleSub: `sub-${id}`, teamId: TEAM,
     linkedPersonId: personId, createdAt: '', updatedAt: '' }) as Account

const enr = (personId: string, city: string, state: string): PersonEnrichment =>
  ({ personId, teamId: TEAM, city, state }) as PersonEnrichment

const mem = (personId: string, memberRole: TeamMembership['memberRole']): TeamMembership =>
  ({ personId, teamId: TEAM, memberRole }) as TeamMembership

//  host      Ryan, Philadelphia PA, hosting
//  p-pa      alumni in Pittsburgh PA          → same state
//  p-ny      alumni in New York NY            → different state
//  p-play    current player in Philadelphia   → same state
//  p-unappr  signed in but never approved     → must never be mailed
//  p-noenr   approved but empty card          → cannot be placed
const accounts = [
  acct('a-host', 'host'),
  acct('a-pa', 'p-pa'),
  acct('a-ny', 'p-ny'),
  acct('a-play', 'p-play'),
  acct('a-unappr'),
  acct('a-noenr', 'p-noenr'),
]
const enrichments = [
  enr('host', 'Philadelphia', 'Pennsylvania'),
  enr('p-pa', 'Pittsburgh', 'Pennsylvania'),
  enr('p-ny', 'New York', 'New York'),
  enr('p-play', 'Philadelphia', 'Pennsylvania'),
]
const memberships = [
  mem('host', 'alumni'),
  mem('p-pa', 'alumni'),
  mem('p-ny', 'alumni'),
  mem('p-play', 'current_player'),
  mem('p-noenr', 'alumni'),
]

const round = (over: Partial<ClubhouseGathering> = {}) =>
  ({ teamId: TEAM, city: 'Ardmore', state: 'PA', audience: 'both', type: 'round',
     hostName: 'Ryan Chang', dateText: 'Saturday', ...over }) as ClubhouseGathering

const ids = (g: Partial<ClubhouseGathering> = {}) =>
  selectNearbyRecipients({ accounts, enrichments, memberships, gathering: round(g), hostAccountId: 'a-host' })
    .map(a => a.id)
    .sort()

// ── 1. Same state ────────────────────────────────────────────────────────────
console.log('1. Reaches the right people')
const base = ids()
ok('reaches members in that state', base.includes('a-pa') && base.includes('a-play'), base.join(','))
ok('skips a different state', !base.includes('a-ny'))
ok('never mails the host their own round', !base.includes('a-host'))
ok('never mails an unapproved account', !base.includes('a-unappr'))
ok('skips a member with no location on their card', !base.includes('a-noenr'))

// ── 2. Audience ──────────────────────────────────────────────────────────────
console.log('\n2. Respects who it was posted for')
const playersOnly = ids({ audience: 'players' })
ok('players-only reaches the player', playersOnly.includes('a-play'))
ok('players-only skips alumni', !playersOnly.includes('a-pa'), playersOnly.join(','))
const alumniOnly = ids({ audience: 'alumni' })
ok('alumni-only reaches alumni', alumniOnly.includes('a-pa'))
ok('alumni-only skips the current player', !alumniOnly.includes('a-play'), alumniOnly.join(','))

// ── 3. City fallback ─────────────────────────────────────────────────────────
console.log('\n3. Falls back to city when there is no state')
const cityOnly = ids({ state: undefined, city: 'Pittsburgh' })
ok('matches on city text', cityOnly.includes('a-pa'), cityOnly.join(','))
ok('case does not matter', ids({ state: undefined, city: 'pITTSBURGH' }).includes('a-pa'))
ok('a different city reaches nobody', ids({ state: undefined, city: 'Boston' }).length === 0)

// ── 4. Nowhere reaches nobody ────────────────────────────────────────────────
console.log('\n4. A round with no location reaches nobody')
ok('no city and no state means no mail', ids({ city: undefined, state: undefined }).length === 0)
ok('blank strings mean no mail', ids({ city: '', state: '' }).length === 0)
ok('an unknown state reaches nobody', ids({ city: undefined, state: 'Atlantis' }).length === 0)

// ── 5. Labels ────────────────────────────────────────────────────────────────
console.log('\n5. The place reads properly in the subject line')
ok('city and state', placeLabel({ city: 'Ardmore', state: 'PA' } as ClubhouseGathering) === 'Ardmore, PA')
ok('city alone', placeLabel({ city: 'Ardmore' } as ClubhouseGathering) === 'Ardmore')
ok('state alone expands', placeLabel({ state: 'PA' } as ClubhouseGathering) === 'Pennsylvania',
   placeLabel({ state: 'PA' } as ClubhouseGathering))

// ── 6. Notify mode ───────────────────────────────────────────────────────────
// The mode itself lives in the route, but the contract it relies on is here:
// 'nearby' must keep doing exactly what it did before the choice existed.
console.log('\n6. The default mode is unchanged')
const before = ids()
ok('nearby still reaches the same people', before.join(',') === 'a-pa,a-play', before.join(','))
ok('and still excludes the host', !before.includes('a-host'))

console.log('\n' + '='.repeat(60))
console.log(`  ${pass.length} passed, ${fail.length} failed`)
if (fail.length) fail.forEach(f => console.log('   FAILED: ' + f))
console.log('='.repeat(60))
process.exit(fail.length ? 1 : 0)
