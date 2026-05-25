import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personId: string }> },
) {
  const { personId } = await params
  const teamSlug = request.nextUrl.searchParams.get('teamSlug')
  if (!teamSlug) {
    return NextResponse.json({ error: 'teamSlug is required' }, { status: 400 })
  }

  const { getTeamBySlug, readStore, getPersonEnrichment } = await import(
    '@/lib/store/local-store'
  )
  const { buildPublishedProfile } = await import('@/lib/network/publication')

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const store = await readStore()
  const person = store.people.find(p => p.id === personId)
  if (!person) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const membership = store.teamMemberships.find(
    m => m.personId === personId && m.teamId === team.id && m.publishedToNetwork === true,
  )
  if (!membership) {
    return NextResponse.json({ error: 'Profile not published' }, { status: 404 })
  }

  const enrichment = await getPersonEnrichment(personId, team.id)
  const profile = buildPublishedProfile(person, membership, enrichment)

  return NextResponse.json({ profile })
}
