import { NextRequest, NextResponse } from 'next/server'
import { isPublishRole } from '@/lib/access/dev-permissions'

export async function POST(request: NextRequest) {
  let body: { teamSlug?: string; personId?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, role } = body

  if (!teamSlug || !personId || !role) {
    return NextResponse.json({ error: 'teamSlug, personId, and role are required' }, { status: 400 })
  }

  if (!isPublishRole(role)) {
    return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
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
