import { NextResponse } from 'next/server'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { badgesForPerson } from '@/lib/badges'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

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

  const store = await readStore()

  // All published visible members — current players AND alumni
  const publishedMemberships = store.teamMemberships.filter(
    m => m.teamId === team.id && m.publishedToNetwork === true,
  )

  const profiles = publishedMemberships
    .map(membership => {
      const person = store.people.find(p => p.id === membership.personId)
      if (!person) return null

      const enrichment = store.personEnrichments.find(
        e => e.personId === person.id && e.teamId === team.id,
      )

      if (enrichment?.visibleToPlayers === false) return null

      const hasCareer = !!(enrichment?.currentRole || enrichment?.currentCompany)

      const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)
      // Prefer the alum's manually-set photo; fall back to their Google avatar.
      const linkedAccount = store.accounts.find(a => a.linkedPersonId === person.id)
      const photoUrl = enrichment?.photoUrl ?? linkedAccount?.image ?? null
      return {
        personId: person.id,
        canonicalName: person.canonicalName,
        firstName: person.firstName,
        lastName: person.lastName,
        bookId: bookEntry?.id ?? null,
        photoUrl,
        memberRole: membership.memberRole ?? 'alumni',
        memberStatus: membership.memberStatus,
        parentRelationship: membership.parentRelationship,
        badges: badgesForPerson(person.id, store.accounts),
        classLabel: membership.classLabel,
        classYearEstimate: membership.classYearEstimate,
        rosterStartYear: membership.rosterStartYear,
        rosterEndYear: membership.rosterEndYear,
        rosterYearsLabel: rosterYearsLabel(membership.rosterStartYear, membership.rosterEndYear),
        hometown: membership.hometown,
        highSchool: membership.highSchool,
        publishedAt: membership.publishedAt,
        // Industry surfaced at the top level so /member-book's
        // ?industry= filter can match without parsing the nested career
        // object. Comma-separated string ("Finance, Tech, Real Estate").
        industry: enrichment?.industry,
        career: hasCareer
          ? {
              currentRole: enrichment?.currentRole,
              currentCompany: enrichment?.currentCompany,
              city: enrichment?.city,
              state: enrichment?.state,
            }
          : undefined,
        bio: enrichment?.alumniBio,
        helpTopics: enrichment?.helpTopics,
        contactPreference: enrichment?.contactPreference,
        openToGolfRounds: enrichment?.openToGolfRounds,
        openToCoffee: enrichment?.openToCoffee,
        openToMentorship: enrichment?.openToMentorship,
        openToWarmIntroductions: enrichment?.openToWarmIntroductions,
        availabilityLevel: enrichment?.availabilityLevel,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  return NextResponse.json({ profiles })
}
