import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { requireApprovedMember } from '@/lib/auth/guards'

export async function GET(request: Request) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const store = await readStore()

  const currentPlayers = store.teamMemberships
    .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
    .map(m => {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) return null
      return {
        personId: person.id,
        canonicalName: person.canonicalName,
        firstName: person.firstName,
        lastName: person.lastName,
        hometown: m.hometown,
        highSchool: m.highSchool,
        classLabel: m.classLabel,
        memberRole: 'current_player' as const,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const recentAlumni = store.teamMemberships
    .filter(m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true)
    .sort((a, b) => {
      const ay = a.rosterEndYear ?? a.rosterStartYear ?? 0
      const by = b.rosterEndYear ?? b.rosterStartYear ?? 0
      return by - ay
    })
    .slice(0, 8)
    .map(m => {
      const person = store.people.find(p => p.id === m.personId)
      if (!person) return null
      return {
        personId: person.id,
        canonicalName: person.canonicalName,
        firstName: person.firstName,
        lastName: person.lastName,
        hometown: m.hometown,
        highSchool: m.highSchool,
        classLabel: m.classLabel,
        rosterEndYear: m.rosterEndYear,
        memberRole: 'alumni' as const,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return NextResponse.json({ currentPlayers, recentAlumni })
}
