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
    memberRole: membership.memberRole,
    classLabel: membership.classLabel,
    rosterStartYear: membership.rosterStartYear,
    rosterEndYear: membership.rosterEndYear,
    hometown: membership.hometown,
    highSchool: membership.highSchool,
    // Only meaningful for parents/affiliates — surfaces the
    // "Parent of John Smith C'24" line in the profile editor.
    parentRelationship: membership.parentRelationship,
    // Editable fields
    currentRole: enrichment?.currentRole,
    currentCompany: enrichment?.currentCompany,
    industry: enrichment?.industry,
    city: enrichment?.city,
    state: enrichment?.state,
    country: enrichment?.country,
    additionalLocations: enrichment?.additionalLocations ?? [],
    inTown: enrichment?.inTown ?? null,
    alumniBio: enrichment?.alumniBio,
    helpTopics: enrichment?.helpTopics ?? [],
    contactPreference: enrichment?.contactPreference ?? 'team_intro',
    visibleToPlayers: enrichment?.visibleToPlayers ?? true,
    homeCourse: enrichment?.homeCourse,
    favoriteCourses: enrichment?.favoriteCourses,
    favoritePennGolfMemory: enrichment?.favoritePennGolfMemory,
    interests: enrichment?.interests,
    email: enrichment?.email,
    phone: enrichment?.phone,
    linkedinUrl: enrichment?.linkedinUrl,
    photoUrl: enrichment?.photoUrl,
    optedOutAt: enrichment?.optedOutAt,
    openToGolfRounds: enrichment?.openToGolfRounds ?? false,
    openToCoffee: enrichment?.openToCoffee ?? false,
    openToMentorship: enrichment?.openToMentorship ?? false,
    openToWarmIntroductions: enrichment?.openToWarmIntroductions ?? false,
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
  if (typeof body.industry === 'string') safeUpdate.industry = body.industry.trim()
  if (typeof body.city === 'string') safeUpdate.city = body.city.trim()
  if (typeof body.state === 'string') {
    // Normalize "New York" / "Calif." / "ny" → "NY" so the member map can
    // bucket the alum into the right state. Falls back to raw uppercase
    // 2-letter if no match (so we don't lose data on unusual input).
    const { enrichmentStateToCode } = await import('@/lib/map/state-lookup')
    const raw = body.state.trim()
    safeUpdate.state = enrichmentStateToCode(raw) ?? raw.toUpperCase().slice(0, 2)
  }
  if (typeof body.country === 'string') safeUpdate.country = body.country.trim()
  if (body.inTown === null) {
    safeUpdate.inTown = undefined
  } else if (typeof body.inTown === 'object' && body.inTown !== null) {
    const t = body.inTown as Record<string, unknown>
    const inTown = {
      city: typeof t.city === 'string' ? t.city.trim() : undefined,
      state:
        typeof t.state === 'string'
          ? t.state.trim().toUpperCase().slice(0, 2)
          : undefined,
      startDate: typeof t.startDate === 'string' ? t.startDate.trim() : undefined,
      endDate: typeof t.endDate === 'string' ? t.endDate.trim() : undefined,
      note: typeof t.note === 'string' ? t.note.trim().slice(0, 280) : undefined,
    }
    // Treat empty input as a clear.
    if (!inTown.city && !inTown.state && !inTown.startDate && !inTown.endDate && !inTown.note) {
      safeUpdate.inTown = undefined
    } else {
      safeUpdate.inTown = inTown
    }
  }
  if (Array.isArray(body.additionalLocations)) {
    const { enrichmentStateToCode } = await import('@/lib/map/state-lookup')
    const clean = (body.additionalLocations as unknown[])
      .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
      .map((row) => {
        const rawState =
          typeof row.state === 'string' ? row.state.trim() : undefined
        return {
          city: typeof row.city === 'string' ? row.city.trim() : undefined,
          // Normalize "Massachusetts" / "Mass." / "ma" → "MA" so the member
          // map can place this location in the right state.
          state: rawState
            ? enrichmentStateToCode(rawState) ?? rawState.toUpperCase().slice(0, 2)
            : undefined,
          label: typeof row.label === 'string' ? row.label.trim() : undefined,
        }
      })
      .filter((row) => row.city || row.state)
      .slice(0, 4)
    safeUpdate.additionalLocations = clean
  }
  if (typeof body.alumniBio === 'string') safeUpdate.alumniBio = body.alumniBio.trim()
  if (typeof body.homeCourse === 'string') safeUpdate.homeCourse = body.homeCourse.trim()
  if (typeof body.favoriteCourses === 'string') safeUpdate.favoriteCourses = body.favoriteCourses.trim()
  if (typeof body.favoritePennGolfMemory === 'string') safeUpdate.favoritePennGolfMemory = body.favoritePennGolfMemory.trim()
  if (typeof body.interests === 'string') safeUpdate.interests = body.interests.trim()
  if (typeof body.email === 'string') safeUpdate.email = body.email.trim()
  if (typeof body.phone === 'string') safeUpdate.phone = body.phone.trim()
  if (typeof body.linkedinUrl === 'string') safeUpdate.linkedinUrl = body.linkedinUrl.trim()
  if (typeof body.photoUrl === 'string') safeUpdate.photoUrl = body.photoUrl.trim()
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
  if (typeof body.openToGolfRounds === 'boolean') safeUpdate.openToGolfRounds = body.openToGolfRounds
  if (typeof body.openToCoffee === 'boolean') safeUpdate.openToCoffee = body.openToCoffee
  if (typeof body.openToMentorship === 'boolean') safeUpdate.openToMentorship = body.openToMentorship
  if (typeof body.openToWarmIntroductions === 'boolean') safeUpdate.openToWarmIntroductions = body.openToWarmIntroductions

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
