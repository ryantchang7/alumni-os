import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProfileClaimRequestsForTeam, getTeamBySlug, readStore } from '@/lib/store/local-store'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const session = await auth()
  const store = await readStore()
  if (!isCaptainEmailWithOverrides(session?.user?.email, TEAM_SLUG, store.accounts)) {
    return NextResponse.json({ error: 'Captains only' }, { status: 403 })
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 500 })
  }

  const claims = await getProfileClaimRequestsForTeam(team.id)
  return NextResponse.json({ claims })
}
