import { NextResponse } from 'next/server'
import { updateProfileClaimRequestStatus } from '@/lib/store/local-store'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status } = body as Record<string, unknown>
  if (status !== 'approved' && status !== 'declined' && status !== 'pending') {
    return NextResponse.json(
      { error: 'status must be approved, declined, or pending' },
      { status: 400 },
    )
  }

  const updated = await updateProfileClaimRequestStatus(id, status)
  if (!updated) {
    return NextResponse.json({ error: 'Claim request not found' }, { status: 404 })
  }

  return NextResponse.json({ claim: updated })
}
