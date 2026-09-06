/**
 * Unit tests for the automatic result reader.
 *
 * This code writes to the live site with nobody reviewing the output, so the
 * cases that matter most are the ones where it must REFUSE: a mid-tournament
 * recap, another team's score, an individual round. A missed result is a
 * nuisance; a wrong one is a lie on the season page.
 *
 *   npx tsx scripts/test-season-results.ts
 */

import {
  parseResult,
  isFinalResultHeadline,
  pennTeamScore,
} from '../src/lib/season/parse-result'
import { nameOverlap, planResultSync } from '../src/lib/season/sync-results'
import type { TeamNewsItem, TeamTravelStop } from '../src/lib/store/types'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

const article = (desc: string, body = '') =>
  `<html><head><meta property="og:description" content="${desc}"></head><body><p>${body}</p></body></html>`

console.log('\n── Headlines that mean a tournament is over ──')
for (const t of [
  "Men's Golf Finishes Sixth at Alex Lagowitz Memorial",
  "Men's Golf Finishes Sixth at Ivy League Championship",
  "Men's Golf Wins Macdonald Cup",
]) ok(`final: ${t.slice(0, 46)}`, isFinalResultHeadline(t))

console.log('\n── Headlines that must NOT be read as a final result ──')
for (const t of [
  "Men's Golf Fifth Heading Into Final Day at Ivy Championship",
  "Men's Golf Third After Day 1 at Ivy League Championship",
  "Men's Golf Readies For Ivy Championship Friday Through Sunday",
  "Men's Golf Begins 2026 Fall Slate at Colgate's Lagowitz Memorial",
  "Men's Golf Opens Play at the Macdonald Cup",
]) ok(`interim: ${t.slice(0, 46)}`, !isFinalResultHeadline(t))

console.log('\n── Whose score is it ──')
ok(
  'takes a Penn team total',
  pennTeamScore('Penn shot 9-over-par 873 across three rounds.') === '873 (+9)',
)
ok(
  "ignores a rival's total",
  pennTeamScore('Seton Hall took first, finishing at 11-under-par 853.') === null,
)
ok(
  'ignores an individual round',
  pennTeamScore("Penn's Kayden Wang shot a 4-under-par 68 in round two.") === null,
)
ok(
  'ignores a rival named after Penn',
  pennTeamScore('Penn trailed as Harvard ended at 10-over-par 874.') === null,
)
ok(
  'reads an even-par total',
  pennTeamScore('The Quakers finished at even-par 864.') === '864 (E)',
)

console.log('\n── Whole recaps (the two real ones, reproduced) ──')
const lagowitz = parseResult(
  "Men's Golf Finishes Sixth at Alex Lagowitz Memorial",
  article(
    "The University of Pennsylvania men's golf team finished sixth out of 13 teams at the season-opening Alex Lagowitz Memorial.",
    'Penn shot 9-over-par 873 across three rounds in Hamilton. Seton Hall took home first place as a team, finishing the weekend at 11-under-par 853.',
  ),
)
ok('Lagowitz reads as "6th of 13 · 873 (+9)"', lagowitz?.resultText === '6th of 13 · 873 (+9)', String(lagowitz?.resultText))

const ivy = parseResult(
  "Men's Golf Finishes Sixth at Ivy League Championship",
  article(
    "The University of Pennsylvania men's golf team finished sixth at the Ivy League Championship.",
    "Penn shot 304 as a team in Sunday's final round and ended the weekend at 52-over-par 916. That left Harvard at 10-over-par 874.",
  ),
)
ok('Ivy reads as "6th · 916 (+52)" with no field size', ivy?.resultText === '6th · 916 (+52)', String(ivy?.resultText))

const tied = parseResult(
  "Men's Golf Finishes Third at the Macdonald Cup",
  article("Penn finished tied for third of 11 teams.", 'Penn shot 5-over-par 869.'),
)
ok('a tie reads as "T-3rd of 11"', tied?.resultText === 'T-3rd of 11 · 869 (+5)', String(tied?.resultText))

ok(
  'placing with no readable score still returns the placing',
  parseResult('Men\'s Golf Finishes Fourth at the Princeton Invitational',
    article('Penn finished fourth of 9 teams.'))?.resultText === '4th of 9',
)
ok(
  'a mid-event recap returns nothing at all',
  parseResult("Men's Golf Third After Day 1 at Ivy League Championship",
    article('Penn sits third after the opening round.', 'Penn shot 4-over-par 292.')) === null,
)

console.log('\n── Matching a recap to the right tournament ──')
ok('Lagowitz headline matches the Lagowitz stop',
  nameOverlap('Alex Lagowitz Memorial', "Men's Golf Finishes Sixth at Alex Lagowitz Memorial") >= 0.5)
ok('Lagowitz headline does NOT match the Macdonald Cup',
  nameOverlap('Macdonald Cup', "Men's Golf Finishes Sixth at Alex Lagowitz Memorial") < 0.5)
ok('generic words alone do not make a match',
  nameOverlap('Ivy League Championships', "Men's Golf Wins the Colgate Invitational") < 0.5)

async function main() {
  console.log('\n── The planner ──')
  const stop = (over: Partial<TeamTravelStop>): TeamTravelStop => ({
    id: 'a', teamId: 't', eventName: 'Alex Lagowitz Memorial', locationText: 'Hamilton, NY',
    startDate: '2026-09-05', endDate: '2026-09-06', createdAt: '', ...over,
  })
  const item = (over: Partial<TeamNewsItem>): TeamNewsItem => ({
    id: 'n', teamId: 't', sourceUrl: 'https://example.com/a',
    title: "Men's Golf Finishes Sixth at Alex Lagowitz Memorial",
    publishedAt: '2026-09-06T18:00:00.000Z', fetchedAt: '2026-09-06T19:00:00.000Z', ...over,
  })
  const html = async () => article('Penn finished sixth out of 13 teams.', 'Penn shot 9-over-par 873.')

  const finished = await planResultSync([stop({})], [item({})], html, '2026-09-07')
  ok('a finished event with a recap is matched', finished.plan[0].status === 'matched', finished.plan[0].resultText)

  const stillOn = await planResultSync([stop({})], [item({})], html, '2026-09-06')
  ok('an event ending today is left alone', stillOn.plan[0].status === 'not-finished')

  const manual = await planResultSync([stop({ resultText: '2nd of 13' })], [item({})], html, '2026-09-07')
  ok('a hand-typed result is never overwritten', manual.plan[0].status === 'already-set')

  const wrongEvent = await planResultSync(
    [stop({ eventName: 'Macdonald Cup', startDate: '2026-09-26', endDate: '2026-09-27' })],
    [item({})], html, '2026-10-01')
  ok('a recap for another event is not used', wrongEvent.plan[0].status === 'no-article')

  const stale = await planResultSync([stop({})],
    [item({ publishedAt: '2026-09-30T18:00:00.000Z' })], html, '2026-10-05')
  ok('a recap published weeks later is not used', stale.plan[0].status === 'no-article')

  console.log(`\n${pass.length} passed, ${fail.length} failed`)
  if (fail.length) {
    console.log('FAILED:', fail.join(' | '))
    process.exit(1)
  }
}

main()
