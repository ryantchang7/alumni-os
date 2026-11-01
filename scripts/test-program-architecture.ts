/**
 * Guards the program architecture and the 1967 record-book entry.
 *
 * Two different mistakes are being prevented here.
 *
 * The first is historical. An alumnus who played in that era reported that
 * 1967 was missing from the NCAA appearances and that Penn hosted the
 * championship at Shawnee on the Delaware. Both now appear: 1967 counts as
 * an appearance, and the hosting detail rides alongside it as a note. What
 * is still excluded is his own stated guess, that Bob Hays was awarded the
 * tournament for long service — he flagged it as speculation himself.
 *
 * The second is structural. Women's golf is coming, and the dangerous
 * version of that is a half-built public section appearing before the data
 * does. Every program-aware surface is gated on isMultiProgram(), which is
 * false while only one program is live.
 *
 *   npx tsx scripts/test-program-architecture.ts
 */

import { readFileSync } from 'fs'
import {
  PENN_GOLF_TRADITION,
  PENN_GOLF_HISTORICAL_NOTES,
  NCAA_CHAMPIONSHIP_YEARS,
  IVY_CHAMPIONSHIP_YEARS,
} from '../src/lib/program-history/penn-mens-golf'
import {
  PENN_WOMENS_GOLF_TRADITION,
  PENN_WOMENS_GOLF_HISTORICAL_NOTES,
  WOMENS_IVY_CHAMPIONSHIP_YEARS,
  WOMENS_NCAA_REGIONAL_YEARS,
  WOMENS_UNPUBLISHED_SEASONS,
  WOMENS_FOUNDED_YEAR,
} from '../src/lib/program-history/penn-womens-golf'
import { getCaptainEmails, isCaptain } from '../src/lib/captains'
import {
  PROGRAMS,
  DEFAULT_TEAM_SLUG,
  livePrograms,
  isMultiProgram,
  programBySlug,
  programForTeam,
} from '../src/lib/teams/programs'
import { memberBookEntries } from '../src/lib/member-book/data'
import { getMemberProgram } from '../src/lib/member-book/helpers'
import { filterPublicMembers, DEFAULT_PUBLIC_FILTERS } from '../src/lib/member-book/filters'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

console.log('\n── 1967: the appearance and the hosting detail ──')
const note = PENN_GOLF_HISTORICAL_NOTES.find(n => n.year === 1967)
ok('a 1967 note exists', Boolean(note))
ok('it says Penn hosted', note?.title.toLowerCase().includes('hosted') === true, note?.title)
ok('it names Shawnee on the Delaware',
  note?.detail.includes('Shawnee on the Delaware') === true)
ok('it names Bob Hays', note?.detail.includes('Bob Hays') === true)
ok('it does NOT claim Hays was awarded the tournament',
  !/award/i.test(`${note?.title} ${note?.detail}`))
ok('1967 counts as an NCAA appearance',
  (NCAA_CHAMPIONSHIP_YEARS as readonly number[]).includes(1967))
ok('the years stay in chronological order',
  [...NCAA_CHAMPIONSHIP_YEARS].every((y, i, a) => i === 0 || a[i - 1] < y),
  NCAA_CHAMPIONSHIP_YEARS.join(' · '))
ok('the note renders as text, with no raw HTML entities',
  !/&[a-z]+;/.test(`${note?.title} ${note?.detail}`))

console.log('\n── Counts are derived, so they cannot drift ──')
const ncaa = PENN_GOLF_TRADITION.achievements.find(a => a.label.startsWith('NCAA Championship'))
const ivy = PENN_GOLF_TRADITION.achievements.find(a => a.label.startsWith('Ivy League'))
ok('NCAA card value equals the array length',
  ncaa?.value === String(NCAA_CHAMPIONSHIP_YEARS.length), ncaa?.value)
ok('NCAA card year line equals the array',
  ncaa?.detail === NCAA_CHAMPIONSHIP_YEARS.join(' · '), ncaa?.detail)
ok('Ivy card value equals the array length',
  ivy?.value === String(IVY_CHAMPIONSHIP_YEARS.length), ivy?.value)
ok('the displayed NCAA count is now 6', ncaa?.value === '6')
ok('the card description matches the count',
  ncaa?.description.includes('six seasons') === true)

const hof = readFileSync('src/app/hall-of-fame/page.tsx', 'utf8')
ok('Hall of Fame no longer redeclares the NCAA years', !hof.includes('NCAA_TEAM_YEARS = ['))
ok('Hall of Fame no longer redeclares the Ivy years', !hof.includes('IVY_YEARS = ['))
ok('Hall of Fame no longer hardcodes "5 appearances"', !hof.includes('5 appearances'))
ok('Hall of Fame renders the historical notes', hof.includes('PENN_GOLF_HISTORICAL_NOTES'))

console.log('\n── Both programs are live ──')
ok('both programs are registered', Object.keys(PROGRAMS).length === 2)
ok("men's golf is live", PROGRAMS.mens.live)
ok("women's golf went live 2026-10-31", PROGRAMS.womens.live)
ok('two programs are live', livePrograms().length === 2)
ok('isMultiProgram() is true, so the program filter appears', isMultiProgram())
ok('the default slug is unchanged', DEFAULT_TEAM_SLUG === 'penn-mens-golf')
ok('the slug still resolves', programBySlug('penn-mens-golf')?.id === 'mens')
ok('an unknown slug resolves to nothing', programBySlug('penn-squash') === null)

