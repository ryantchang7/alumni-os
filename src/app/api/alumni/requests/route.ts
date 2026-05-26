import { NextResponse } from 'next/server'

const PURPOSE_LABELS: Record<string, string> = {
  career_advice: 'Career advice',
  coffee_chat: 'Coffee chat',
  mentorship: 'Mentorship',
  warm_introduction: 'Warm introduction',
  internship_guidance: 'Internship guidance',
  interview_prep: 'Interview prep',
  resume_review: 'Resume review',
  golf_round: 'Golf round',
  city_advice: 'City advice',
  drinks_informal: 'Drinks / informal meet',
  general_intro: 'General intro',
  golf_connection: 'Golf connection',
}

const CONTEXT_LABELS: Record<string, string> = {
  exploring_field: 'Exploring this field',
  applying_to_role: 'Applying to a role',
  in_their_city: 'Will be in your city',
  learn_their_path: 'Wants to learn about your path',
  referred: 'Referred by a teammate or coach',
  want_to_play: 'Wants to play a round',
  summer_advice: 'Looking for summer advice',
  preparing_interviews: 'Preparing for interviews',
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
      contextKey: r.context,
      contextLabel: r.context ? (CONTEXT_LABELS[r.context] ?? r.context) : undefined,
      additionalContext: r.additionalContext,
      message: r.message,
      status: r.status,
      responseMessage: r.responseMessage,
      suggestedPersonId: r.suggestedPersonId,
      suggestedPersonName: r.suggestedPersonName,
      respondedAt: r.respondedAt,
      closedAt: r.closedAt,
      createdAt: r.createdAt,
    }))

  return NextResponse.json({ requests, count: requests.length })
}
