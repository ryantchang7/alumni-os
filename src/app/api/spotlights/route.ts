/**
 * GET  /api/spotlights         — returns the current (newest) spotlight.
 *                                Approved members only (consistent with the
 *                                rest of the members-only surfaces).
 * POST /api/spotlights         — captain/founder features an alum.
 *
 * Body for POST: { personId: string, headline?: string, blurb: string }.
 */

import { NextResponse } from 'next/server'
import { createSpotlight, getAccountById, getSpotlights, readStore } from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'
import { requireApprovedMember, requireCaptain } from '@/lib/auth/guards'

export async function GET() {
  // Anonymous visitors get an empty 200, not a 401 — the homepage calls this
  // for everyone, and a red 401 in the console reads as breakage.
  const gate = await requireApprovedMember()
  if (!gate.ok) return NextResponse.json({ spotlight: null })
  const spotlights = await getSpotlights()
  const current = spotlights[0] ?? null
  return NextResponse.json({ spotlight: current })
}

export async function POST(request: Request) {
  const gate = await requireCaptain()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const personId = typeof body.personId === 'string' ? body.personId.trim() : ''
  const blurb = typeof body.blurb === 'string' ? body.blurb.trim() : ''
  const headline = typeof body.headline === 'string' ? body.headline.trim() : ''
  if (!personId) return NextResponse.json({ error: 'personId is required.' }, { status: 400 })
  if (!blurb) return NextResponse.json({ error: 'A blurb is required.' }, { status: 400 })
  if (blurb.length > 1200) return NextResponse.json({ error: 'Blurb too long (1200 max).' }, { status: 400 })

  const store = await readStore()
  const person = store.people.find(p => p.id === personId)
  if (!person) return NextResponse.json({ error: 'Person not found.' }, { status: 404 })

  const featurer = await getAccountById(gate.session.accountId!)

  const spotlight = await createSpotlight({
    personId,
    name: person.canonicalName,
    headline: headline || undefined,
    blurb,
    featuredByAccountId: gate.session.accountId!,
  })

  // Broadcast to every approved member (community type → respects mute).
  try {
    const recipientIds = store.accounts.filter(a => a.linkedPersonId).map(a => a.id)
    if (recipientIds.length > 0) {
      await notifyMany(
        recipientIds,
        {
          type: 'spotlight',
          title: `Alumni Spotlight: ${person.canonicalName}`,
          body: headline || `${blurb.slice(0, 90)}${blurb.length > 90 ? '…' : ''}`,
          href: '/spotlight',
        },
        { excludeAccountId: featurer?.id },
      )
    }
  } catch (err) {
    console.warn('[spotlights] broadcast failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, spotlight }, { status: 201 })
}
