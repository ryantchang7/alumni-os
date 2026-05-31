/**
 * Founder-only API for editing site content slots.
 *
 *  - GET returns the full slots registry + current values (override OR default).
 *  - PUT body `{ slotId, value }` saves a new override. Empty string clears it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { CONTENT_SLOTS, getSlotById } from '@/lib/site-content/slots'
import { getAllSiteContent, setSiteContent } from '@/lib/store/local-store'

export async function GET() {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const overrides = await getAllSiteContent()
  const slots = CONTENT_SLOTS.map(s => ({
    ...s,
    current: overrides[s.id] ?? s.default,
    override: overrides[s.id] ?? null,
  }))
  return NextResponse.json({ slots })
}

export async function PUT(request: NextRequest) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { slotId, value } = (body ?? {}) as { slotId?: string; value?: string }
  if (typeof slotId !== 'string' || !getSlotById(slotId)) {
    return NextResponse.json({ error: 'Unknown slotId' }, { status: 400 })
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value must be a string' }, { status: 400 })
  }
  if (value.length > 8000) {
    return NextResponse.json({ error: 'value too long (max 8000 chars)' }, { status: 400 })
  }
  await setSiteContent(slotId, value)
  return NextResponse.json({ ok: true })
}
