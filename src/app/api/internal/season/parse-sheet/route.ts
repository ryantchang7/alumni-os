/**
 * Read an uploaded spreadsheet and hand back the table it contains.
 *
 * Parsing happens here rather than in the browser so the heavy xlsx reader
 * never ships to a phone, and the result is stored as plain text on the
 * update. The file itself is not kept: once the numbers are on the card, the
 * spreadsheet has done its job, and keeping it would mean keeping a copy of
 * whatever else was on the other tabs.
 *
 * Founder/captain only, the same people who can post a season update.
 */

import { NextResponse } from 'next/server'
import { canPostSeasonUpdates } from '@/lib/auth/season-posters'
import { parseSheet } from '@/lib/season/parse-sheet'

export const dynamic = 'force-dynamic'

/** Comfortably bigger than a stats sheet, far under the function body cap. */
const MAX_SHEET_BYTES = 2 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  const gate = await canPostSeasonUpdates()
  if (!gate.ok) return NextResponse.json({ error: 'Not authorized' }, { status: 404 })

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Multipart form-data required' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file in "file" field' }, { status: 400 })
  }
  if (file.size > MAX_SHEET_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return NextResponse.json(
      { error: `That sheet is ${mb} MB. Keep it under 2 MB, or paste just the table you want shown.` },
      { status: 413 },
    )
  }

  try {
    const bytes = await file.arrayBuffer()
    const lower = file.name.toLowerCase()
    const isText =
      lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')
    const table = await parseSheet(
      file.name,
      bytes,
      isText ? new TextDecoder().decode(bytes) : null,
    )
    return NextResponse.json({ table })
  } catch (e) {
    // These messages are written to be read by the person who picked the
    // file, so they come back as 400 rather than a 500 with a stack.
    const message = e instanceof Error ? e.message : 'Could not read that file.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
