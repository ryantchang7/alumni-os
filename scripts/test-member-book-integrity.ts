/**
 * Guard rails for the Member Book, to be run before AND after any import.
 *
 * The registry is now four sources merged into one list: the men's book
 * (an all-time letter-winner PDF import), the women's book (built only
 * from rosters Penn Athletics publishes), historical-additions (people
 * Penn never published, from recollection) and coaching-staff. Melissa
 * Maurer is collecting the women's pre-2004 names, which means the next
 * change to this data comes from outside the repo.
 *
 * Everything asserted here is something that, if it broke, would break
 * quietly: a duplicate id silently shadowing a card, a URL that stops
 * resolving, somebody gaining a varsity letter they never won, a men's
 * entry altered by a women's import. None of it would fail a build.
 *
 *   npx tsx scripts/test-member-book-integrity.ts
 */

import { memberBookMens, memberBookWomens, memberBookEntries } from '../src/lib/member-book/data'
import { historicalAdditions, isHistoricalAddition } from '../src/lib/member-book/historical-additions'
import { coachingStaff } from '../src/lib/member-book/coaching-staff'
import {
  isPublicMember,
  getMemberProgram,
  getMemberStartYear,
  getMemberEndYear,
} from '../src/lib/member-book/helpers'

let failures = 0
const ok = (label: string, cond: boolean, detail = '') => {
  if (!cond) failures++
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
}

console.log('\nSource counts')
ok(
  "men's book matches its own declared count",
  memberBookMens.members.length === memberBookMens.counts.membersTotal,
  `${memberBookMens.members.length} vs ${memberBookMens.counts.membersTotal}`,
)
ok(
  "women's book matches its own declared count",
  memberBookWomens.members.length === memberBookWomens.counts.membersTotal,
  `${memberBookWomens.members.length} vs ${memberBookWomens.counts.membersTotal}`,
)
ok(
  'merged list is the sum of its sources',
  memberBookEntries.length ===
    memberBookMens.members.length +
      memberBookWomens.members.length +
      historicalAdditions.length +
      coachingStaff.length,
  String(memberBookEntries.length),
)

console.log('\nIdentity')
const ids = memberBookEntries.map(e => e.id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
ok('no duplicate ids across the four sources', dupes.length === 0, dupes.join(', '))
ok(
  'every entry has a usable id and name',
  memberBookEntries.every(e => !!e.id?.trim() && !!e.displayName?.trim()),
)
ok(
  'ids are url-safe, so every card link resolves',
  memberBookEntries.every(e => /^[a-z0-9-]+$/.test(e.id)),
  memberBookEntries.filter(e => !/^[a-z0-9-]+$/.test(e.id)).map(e => e.id).join(', '),
)

console.log('\nProgram separation')
ok(
  "every men's book entry still reads as men's",
  memberBookMens.members.every(e => getMemberProgram(e) === 'mens'),
)
ok(
  "every women's book entry still reads as women's",
  memberBookWomens.members.every(e => getMemberProgram(e) === 'womens'),
)
ok(
  'every entry resolves to exactly one known program',
  memberBookEntries.every(e => ['mens', 'womens'].includes(getMemberProgram(e))),
)

console.log('\nLetters are never invented')
ok(
  'no historical addition claims a varsity letter',
  historicalAdditions.every(e => !e.letterWinner.isLetterWinner && e.letterWinner.count === 0),
)
ok(
  'no coach claims a varsity letter',
  coachingStaff.every(e => !e.letterWinner.isLetterWinner && e.letterWinner.count === 0),
)
ok(
  'anyone marked a letter winner has at least one letter year',
  memberBookEntries.every(e => !e.letterWinner.isLetterWinner || e.letterWinner.years.length > 0),
)
ok(
  "no women's entry claims a letter, since Penn publishes no women's letter record",
  memberBookEntries
    .filter(e => getMemberProgram(e) === 'womens')
    .every(e => !e.letterWinner.isLetterWinner),
)

console.log('\nProvenance')
ok(
  'every recollection-sourced card says who remembered it',
  historicalAdditions.every(e => e.sources.primary.toLowerCase().includes('recollection')),
)
ok(
  'historical additions are flagged as such',
  historicalAdditions.every(isHistoricalAddition),
)
ok(
  'no card from outside the two books pretends to be a Penn roster record',
  [...historicalAdditions, ...coachingStaff].every(
    e => !e.review.hasVerifiedRosterArchiveRecord && !e.review.hasAllTimeLetterWinnerRecord,
  ),
)

console.log('\nSpans')
const inverted = memberBookEntries.filter(e => {
  const s = getMemberStartYear(e)
  const en = getMemberEndYear(e)
  return s != null && en != null && s > en
})
ok('no span ends before it starts', inverted.length === 0, inverted.map(e => e.id).join(', '))
const thisYear = new Date().getFullYear()
const future = memberBookEntries.filter(e => {
  const en = getMemberEndYear(e)
  return en != null && en > thisYear + 5
})
ok('no span runs implausibly into the future', future.length === 0, future.map(e => e.id).join(', '))

console.log('\nKnown people, so a reshuffle cannot go unnoticed')
const find = (id: string) => memberBookEntries.find(e => e.id === id)
const spanOf = (id: string) => {
  const e = find(id)
  return e ? `${getMemberStartYear(e)}-${getMemberEndYear(e)}` : 'MISSING'
}
ok('Richard G. Steingraber, 1972-1976', spanOf('richard-g-steingraber') === '1972-1976', spanOf('richard-g-steingraber'))
ok('Peyton Wallace, 1999-2003 (he told us)', spanOf('peyton-wallace') === '1999-2003', spanOf('peyton-wallace'))
ok('Melissa Aylor is in and is women’s', getMemberProgram(find('w-melissa-aylor')!) === 'womens')
ok('David Posnick has a card', !!find('club-david-posnick'))
ok('Mark Anderson is a public coach', find('w-mark-anderson')?.role === 'coach' && isPublicMember(find('w-mark-anderson')!))

console.log(
  failures ? `\n${failures} FAILED\n` : `\nAll integrity checks passed (${memberBookEntries.length} cards)\n`,
)
process.exit(failures ? 1 : 0)
