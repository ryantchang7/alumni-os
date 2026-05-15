import { NextResponse } from 'next/server'
import { getTeamBySlug, getPublishedPeopleForTeam, readStore } from '@/lib/store/local-store'

interface PageParams {
  params: Promise<{ personId: string }>
}

export async function GET(request: Request, { params }: PageParams) {
  const { personId } = await params
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const published = await getPublishedPeopleForTeam(team.id)
  const entry = published.find(({ person }) => person.id === personId)

  if (!entry) {
    return NextResponse.json({ error: 'Profile not found or not published' }, { status: 404 })
  }

  const { person, membership } = entry
  const store = await readStore()
  const enrichment = store.personEnrichments.find(
    e => e.personId === person.id && e.teamId === team.id,
  )

  if (enrichment?.visibleToPlayers === false) {
    return NextResponse.json({ error: 'Profile not found or not published' }, { status: 404 })
  }

  const hasCareer = !!(enrichment?.currentRole || enrichment?.currentCompany)

  const rosterYearsLabel =
    membership.rosterStartYear !== undefined && membership.rosterEndYear !== undefined
      ? `${membership.rosterStartYear}–${membership.rosterEndYear}`
      : membership.rosterStartYear !== undefined
        ? String(membership.rosterStartYear)
        : '—'

  return NextResponse.json({
    profile: {
      personId: person.id,
      canonicalName: person.canonicalName,
      firstName: person.firstName,
      lastName: person.lastName,
      memberRole: membership.memberRole ?? 'alumni',
      memberStatus: membership.memberStatus,
      classLabel: membership.classLabel,
      classYearEstimate: membership.classYearEstimate,
      rosterStartYear: membership.rosterStartYear,
      rosterEndYear: membership.rosterEndYear,
      rosterYearsLabel,
      hometown: membership.hometown,
      highSchool: membership.highSchool,
      publishedAt: membership.publishedAt,
      career: hasCareer
        ? {
            currentRole: enrichment?.currentRole,
            currentCompany: enrichment?.currentCompany,
            city: enrichment?.city,
            state: enrichment?.state,
          }
        : undefined,
      alumniBio: enrichment?.alumniBio,
      helpTopics: enrichment?.helpTopics,
      contactPreference: enrichment?.contactPreference,
      openToGolfRounds: enrichment?.openToGolfRounds,
      openToCoffee: enrichment?.openToCoffee,
      openToMentorship: enrichment?.openToMentorship,
      openToWarmIntroductions: enrichment?.openToWarmIntroductions,
      availabilityLevel: enrichment?.availabilityLevel,
    },
  })
}
