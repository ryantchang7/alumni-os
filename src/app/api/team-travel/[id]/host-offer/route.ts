/**
 * POST /api/team-travel/[id]/host-offer
 *
 * An approved member offers to host the team at a travel stop. Notifies the
 * founders and the current players (in-app + web push).
 * Body: { message?: string, byLocation?: string }.
 */

import { NextResponse } from 'next/server'
import { addTravelHostOffer, getAccountById, readStore } from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'
import { requireApprovedMember } from '@/lib/auth/guards'
import { FOUNDER_EMAILS } from '@/lib/badges'

const TEAM_SLUG = 'penn-mens-golf'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const byLocation = typeof body.byLocation === 'string' ? body.byLocation.trim() : ''
  if (message.length > 1000) return NextResponse.json({ error: 'Message too long (1000 max).' }, { status: 400 })
  if (byLocation.length > 120) return NextResponse.json({ error: 'Location too long.' }, { status: 400 })

  const account = await getAccountById(gate.session.accountId!)
  const byName = account?.name || gate.session.user?.name || 'A member'

  const offer = await addTravelHostOffer({
    travelStopId: id,
    byAccountId: gate.session.accountId!,
    byName,
    byLocation: byLocation || undefined,
    message: message || undefined,
  })
  if (!offer) {
    return NextResponse.json({ error: 'Travel stop not found.' }, { status: 404 })
  }

  // Notify founders + current players.
  try {
    const store = await readStore()
    const stop = store.teamTravelStops.find(s => s.id === id)
    const team = store.teams.find(t => t.slug === TEAM_SLUG)
    const playerPersonIds = new Set(
      team
        ? store.teamMemberships
            .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
            .map(m => m.personId)
        : [],
    )
    const recipientIds = store.accounts
      .filter(
        a =>
          FOUNDER_EMAILS.has(a.email.toLowerCase().trim()) ||
          (a.linkedPersonId && playerPersonIds.has(a.linkedPersonId)),
      )
      .map(a => a.id)
    if (recipientIds.length > 0) {
      await notifyMany(
        recipientIds,
        {
          type: 'host_offer',
          title: 'An alum offered to host the team',
          body: `${byName}${byLocation ? ` (${byLocation})` : ''}${stop ? ` — ${stop.eventName}` : ''}`,
          href: '/team/travel',
        },
        { excludeAccountId: gate.session.accountId! },
      )
    }
  } catch (err) {
    console.warn('[host-offer] notify failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, offer }, { status: 201 })
}
