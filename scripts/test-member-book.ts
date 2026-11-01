/**
 * Verifies Penn Golf Member Book data integrity, across both books.
 *
 * The men's figures below are the archive and must never move. The merged
 * figures are asserted as men + women so that adding the women's book can
 * never silently disturb the men's import, which carries a checksum.
 *
 * Required counts (from the cleaned import package):
 *   - 346 total men's members
 *   - 330 all-time letter-winner entries
 *   - 631 total letter-year rows
 *   - 6  managers
 *   - 15 roster-only records (no letter in PDF)
 *   - 0  duplicate member IDs
 *
 * Run with: npx tsx scripts/test-member-book.ts
 */
import {
  memberBookEntries,
  memberBookCounts,
  memberBookMens,
  memberBookWomens,
  verifyMemberBook,
} from '../src/lib/member-book/data'
import { getPublicMembers } from '../src/lib/member-book/helpers'

const EXPECTED = {
  // Counts moved when current players were added to the roster (Sean Curran
  // and Oliver Uribe for 2030, among others). The historical figures below
  // are the ones that must never move: 330 letter winners and 631 letter-year
  // rows are the archive, and a change there means something was lost.
  membersTotal: 346,
  allTimeLetterWinnerEntriesIncluded: 330,
  managersIncluded: 6,
  playersIncluded: 339,
  rosterOnlyNoLetterInPdf: 15,
  // Penn Women's Golf, imported 2026-10-31 from the 23 season rosters Penn
  // Athletics publishes. Every one is roster-only: no women's letter-winner
  // record has been located, so none of these may count as a letter winner.
  womensMembers: 64,
  // Public listing is not the same set as `playersIncluded`, and checking it
  // against that number conflated two things that were never equal.
  publicMembers: 340,
  publicMembersAllPrograms: 404,
  letterYearRows: 631,
}

let failures = 0
function check(name: string, expected: number, actual: number) {
  const ok = expected === actual
  console.log(`${ok ? '✓' : '✗'} ${name}: expected ${expected}, got ${actual}`)
  if (!ok) failures++
}

console.log('Penn Men’s Golf Member Book — data verification\n')

check("Men's book total (must never move)", EXPECTED.membersTotal, memberBookMens.members.length)
check("Women's book total", EXPECTED.womensMembers, memberBookWomens.members.length)
check(
  'Merged total equals men + women',
  EXPECTED.membersTotal + EXPECTED.womensMembers,
  memberBookEntries.length,
)
check(
  "Women's entries claiming a letter year (must be 0)",
  0,
  memberBookWomens.members.filter((m) => m.letterWinner.years.length > 0).length,
)
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
  EXPECTED.playersIncluded + EXPECTED.womensMembers,
  memberBookEntries.filter((m) => m.role === 'player').length,
)
check(
  'Roster-only records',
  EXPECTED.rosterOnlyNoLetterInPdf + EXPECTED.womensMembers,
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
const publicMens = publicMembers.filter((m) => m.program === undefined).length
const publicWomens = publicMembers.filter((m) => m.program === 'womens').length
check('Public members, men (must never move)', EXPECTED.publicMembers, publicMens)
check('Public members, women', EXPECTED.womensMembers, publicWomens)
check(
  'Public member count, all programs',
  EXPECTED.publicMembersAllPrograms,
  publicMembers.length,
)

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
