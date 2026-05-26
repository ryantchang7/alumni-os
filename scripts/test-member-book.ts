/**
 * Verifies Penn Men's Golf Member Book data integrity.
 *
 * Required counts (from the cleaned import package):
 *   - 343 total members
 *   - 330 all-time letter-winner entries
 *   - 631 total letter-year rows
 *   - 6  managers
 *   - 13 roster-only records (no letter in PDF)
 *   - 0  duplicate member IDs
 *
 * Run with: npx tsx scripts/test-member-book.ts
 */
import {
  memberBookEntries,
  memberBookCounts,
  verifyMemberBook,
} from '../src/lib/member-book/data'
import { getPublicMembers } from '../src/lib/member-book/helpers'

const EXPECTED = {
  membersTotal: 343,
  allTimeLetterWinnerEntriesIncluded: 330,
  managersIncluded: 6,
  playersIncluded: 337,
  rosterOnlyNoLetterInPdf: 13,
  letterYearRows: 631,
}

let failures = 0
function check(name: string, expected: number, actual: number) {
  const ok = expected === actual
  console.log(`${ok ? '✓' : '✗'} ${name}: expected ${expected}, got ${actual}`)
  if (!ok) failures++
}

console.log('Penn Men’s Golf Member Book — data verification\n')

check('Total members', EXPECTED.membersTotal, memberBookEntries.length)
check(
  'Letter-winner entries',
  EXPECTED.allTimeLetterWinnerEntriesIncluded,
  memberBookEntries.filter((m) => m.letterWinner.isLetterWinner).length,
)
check(
  'Managers',
  EXPECTED.managersIncluded,
  memberBookEntries.filter((m) => m.role === 'manager').length,
)
check(
  'Players (role === player)',
  EXPECTED.playersIncluded,
  memberBookEntries.filter((m) => m.role === 'player').length,
)
check(
  'Roster-only records',
  EXPECTED.rosterOnlyNoLetterInPdf,
  memberBookEntries.filter(
    (m) => m.sourceRecordType === 'verified_roster_only_no_letter_in_pdf',
  ).length,
)
check(
  'Letter-year rows',
  EXPECTED.letterYearRows,
  memberBookEntries.reduce((s, m) => s + m.letterWinner.years.length, 0),
)

const ids = new Set<string>()
const dupes: string[] = []
for (const m of memberBookEntries) {
  if (ids.has(m.id)) dupes.push(m.id)
  else ids.add(m.id)
}
console.log(`${dupes.length === 0 ? '✓' : '✗'} Unique member IDs: ${dupes.length} duplicates`)
if (dupes.length > 0) {
  console.log(`  Duplicates: ${dupes.join(', ')}`)
  failures++
}

const droppedNeedsReview = memberBookEntries.filter(
  (m) => m.review.needsRosterCheck && !m.includeInMemberBook,
).length
console.log(
  `${droppedNeedsReview === 0 ? '✓' : '✗'} Members marked needsRosterCheck are still included: ${droppedNeedsReview === 0 ? 'yes' : `${droppedNeedsReview} dropped`}`,
)
if (droppedNeedsReview > 0) failures++

const droppedManagers = memberBookEntries.filter(
  (m) => m.role === 'manager' && !m.includeInMemberBook,
).length
console.log(
  `${droppedManagers === 0 ? '✓' : '✗'} Managers preserved in data: ${droppedManagers === 0 ? 'yes' : `${droppedManagers} dropped`}`,
)
if (droppedManagers > 0) failures++

const publicMembers = getPublicMembers(memberBookEntries)
const publicManagers = publicMembers.filter((m) => m.role === 'manager').length
console.log(
  `${publicManagers === 0 ? '✓' : '✗'} Managers hidden from public Member Book by default: ${publicManagers === 0 ? 'yes' : `${publicManagers} leaked`}`,
)
if (publicManagers > 0) failures++
console.log(
  `${publicMembers.length === EXPECTED.playersIncluded ? '✓' : '✗'} Public member count: expected ${EXPECTED.playersIncluded}, got ${publicMembers.length}`,
)
if (publicMembers.length !== EXPECTED.playersIncluded) failures++

const report = verifyMemberBook()
if (!report.ok) {
  console.log('\nWarnings/errors from verifyMemberBook():')
  for (const w of report.warnings) console.log(`  - ${w}`)
  for (const e of report.errors) console.log(`  ! ${e}`)
}

console.log(
  `\nCounts (from data file): members=${memberBookCounts.membersTotal} letterYears=${memberBookCounts.letterYearRows} managers=${memberBookCounts.managersIncluded} rosterOnly=${memberBookCounts.rosterOnlyNoLetterInPdf}`,
)

if (failures > 0) {
  console.error(`\nFAIL — ${failures} check${failures === 1 ? '' : 's'} failed`)
  process.exit(1)
}
console.log('\nOK — Member Book data integrity verified.')
