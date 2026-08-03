import { NextRequest, NextResponse } from 'next/server'
import { getApprovalState } from '@/lib/access/approval'

export async function GET(request: NextRequest) {
  const approval = await getApprovalState()
  if (!approval.approved) {
    return NextResponse.json({ profiles: [] })
  }

  const teamSlug = request.nextUrl.searchParams.get('teamSlug')
  if (!teamSlug) {
    return NextResponse.json({ error: 'teamSlug is required' }, { status: 400 })
  }

  const { getTeamBySlug, getPublishedPeopleForTeam, getPersonEnrichment } = await import(
    '@/lib/store/local-store'
  )
  const { buildPublishedProfile } = await import('@/lib/network/publication')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const published = await getPublishedPeopleForTeam(team.id)

  const profiles = await Promise.all(
    published.map(async ({ person, membership }) => {
      const enrichment = await getPersonEnrichment(person.id, team.id)
      return buildPublishedProfile(person, membership, enrichment)
    }),
  )

  return NextResponse.json({ profiles })
}
