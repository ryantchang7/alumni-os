import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import {
  getTeamBySlug,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
  getExtractedEntriesForTeam,
  getPersonEnrichment,
  getEnrichmentSourcesForPerson,
} from '@/lib/store/local-store'

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface Context {
  params: Promise<{ personId: string }>
}

export async function GET(request: Request, { params }: Context) {
  const g = await requireFounder()
  if (!g.ok) return g.response

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

  const [people, memberships, extractedEntries] = await Promise.all([
    getPeopleForTeam(team.id),
    getTeamMembershipsForTeam(team.id),
    getExtractedEntriesForTeam(team.id),
  ])

  const person = people.find(p => p.id === personId)
  if (!person) {
    return NextResponse.json(
      { error: `Person not found on team: ${personId}` },
      { status: 404 },
    )
  }

  const membership = memberships.find(m => m.personId === personId)
  if (!membership) {
    return NextResponse.json(
      { error: `No membership found for person ${personId} on team ${teamSlug}` },
      { status: 404 },
    )
  }

  const [enrichment, enrichmentSources] = await Promise.all([
    getPersonEnrichment(personId, team.id),
    getEnrichmentSourcesForPerson(personId, team.id),
  ])

  const personNorm = person.normalizedName
  const personExtractedEntries = extractedEntries.filter(
    e => normalizeName(e.fullName) === personNorm,
  )

  const hometown = membership.hometown
  const highSchool = membership.highSchool
  const bioUrls = membership.bioUrls
  const sourceUrls = membership.sourceUrls
  const confidence = membership.confidence

  const missingFields: string[] = []
  if (!hometown) missingFields.push('hometown')
  if (!highSchool) missingFields.push('highSchool')
  if (bioUrls.length === 0) missingFields.push('bioUrls')
  if (sourceUrls.length === 0) missingFields.push('sourceUrls')

  const qualityNotes: string[] = []
  if (confidence < 0.7) {
    qualityNotes.push(`Low confidence (${Math.round(confidence * 100)}%)`)
  }
  if (!hometown) qualityNotes.push('Missing hometown')
  if (!highSchool) qualityNotes.push('Missing high school')
  if (bioUrls.length === 0) qualityNotes.push('No bio URLs')
  if (sourceUrls.length === 0) qualityNotes.push('No source URLs')

  return NextResponse.json({
    team,
    person,
    membership,
    extractedEntries: personExtractedEntries,
    missingFields,
    qualityNotes,
    sourceUrls,
    bioUrls,
    enrichment: enrichment ?? null,
    enrichmentSources,
  })
}
