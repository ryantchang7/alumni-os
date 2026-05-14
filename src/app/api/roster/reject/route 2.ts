import { NextResponse } from 'next/server'
import { rejectRosterEntries } from '@/lib/store/local-store'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { entryIds } = (body ?? {}) as Record<string, unknown>

  if (!entryIds) {
    return NextResponse.json({ error: 'Missing required field: entryIds' }, { status: 400 })
  }

  if (!Array.isArray(entryIds) || entryIds.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'entryIds must be an array of strings' }, { status: 400 })
  }

  const rejectedCount = await rejectRosterEntries(entryIds as string[])
  return NextResponse.json({ rejectedCount })
}
