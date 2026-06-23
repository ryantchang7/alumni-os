/**
 * POST /api/notifications/read — mark the caller's notifications read.
 * Body: { id?: string, all?: boolean }
 *   - { all: true }  → marks every one of the caller's notifications read
 *   - { id: "..." }  → marks that single notification read
 *
 * Strictly scoped: the store helper only touches rows whose accountId matches
 * the caller, so a member can never mark another account's notifications read
 * (even by guessing an id).
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { markNotificationsRead } from '@/lib/store/local-store'

export async function POST(request: Request) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: { id?: unknown; all?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const all = body.all === true
  const id = typeof body.id === 'string' ? body.id : undefined

  if (!all && !id) {
    return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 })
  }

  const updated = await markNotificationsRead(g.session.accountId!, { id, all })
  return NextResponse.json({ ok: true, updated })
}