console.log('\n── The seeded team row still maps to men\'s golf ──')
const seeded = JSON.parse(readFileSync('data/alumni-os.json', 'utf8')).teams[0]
ok('seed has exactly the men\'s row', seeded.slug === 'penn-mens-golf', seeded.teamName)
ok('it resolves to the mens program', programForTeam(seeded).id === 'mens')
ok('a row with only gender set still resolves', programForTeam({ gender: 'Women' }).id === 'womens')
ok('an empty row falls back to mens', programForTeam({}).id === 'mens')

console.log('\n── The men\'s book is untouched, the women\'s book sits beside it ──')
ok('the Member Book still has members', memberBookEntries.length > 0, `${memberBookEntries.length}`)
// The men's import predates the `program` field and must stay that way: it
// carries a checksum over its members array.
const mensEntries = memberBookEntries.filter(m => m.program === undefined)
const womensEntries = memberBookEntries.filter(m => m.program === 'womens')
ok('every unmarked entry still reads as mens',
  mensEntries.every(m => getMemberProgram(m) === 'mens'))
ok('the men\'s book is unchanged at 346', mensEntries.length === 346, `${mensEntries.length}`)
ok('the women\'s book carries an explicit program', womensEntries.length > 0, `${womensEntries.length}`)
ok('every women\'s entry reads as womens',
  womensEntries.every(m => getMemberProgram(m) === 'womens'))
ok('no women\'s entry claims a letter year',
  womensEntries.every(m => m.letterWinner.years.length === 0))
ok('every women\'s entry is roster-sourced',
  womensEntries.every(m => m.career.verifiedRosterSeasonCount > 0))

const baseline = filterPublicMembers(memberBookEntries, DEFAULT_PUBLIC_FILTERS)
const withAll = filterPublicMembers(memberBookEntries, { ...DEFAULT_PUBLIC_FILTERS, program: 'all' })
const withMens = filterPublicMembers(memberBookEntries, { ...DEFAULT_PUBLIC_FILTERS, program: 'mens' })
const withWomens = filterPublicMembers(memberBookEntries, { ...DEFAULT_PUBLIC_FILTERS, program: 'womens' })
ok('the default filter is unchanged by the new field', baseline.length > 0, `${baseline.length} public members`)
ok("program 'all' returns the same set", withAll.length === baseline.length)
ok("program 'mens' and 'womens' partition the book",
  withMens.length + withWomens.length === baseline.length,
  `${withMens.length} + ${withWomens.length} = ${baseline.length}`)
ok("program 'womens' now returns the women's book", withWomens.length === 64, `${withWomens.length}`)
ok("program 'mens' still returns 340 public men", withMens.length === 340, `${withMens.length}`)

console.log('\n── Each program syncs from its own Penn Athletics sources ──')
ok('men and women have different schedule pages',
  PROGRAMS.mens.scheduleUrl !== PROGRAMS.womens.scheduleUrl)
ok('men and women have different news feeds',
  PROGRAMS.mens.newsFeedUrl !== PROGRAMS.womens.newsFeedUrl)
ok("the women's schedule points at womens-golf",
  PROGRAMS.womens.scheduleUrl.includes('womens-golf'))
ok("the women's feed points at wgolf",
  PROGRAMS.womens.newsFeedUrl.endsWith('wgolf'))
ok("the men's sources are unchanged",
  PROGRAMS.mens.scheduleUrl.includes('mens-golf') && PROGRAMS.mens.newsFeedUrl.endsWith('mgolf'))

console.log('\n── The women\'s record book stands on its own ──')
ok('women have two Ivy titles', WOMENS_IVY_CHAMPIONSHIP_YEARS.length === 2,
  WOMENS_IVY_CHAMPIONSHIP_YEARS.join(' · '))
ok('women have two NCAA Regional appearances', WOMENS_NCAA_REGIONAL_YEARS.length === 2)
ok('no women\'s year is borrowed from the men\'s book',
  WOMENS_IVY_CHAMPIONSHIP_YEARS.every(y => !IVY_CHAMPIONSHIP_YEARS.includes(y as never)))
ok('the men\'s book is untouched: 4 Ivy, 6 NCAA',
  IVY_CHAMPIONSHIP_YEARS.length === 4 && NCAA_CHAMPIONSHIP_YEARS.length === 6)
ok('every women\'s achievement carries a year line',
  PENN_WOMENS_GOLF_TRADITION.achievements.every(a => a.detail.trim().length > 0))
ok('exactly one women\'s achievement is featured',
  PENN_WOMENS_GOLF_TRADITION.achievements.filter(a => a.featured).length === 1)
ok('the women\'s notes are dated', PENN_WOMENS_GOLF_HISTORICAL_NOTES.every(n => n.year > 1900))
ok('women went varsity in 1999, a century after the men', WOMENS_FOUNDED_YEAR === 1999)
ok('the five unpublished seasons are named', WOMENS_UNPUBLISHED_SEASONS.length === 5,
  WOMENS_UNPUBLISHED_SEASONS.join(', '))

console.log('\n── A women\'s captain can be granted access without touching the men\'s ──')
ok('the women\'s team has a captain list', Array.isArray(getCaptainEmails('penn-womens-golf')))
ok('nobody runs the women\'s side yet', getCaptainEmails('penn-womens-golf').length === 0)
ok('the men\'s captain is still set', getCaptainEmails('penn-mens-golf').length > 0)
ok('the men\'s captain is NOT a women\'s captain',
  !isCaptain(getCaptainEmails('penn-mens-golf')[0], 'penn-womens-golf'))

console.log(`\n${pass.length} passed, ${fail.length} failed`)
if (fail.length) {
  console.log('FAILED:', fail.join(' | '))
  process.exit(1)
}
