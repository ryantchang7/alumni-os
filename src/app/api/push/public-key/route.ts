/**
 * GET /api/push/public-key — the VAPID public key the browser needs to
 * subscribe to Web Push. Returns { key: <base64> | null }. `null` means Web
 * Push is not configured server-side, so the client hides the "Turn on
 * notifications" affordance and in-app notifications still work on their own.
 *
 * Prefers NEXT_PUBLIC_VAPID_PUBLIC_KEY (the documented client value) and falls
 * back to VAPID_PUBLIC_KEY so a single env var is enough to light it up.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'

export async function GET() {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  const key =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? null
  return NextResponse.json({ key })
}
