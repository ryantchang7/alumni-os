/**
 * Captain-only API for editing site content slots.
 *
 *  - GET returns the full slots registry + current values (override OR default).
 *  - PUT body `{ slotId, value }` saves a new override. Empty string clears it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isCaptain } from '@/lib/captains'
import { CONTENT_SLOTS, getSlotById } from '@/lib/site-content/slots'
import { getAllSiteContent, setSiteContent } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const session = await auth()
  if (!isCaptain(session?.user?.email, TEAM_SLUG)) {
    return NextResponse.json({ error: 'Captains only' }, { status: 403 })
  }
  const overrides = await getAllSiteContent()
  const slots = CONTENT_SLOTS.map(s => ({
    ...s,
    current: overrides[s.id] ?? s.default,
    override: overrides[s.id] ?? null,
  }))
  return NextResponse.json({ slots })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!isCaptain(session?.user?.email, TEAM_SLUG)) {
    return NextResponse.json({ error: 'Captains only' }, { status: 403 })
  }
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
