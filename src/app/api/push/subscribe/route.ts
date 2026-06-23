/**
 * POST /api/push/subscribe — store a Web Push subscription for the caller.
 * Body is a serialized PushSubscription from the browser:
 *   { endpoint: string, keys: { p256dh: string, auth: string } }
 *
 * Deduped by endpoint (re-subscribing the same browser refreshes the row).
 * Scoped to the caller's account.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { addPushSubscription } from '@/lib/store/local-store'

export async function POST(request: Request) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate the subscription shape (endpoint + keys.p256dh + keys.auth).
  const sub = body as {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  }
  const endpoint = typeof sub.endpoint === 'string' ? sub.endpoint : ''
  const p256dh = typeof sub.keys?.p256dh === 'string' ? sub.keys.p256dh : ''
  const auth = typeof sub.keys?.auth === 'string' ? sub.keys.auth : ''

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: 'A subscription with endpoint and keys.{p256dh,auth} is required' },
      { status: 400 },
    )
  }
  // Endpoints are URLs at the push service; cap length to protect the blob.
  if (endpoint.length > 1024) {
    return NextResponse.json({ error: 'endpoint too long' }, { status: 400 })
  }

  const record = await addPushSubscription({
    accountId: g.session.accountId!,
    endpoint,
    keys: { p256dh, auth },
  })

  return NextResponse.json({ ok: true, id: record.id }, { status: 201 })
}
