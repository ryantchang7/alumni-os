import { NextRequest, NextResponse } from 'next/server'

const VALID_STATUSES = ['accepted', 'declined', 'closed'] as const

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : ''
  const status = body.status as string

  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { updateClubhouseGatheringRequestStatus } = await import('@/lib/store/local-store')
  const updated = await updateClubhouseGatheringRequestStatus(
    requestId,
    status as (typeof VALID_STATUSES)[number],
  )

  if (!updated) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  return NextResponse.json({ request: updated })
}
