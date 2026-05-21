import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getTeamBySlug,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
  getPersonEnrichment,
  updatePersonEnrichmentSafeFields,
  readStore,
  writeStore,
} from '@/lib/store/local-store'
import type { PersonEnrichment } from '@/lib/store/types'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

const ALLOWED_CONTACT_PREFS: PersonEnrichment['contactPreference'][] = [
  'team_intro',
  'email_ok',
  'linkedin_ok',
  'not_available',
]

export async function GET(request: Request) {
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
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === personId)
  if (!membership) {
    return NextResponse.json({ error: 'Person not on this team' }, { status: 404 })
  }

  const enrichment = await getPersonEnrichment(personId, team.id)
  const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)

  return NextResponse.json({
    personId: person.id,
    canonicalName: person.canonicalName,
    bookId: bookEntry?.id ?? null,
    // Read-only roster truth
    classLabel: membership.classLabel,
    rosterStartYear: membership.rosterStartYear,
    rosterEndYear: membership.rosterEndYear,
    hometown: membership.hometown,
    highSchool: membership.highSchool,
    // Editable fields
    currentRole: enrichment?.currentRole,
    currentCompany: enrichment?.currentCompany,
    city: enrichment?.city,
    state: enrichment?.state,
    country: enrichment?.country,
    alumniBio: enrichment?.alumniBio,
    helpTopics: enrichment?.helpTopics ?? [],
    contactPreference: enrichment?.contactPreference ?? 'team_intro',
    visibleToPlayers: enrichment?.visibleToPlayers ?? true,
    optedOutAt: enrichment?.optedOutAt,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const personId = typeof body.personId === 'string' ? body.personId : null
  if (!personId) {
    return NextResponse.json({ error: 'Missing required field: personId' }, { status: 400 })
  }

  // Ownership: the signed-in account must be linked to this personId.
  if (session.linkedPersonId !== personId) {
    return NextResponse.json(
      { error: 'You can only edit your own profile' },
      { status: 403 },
    )
  }

  const people = await getPeopleForTeam(team.id)
  const person = people.find(p => p.id === personId)
  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  // Only allow safe fields — silently drop anything else
  const safeUpdate: Parameters<typeof updatePersonEnrichmentSafeFields>[2] = {}

  if (typeof body.currentRole === 'string') safeUpdate.currentRole = body.currentRole.trim()
  if (typeof body.currentCompany === 'string') safeUpdate.currentCompany = body.currentCompany.trim()
  if (typeof body.city === 'string') safeUpdate.city = body.city.trim()
  if (typeof body.state === 'string') safeUpdate.state = body.state.trim()
  if (typeof body.country === 'string') safeUpdate.country = body.country.trim()
  if (typeof body.alumniBio === 'string') safeUpdate.alumniBio = body.alumniBio.trim()
  if (Array.isArray(body.helpTopics) && body.helpTopics.every(t => typeof t === 'string')) {
    safeUpdate.helpTopics = body.helpTopics as string[]
  }
  if (
    typeof body.contactPreference === 'string' &&
    ALLOWED_CONTACT_PREFS.includes(body.contactPreference as PersonEnrichment['contactPreference'])
  ) {
    safeUpdate.contactPreference = body.contactPreference as PersonEnrichment['contactPreference']
  }
  if (typeof body.visibleToPlayers === 'boolean') {
    safeUpdate.visibleToPlayers = body.visibleToPlayers
  }

  const updated = await updatePersonEnrichmentSafeFields(personId, team.id, safeUpdate)
  if (!updated) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  // Hometown lives on the team-membership, not the enrichment.
  // Persist it separately when present in the body.
  if (typeof body.hometown === 'string') {
    const hometown = body.hometown.trim()
    const store = await readStore()
    const idx = store.teamMemberships.findIndex(
      (m) => m.personId === personId && m.teamId === team.id,
    )
    if (idx !== -1) {
      store.teamMemberships[idx] = {
        ...store.teamMemberships[idx],
        hometown: hometown || undefined,
        updatedAt: new Date().toISOString(),
      }
      await writeStore(store)
    }
  }

  return NextResponse.json({ ok: true, personId })
}
