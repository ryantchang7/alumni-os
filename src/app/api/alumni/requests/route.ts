import { NextResponse } from 'next/server'

// TODO: Production must verify the logged-in alumni owns personId.
// For now this is dev-mode only — personId is passed as a query param.

const PURPOSE_LABELS: Record<string, string> = {
  career_advice: 'Career advice',
  coffee_chat: 'Coffee chat',
  mentorship: 'Mentorship',
  golf_connection: 'Golf connection',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')
  const personId = searchParams.get('personId')

  if (!teamSlug || !personId) {
    return NextResponse.json(
      { error: 'teamSlug and personId are required' },
      { status: 400 },
    )
  }

  const { getTeamBySlug, getTeamMembershipsForTeam, getRequestsForAlumni } = await import(
    '@/lib/store/local-store'
  )

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  // Verify this person is on the team
  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === personId)
  if (!membership) {
    return NextResponse.json({ error: 'Person not found on this team' }, { status: 404 })
  }

  const rawRequests = await getRequestsForAlumni(team.id, personId)

  const requests = rawRequests
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(r => ({
      id: r.id,
      fromName: r.fromName,
      purposeKey: r.purpose,
      purposeLabel: PURPOSE_LABELS[r.purpose] ?? r.purpose,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
    }))

  return NextResponse.json({ requests, count: requests.length })
}
