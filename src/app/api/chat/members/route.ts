/**
 * Lists approved members (signed-in + linked) on the team. Used by the
 * chat /new picker. Returns accountId + display name + class label.
 * Members-only.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ members: [] })

  const store = await readStore()
  const personById = new Map(store.people.map(p => [p.id, p]))
  const membershipByPersonId = new Map(
    store.teamMemberships.filter(m => m.teamId === team.id).map(m => [m.personId, m]),
  )

  const members = store.accounts
    .filter(a => a.teamId === team.id && a.linkedPersonId && a.id !== session.accountId)
    .map(a => {
      const person = a.linkedPersonId ? personById.get(a.linkedPersonId) : undefined
      const membership = a.linkedPersonId ? membershipByPersonId.get(a.linkedPersonId) : undefined
      return {
        accountId: a.id,
        personId: a.linkedPersonId,
        name: person?.canonicalName ?? a.name ?? 'Penn Golf Member',
        classLabel: membership?.classLabel,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ members })
}
