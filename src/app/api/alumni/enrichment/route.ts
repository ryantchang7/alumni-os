import { NextResponse } from 'next/server'
import {
  getTeamBySlug,
  getPeopleForTeam,
  getPersonEnrichment,
  getEnrichmentSourcesForPerson,
  upsertPersonEnrichment,
} from '@/lib/store/local-store'
import type { PersonEnrichment } from '@/lib/store/types'
import { requireFounder } from '@/lib/auth/guards'

const VALID_VERIFICATION_STATUSES: PersonEnrichment['verificationStatus'][] = [
  'unverified',
  'source_backed',
  'manually_verified',
  'needs_review',
]

const VALID_RELATIONSHIP_STATUSES: PersonEnrichment['relationshipStatus'][] = [
  'not_started',
  'identified',
  'drafted',
  'contacted',
  'replied',
  'met',
  'do_not_contact',
]

export async function GET(request: Request) {
  // Founder-only: this returns the raw CRM record (email, phone, LinkedIn,
  // notes, relationship status). personIds are enumerable, so leaving this
  // open made it a scriptable contact export of the whole roster.
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')
  const personId = searchParams.get('personId')

  if (!teamSlug || !personId) {
    return NextResponse.json(
      { error: 'Missing required query params: teamSlug, personId' },
      { status: 400 },
    )
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const people = await getPeopleForTeam(team.id)
  const person = people.find(p => p.id === personId)
  if (!person) {
    return NextResponse.json(
      { error: `Person not found on team: ${personId}` },
      { status: 404 },
    )
  }

  const [enrichment, sources] = await Promise.all([
    getPersonEnrichment(personId, team.id),
    getEnrichmentSourcesForPerson(personId, team.id),
  ])

  return NextResponse.json({ team, person, enrichment: enrichment ?? null, sources })
}

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: {
    teamSlug?: string
    personId?: string
    enrichment?: {
      currentRole?: string
      currentCompany?: string
      industry?: string
      city?: string
      state?: string
      country?: string
      email?: string
      linkedinUrl?: string
      personalWebsiteUrl?: string
      notes?: string
      relationshipStatus?: string
      verificationStatus?: string
      sourceUrls?: unknown
    }
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, enrichment: enrichmentInput } = body

  if (!teamSlug || !personId) {
    return NextResponse.json(
      { error: 'Missing required fields: teamSlug, personId' },
      { status: 400 },
    )
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const people = await getPeopleForTeam(team.id)
  const person = people.find(p => p.id === personId)
  if (!person) {
    return NextResponse.json(
      { error: `Person not found on team: ${personId}` },
      { status: 404 },
    )
  }

  const data = enrichmentInput ?? {}

  if (
    data.verificationStatus !== undefined &&
    !VALID_VERIFICATION_STATUSES.includes(
      data.verificationStatus as PersonEnrichment['verificationStatus'],
    )
  ) {
    return NextResponse.json(
      {
        error: `Invalid verificationStatus. Must be one of: ${VALID_VERIFICATION_STATUSES.join(', ')}`,
      },
      { status: 400 },
    )
  }

  if (
    data.relationshipStatus !== undefined &&
    !VALID_RELATIONSHIP_STATUSES.includes(
      data.relationshipStatus as PersonEnrichment['relationshipStatus'],
    )
  ) {
    return NextResponse.json(
      {
        error: `Invalid relationshipStatus. Must be one of: ${VALID_RELATIONSHIP_STATUSES.join(', ')}`,
      },
      { status: 400 },
    )
  }

  if (data.sourceUrls !== undefined && !Array.isArray(data.sourceUrls)) {
    return NextResponse.json({ error: 'sourceUrls must be an array' }, { status: 400 })
  }

  const enrichment = await upsertPersonEnrichment({
    personId,
    teamId: team.id,
    currentRole: typeof data.currentRole === 'string' ? data.currentRole : undefined,
    currentCompany: typeof data.currentCompany === 'string' ? data.currentCompany : undefined,
    industry: typeof data.industry === 'string' ? data.industry : undefined,
    city: typeof data.city === 'string' ? data.city : undefined,
    state: typeof data.state === 'string' ? data.state : undefined,
    country: typeof data.country === 'string' ? data.country : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
    linkedinUrl: typeof data.linkedinUrl === 'string' ? data.linkedinUrl : undefined,
    personalWebsiteUrl:
      typeof data.personalWebsiteUrl === 'string' ? data.personalWebsiteUrl : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    relationshipStatus: data.relationshipStatus as PersonEnrichment['relationshipStatus'],
    verificationStatus: data.verificationStatus as PersonEnrichment['verificationStatus'],
    sourceUrls: Array.isArray(data.sourceUrls)
      ? (data.sourceUrls as string[]).filter(u => typeof u === 'string')
      : undefined,
  })

  return NextResponse.json({ enrichment })
}
