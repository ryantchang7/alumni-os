/**
 * PATCH /api/account/claim-setup — a pending member answers two quick
 * questions while their claim is in the queue.
 *
 * Deliberately writes to the CLAIM, not to enrichment: a pending user has no
 * linkedPersonId, and /api/alumni/self-profile correctly refuses them. The
 * answers are applied to their profile at approval time. Callers can only
 * touch their own pending claim.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readStore, updateProfileClaimSetup } from '@/lib/store/local-store'

const OPEN_TO = ['golf', 'coffee', 'mentorship', 'intros'] as const
type OpenTo = (typeof OPEN_TO)[number]

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 120) : ''
  const state = typeof body.state === 'string' ? body.state.trim().slice(0, 40) : ''
  const openTo = Array.isArray(body.openTo)
    ? (body.openTo as unknown[]).filter((x): x is OpenTo =>
        typeof x === 'string' && OPEN_TO.includes(x as OpenTo),
      )
    : []

  if (!city && openTo.length === 0) {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
  }

  // Only their own pending claim.
  const store = await readStore()
  const claim = store.profileClaimRequests.find(
    r => r.requesterAccountId === session.accountId && r.status === 'pending',
  )
  if (!claim) {
    return NextResponse.json({ error: 'No pending claim' }, { status: 404 })
  }

  const updated = await updateProfileClaimSetup(claim.id, {
    setupCity: city || undefined,
    setupState: state || undefined,
    setupOpenTo: openTo.length > 0 ? openTo : undefined,
  })
  if (!updated) {
    return NextResponse.json({ error: 'Could not save' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
