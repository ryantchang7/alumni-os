/**
 * GET /api/member-book/options — lightweight [{bookId, name}] list of every
 * public Member Book entry, for tag pickers. Covers ALL members, claimed or
 * not (most of the book is unclaimed pre-launch). Members-only.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers } from '@/lib/member-book/helpers'

export async function GET() {
  const gate = await requireApprovedMember()
  if (!gate.ok) return NextResponse.json({ members: [] })
  const members = getPublicMembers(memberBookEntries).map((m) => ({
    bookId: m.id,
    name: m.displayName,
  }))
  return NextResponse.json({ members })
}
