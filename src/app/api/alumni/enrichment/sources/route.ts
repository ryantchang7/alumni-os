import { NextResponse } from 'next/server'
import {
  getTeamBySlug,
  getPeopleForTeam,
  addEnrichmentSource,
  deleteEnrichmentSource,
  readStore,
} from '@/lib/store/local-store'
import type { EnrichmentSource } from '@/lib/store/types'

const VALID_SOURCE_TYPES: EnrichmentSource['sourceType'][] = [
  'team_roster',
  'company_bio',
  'personal_site',
  'linkedin_public',
  'news_article',
  'manual_note',
  'other',
]

export async function POST(request: Request) {
  let body: {
    teamSlug?: string
    personId?: string
    url?: string
    title?: string
    sourceType?: string
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, personId, url, title, sourceType, notes } = body

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required field: teamSlug' }, { status: 400 })
  }
  if (!personId) {
    return NextResponse.json({ error: 'Missing required field: personId' }, { status: 400 })
  }
  if (!sourceType) {
    return NextResponse.json({ error: 'Missing required field: sourceType' }, { status: 400 })
  }

  if (!VALID_SOURCE_TYPES.includes(sourceType as EnrichmentSource['sourceType'])) {
    return NextResponse.json(
      { error: `Invalid sourceType. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  if (!url && sourceType !== 'manual_note') {
    return NextResponse.json(
      { error: 'Missing required field: url (required unless sourceType is manual_note)' },
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

  const source = await addEnrichmentSource({
    personId,
    teamId: team.id,
    url: url ?? '',
    title: typeof title === 'string' ? title : undefined,
    sourceType: sourceType as EnrichmentSource['sourceType'],
    notes: typeof notes === 'string' ? notes : undefined,
  })

  return NextResponse.json({ source })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('sourceId')
  const teamSlug = searchParams.get('teamSlug')

  if (!sourceId) {
    return NextResponse.json({ error: 'Missing required query param: sourceId' }, { status: 400 })
  }
  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const store = await readStore()
  const source = store.enrichmentSources.find(s => s.id === sourceId)
  if (!source) {
    return NextResponse.json({ error: `Source not found: ${sourceId}` }, { status: 404 })
  }
  if (source.teamId !== team.id) {
    return NextResponse.json({ error: 'Source does not belong to this team' }, { status: 403 })
  }

  const deleted = await deleteEnrichmentSource(sourceId)
  return NextResponse.json({ deleted })
}
