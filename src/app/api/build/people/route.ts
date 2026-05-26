import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const { getTeamBySlug, getPeopleForTeam, getTeamMembershipsForTeam } = await import(
    '@/lib/store/local-store'
  )

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const [people, memberships] = await Promise.all([
    getPeopleForTeam(team.id),
    getTeamMembershipsForTeam(team.id),
  ])

  const result = people.map(person => {
    const m = memberships.find(mem => mem.personId === person.id)
    return {
      personId: person.id,
      canonicalName: person.canonicalName,
      classLabel: m?.classLabel ?? null,
      hometown: m?.hometown ?? null,
      publishedToNetwork: m?.publishedToNetwork ?? false,
      publishedAt: m?.publishedAt ?? null,
    }
  })

  return NextResponse.json({ people: result, teamSlug })
}
