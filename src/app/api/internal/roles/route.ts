/**
 * Founder-only role management. PATCH grants or revokes Captain access
 * and tier badges (Supporting / Founding / Family & Affiliate) without
 * a Stripe checkout.
 *
 * Gate: signed-in + email in FOUNDER_EMAILS. Anything else returns 403.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { updateAccountRoles } from '@/lib/store/local-store'

type ManualBadge = 'founding-member' | 'member' | 'parent'

function isManualBadge(v: unknown): v is ManualBadge {
  return v === 'founding-member' || v === 'member' || v === 'parent'
}

export async function PATCH(request: Request) {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email || !FOUNDER_EMAILS.has(email)) {
    return NextResponse.json({ error: 'Founder only' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const accountId = typeof body.accountId === 'string' ? body.accountId : null
  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  const patch: {
    manualCaptain?: boolean
    manualBadges?: ManualBadge[]
  } = {}

  if (typeof body.manualCaptain === 'boolean') {
    patch.manualCaptain = body.manualCaptain
  }
  if (Array.isArray(body.manualBadges)) {
    patch.manualBadges = body.manualBadges.filter(isManualBadge)
  }

  if (patch.manualCaptain === undefined && patch.manualBadges === undefined) {
    return NextResponse.json(
      { error: 'No role changes supplied' },
      { status: 400 },
    )
  }

  const updated = await updateAccountRoles(accountId, patch)
  if (!updated) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    account: {
      id: updated.id,
      email: updated.email,
      manualCaptain: updated.manualCaptain ?? false,
      manualBadges: updated.manualBadges ?? [],
    },
  })
}
