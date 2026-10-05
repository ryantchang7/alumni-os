/**
 * Turn an uploaded spreadsheet into a small table the site can render.
 *
 * Built for qualifying and tournament averages: a header row and a few dozen
 * rows of names and numbers. Anything bigger is not a post, it is a
 * spreadsheet, and belongs behind a link rather than on a card.
 *
 * CSV is parsed here with no dependency, because it is a format you can read
 * correctly in forty lines and a parser is a liability you carry forever.
 * XLSX goes through ExcelJS, which is the only part of this that needs one.
 */

export interface SeasonTable {
  /** Header row, already trimmed. */
  columns: string[]
  /** Body rows, each the same length as columns. */
  rows: string[][]
  /** Original file name, shown under the table. */
  fileName: string
  /** True when the sheet was longer than we kept. */
  truncated: boolean
}

export const MAX_TABLE_ROWS = 40
export const MAX_TABLE_COLS = 10

/** Numbers arrive from spreadsheets as floats with long tails. */
function cellToText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000)
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    // ExcelJS hands back rich text and formula cells as objects.
    const o = v as { text?: unknown; result?: unknown; richText?: Array<{ text?: string }> }
    if (Array.isArray(o.richText)) return o.richText.map(r => r.text ?? '').join('')
    if (o.text !== undefined) return cellToText(o.text)
    if (o.result !== undefined) return cellToText(o.result)
    return ''
  }
  return String(v)
}

/**
 * One CSV line into fields, honouring quotes and doubled quotes inside them.
 * Splitting on commas alone turns "Chang, Ryan" into two players.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(splitCsvLine)
}

async function parseXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  const ws = wb.worksheets[0]
  if (!ws) return []
  const grid: string[][] = []
  ws.eachRow({ includeEmpty: false }, row => {
    const vals = Array.isArray(row.values) ? row.values.slice(1) : []
    grid.push(vals.map(cellToText))
  })
  return grid
}

/** Trim trailing empty columns and rows a spreadsheet leaves behind. */
function tidy(grid: string[][]): string[][] {
  const rows = grid.filter(r => r.some(c => c.trim().length > 0))
  if (rows.length === 0) return []
  const width = Math.max(...rows.map(r => r.length))
  let lastUsed = -1
  for (let c = 0; c < width; c++) {
    if (rows.some(r => (r[c] ?? '').trim().length > 0)) lastUsed = c
  }
  return rows.map(r =>
    Array.from({ length: lastUsed + 1 }, (_, c) => (r[c] ?? '').trim()),
  )
}

/**
 * Parse an uploaded sheet. Throws with a message meant to be shown, because
 * the person who sees it is the person who picked the file.
 */
export async function parseSheet(
  fileName: string,
  bytes: ArrayBuffer,
  text: string | null,
): Promise<SeasonTable> {
  const lower = fileName.toLowerCase()
  const isCsv = lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')
  const isXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xlsm')

  if (!isCsv && !isXlsx) {
    throw new Error(
      lower.endsWith('.xls')
        ? 'That is the old .xls format. Open it in Excel and save as .xlsx or .csv.'
        : 'Upload a .xlsx or a .csv.',
    )
  }

  let grid = isCsv ? parseCsv(text ?? '') : await parseXlsx(bytes)
  grid = tidy(grid)

  if (grid.length < 2) {
    throw new Error('That sheet needs a header row and at least one row under it.')
  }

  const truncated = grid.length - 1 > MAX_TABLE_ROWS || grid[0].length > MAX_TABLE_COLS
  const columns = grid[0].slice(0, MAX_TABLE_COLS)
  const rows = grid
    .slice(1, 1 + MAX_TABLE_ROWS)
    .map(r =>
      Array.from({ length: columns.length }, (_, c) => r[c] ?? ''),
    )

  return { columns, rows, fileName, truncated }
}
