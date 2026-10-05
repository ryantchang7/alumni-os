/**
 * Unit tests for the stats-sheet reader.
 *
 * The cases that matter are the ones that quietly produce a wrong table
 * rather than an error: a player name containing a comma, a spreadsheet's
 * trailing empty columns, and scoring averages that arrive as long floats.
 *
 *   npx tsx scripts/test-season-sheet.ts
 */

import ExcelJS from 'exceljs'
import { parseSheet, MAX_TABLE_ROWS } from '../src/lib/season/parse-sheet'

const pass: string[] = []
const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  ;(cond ? pass : fail).push(label)
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer

async function main() {
  console.log('\n── CSV ──')
  const csv = [
    'Player,Rounds,Average,Low',
    'Kayden Wang,6,72.5,68',
    '"Chang, Ryan",6,74.0,71',
    'Arjun Caprihan,5,73.2,70',
  ].join('\n')
  const t = await parseSheet('qualifying.csv', enc(csv), csv)
  ok('reads the header', t.columns.join('|') === 'Player|Rounds|Average|Low', t.columns.join('|'))
  ok('reads every row', t.rows.length === 3, String(t.rows.length))
  ok(
    'a comma inside a quoted name does not split the row',
    t.rows[1][0] === 'Chang, Ryan' && t.rows[1][1] === '6',
    t.rows[1].join('|'),
  )

  console.log('\n── Things that should be refused ──')
  await parseSheet('notes.pdf', enc(''), '')
    .then(() => ok('rejects a non-spreadsheet', false))
    .catch(e => ok('rejects a non-spreadsheet', /xlsx or a .csv/i.test(e.message), e.message))
  await parseSheet('old.xls', enc(''), '')
    .then(() => ok('explains the old .xls format', false))
    .catch(e => ok('explains the old .xls format', /save as/i.test(e.message), e.message))
  await parseSheet('header-only.csv', enc('Player,Average'), 'Player,Average')
    .then(() => ok('refuses a sheet with no data rows', false))
    .catch(e => ok('refuses a sheet with no data rows', /header row/i.test(e.message)))

  console.log('\n── XLSX ──')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Averages')
  ws.addRow(['Player', 'Rounds', 'Average', '', ''])
  ws.addRow(['Kayden Wang', 6, 72.5, '', ''])
  ws.addRow(['Hayden Adams', 6, 73.333333333, '', ''])
  ws.addRow(['', '', '', '', ''])
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer
  const x = await parseSheet('averages.xlsx', buf, null)
  ok('reads an xlsx header', x.columns.join('|') === 'Player|Rounds|Average', x.columns.join('|'))
  ok('drops trailing empty columns', x.columns.length === 3, String(x.columns.length))
  ok('drops fully empty rows', x.rows.length === 2, String(x.rows.length))
  ok('keeps a clean integer', x.rows[0][1] === '6', x.rows[0][1])
  ok('rounds a long float', x.rows[1][2] === '73.333', x.rows[1][2])

  console.log('\n── Size ──')
  const many = ['Player,Average', ...Array.from({ length: 80 }, (_, i) => `P${i},70.${i}`)].join('\n')
  const big = await parseSheet('big.csv', enc(many), many)
  ok(`keeps at most ${MAX_TABLE_ROWS} rows`, big.rows.length === MAX_TABLE_ROWS, String(big.rows.length))
  ok('says when it trimmed', big.truncated === true)

  console.log(`\n${pass.length} passed, ${fail.length} failed`)
  if (fail.length) {
    console.log('FAILED:', fail.join(' | '))
    process.exit(1)
  }
}

main()
