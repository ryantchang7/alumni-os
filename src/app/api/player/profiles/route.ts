import { NextResponse } from 'next/server'
import { getTeamBySlug, getPublishedPeopleForTeam, readStore } from '@/lib/store/local-store'

function rosterYearsLabel(start?: number, end?: number): string {
  if (start !== undefined && end !== undefined) return `${start}–${end}`
  if (start !== undefined) return String(start)
  return '—'
}

export async function GET(request: Request) {
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
  const store = await readStore()

  const profiles = published.map(({ person, membership }) => {
    const enrichment = store.personEnrichments.find(
      e => e.personId === person.id && e.teamId === team.id,
    )

    const isVerified =
      enrichment?.verificationStatus === 'source_backed' ||
      enrichment?.verificationStatus === 'manually_verified'

    return {
      personId: person.id,
      canonicalName: person.canonicalName,
      firstName: person.firstName,
      lastName: person.lastName,
      classLabel: membership.classLabel,
      rosterStartYear: membership.rosterStartYear,
      rosterEndYear: membership.rosterEndYear,
      rosterYearsLabel: rosterYearsLabel(membership.rosterStartYear, membership.rosterEndYear),
      hometown: membership.hometown,
      highSchool: membership.highSchool,
      publishedAt: membership.publishedAt,
      career: isVerified && (enrichment?.currentRole || enrichment?.currentCompany)
        ? {
            currentRole: enrichment?.currentRole,
            currentCompany: enrichment?.currentCompany,
            city: enrichment?.city,
          }
        : undefined,
      alumniBio: enrichment?.alumniBio,
      helpTopics: enrichment?.helpTopics,
      contactPreference: enrichment?.contactPreference,
      visibleToPlayers: enrichment?.visibleToPlayers ?? true,
    }
  }).filter(p => p.visibleToPlayers !== false)

  return NextResponse.json({ profiles })
}
