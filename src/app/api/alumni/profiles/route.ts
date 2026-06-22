import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import {
  getTeamBySlug,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
  getExtractedEntriesForTeam,
  readStore,
} from '@/lib/store/local-store'

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: Request) {
  const g = await requireFounder()
  if (!g.ok) return g.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const [people, memberships, extractedEntries, store] = await Promise.all([
    getPeopleForTeam(team.id),
    getTeamMembershipsForTeam(team.id),
    getExtractedEntriesForTeam(team.id),
    readStore(),
  ])

  const teamEnrichments = store.personEnrichments.filter(e => e.teamId === team.id)

  const promotedEntries = extractedEntries.filter(e => e.status === 'promoted')

  const profiles = people.map(person => {
    const membership = memberships.find(m => m.personId === person.id)
    const enrichment = teamEnrichments.find(e => e.personId === person.id)

    const rosterStartYear = membership?.rosterStartYear
    const rosterEndYear = membership?.rosterEndYear
    let rosterYearsLabel = '—'
    if (rosterStartYear !== undefined && rosterEndYear !== undefined) {
      rosterYearsLabel = `${rosterStartYear}–${rosterEndYear}`
    } else if (rosterStartYear !== undefined) {
      rosterYearsLabel = `${rosterStartYear}`
    }

    const hometown = membership?.hometown
    const highSchool = membership?.highSchool
    const bioUrls = membership?.bioUrls ?? []
    const sourceUrls = membership?.sourceUrls ?? []
    const confidence = membership?.confidence ?? 0

    const missingFields: string[] = []
    if (!hometown) missingFields.push('hometown')
    if (!highSchool) missingFields.push('highSchool')
    if (bioUrls.length === 0) missingFields.push('bioUrls')
    if (sourceUrls.length === 0) missingFields.push('sourceUrls')

    let status: 'ready' | 'needs-enrichment' | 'needs-review'
    if (confidence < 0.7) {
      status = 'needs-review'
    } else if (!hometown || !highSchool || bioUrls.length === 0) {
      status = 'needs-enrichment'
    } else {
      status = 'ready'
    }

    const personNorm = person.normalizedName
    const matchingPromoted = promotedEntries.filter(
      e => normalizeName(e.fullName) === personNorm,
    )

    const evidenceCount = sourceUrls.length + matchingPromoted.length

    const seasons = Array.from(
      new Set(
        matchingPromoted
          .map(e => e.seasonYear)
          .filter((s): s is string => typeof s === 'string' && s.length > 0),
      ),
    )

    let enrichmentStatus: 'none' | 'partial' | 'source_backed' | 'verified'
    if (!enrichment) {
      enrichmentStatus = 'none'
    } else if (enrichment.verificationStatus === 'manually_verified') {
      enrichmentStatus = 'verified'
    } else if (enrichment.verificationStatus === 'source_backed') {
      enrichmentStatus = 'source_backed'
    } else {
      enrichmentStatus = 'partial'
    }

    return {
      personId: person.id,
      canonicalName: person.canonicalName,
      normalizedName: person.normalizedName,
      firstName: person.firstName,
      lastName: person.lastName,
      classLabel: membership?.classLabel,
      rosterStartYear,
      rosterEndYear,
      rosterYearsLabel,
      hometown,
      highSchool,
      bioUrls,
      sourceUrls,
      confidence,
      evidenceCount,
      seasons,
      status,
      missingFields,
      enrichment: enrichment
        ? {
            currentRole: enrichment.currentRole,
            currentCompany: enrichment.currentCompany,
            industry: enrichment.industry,
            city: enrichment.city,
            state: enrichment.state,
            country: enrichment.country,
            email: enrichment.email,
            linkedinUrl: enrichment.linkedinUrl,
            personalWebsiteUrl: enrichment.personalWebsiteUrl,
            notes: enrichment.notes,
            relationshipStatus: enrichment.relationshipStatus,
            verificationStatus: enrichment.verificationStatus,
            sourceUrls: enrichment.sourceUrls,
          }
        : undefined,
      enrichmentStatus,
      publishedToNetwork: membership?.publishedToNetwork ?? false,
    }
  })

  return NextResponse.json({ team, profiles })
}
