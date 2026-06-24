import { NextRequest, NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'

export async function POST(request: NextRequest) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: { teamSlug?: string; personId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId } = body

  if (!teamSlug || !personId) {
    return NextResponse.json({ error: 'teamSlug and personId are required' }, { status: 400 })
  }

  const { getTeamBySlug, unpublishMembershipFromNetwork } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const ok = await unpublishMembershipFromNetwork(team.id, personId)
  if (!ok) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
  }

  return NextResponse.json({ unpublished: true })
}
