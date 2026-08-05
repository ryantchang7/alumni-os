/**
 * POST /api/spotlight-nominations
 *
 * Any approved member can nominate someone to be the next spotlight. Stored,
 * and the founders are notified so they can curate. Rate-limited, fail-open.
 * Body: { nomineeName: string, reason?: string }.
 */

import { NextResponse } from 'next/server'
import { addSpotlightNomination, getAccountById, readStore } from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'
import { requireApprovedMember } from '@/lib/auth/guards'
import { checkRateLimit, ipFromRequest } from '@/lib/rate-limit'
import { FOUNDER_EMAILS } from '@/lib/badges'

export async function POST(request: Request) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const ip = ipFromRequest(request)
  const rate = await checkRateLimit(`spotnom:${ip}`, 5, 600)
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many nominations, try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const nomineeName = typeof body.nomineeName === 'string' ? body.nomineeName.trim() : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!nomineeName) return NextResponse.json({ error: 'A name is required.' }, { status: 400 })
  if (nomineeName.length > 120) return NextResponse.json({ error: 'Name too long.' }, { status: 400 })
  if (reason.length > 1000) return NextResponse.json({ error: 'Reason too long (1000 max).' }, { status: 400 })

  const account = await getAccountById(gate.session.accountId!)
  const byName = account?.name || gate.session.user?.name || 'A member'

  await addSpotlightNomination({
    nomineeName,
    reason: reason || undefined,
    byAccountId: gate.session.accountId!,
    byName,
  })

  // Notify founders so they can curate.
  try {
    const store = await readStore()
    const founderIds = store.accounts
      .filter(a => FOUNDER_EMAILS.has(a.email.toLowerCase().trim()))
      .map(a => a.id)
    if (founderIds.length > 0) {
      await notifyMany(founderIds, {
        type: 'request',
        title: 'New spotlight nomination',
        body: `${byName} nominated ${nomineeName}`,
        href: '/spotlight',
      })
    }
  } catch (err) {
    console.warn('[spotlight-nominations] notify failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true })
}
