import { NextResponse } from 'next/server'
import { getTeamBySlug, rejectRosterEntries } from '@/lib/store/local-store'
import { requireFounder } from '@/lib/auth/guards'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, entryIds } = (body ?? {}) as Record<string, unknown>

  if (!teamSlug || !entryIds) {
    return NextResponse.json(
      { error: 'Missing required fields: teamSlug, entryIds' },
      { status: 400 },
    )
  }

  if (!Array.isArray(entryIds) || entryIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'entryIds must be an array of strings' }, { status: 400 })
  }

  const team = await getTeamBySlug(String(teamSlug))
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const rejectedCount = await rejectRosterEntries(entryIds as string[])
  return NextResponse.json({ rejectedCount })
}
