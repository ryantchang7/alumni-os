import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getTeamBySlug, readStore, mutateStore } from '@/lib/store/local-store'
import type { PersonEnrichment } from '@/lib/store/types'

const CLASS_ORDER: Record<string, number> = { 'Sr.': 0, 'Jr.': 1, 'So.': 2, 'Fr.': 3 }

const FORBIDDEN_PATCH_KEYS = new Set([
  'verificationStatus', 'email', 'linkedinUrl', 'sourceUrls',
  'publishedAt', 'publishedByRole', 'id', 'teamId', 'createdAt', 'updatedAt',
])

const VALID_CLASS_LABELS = new Set(['Sr.', 'Jr.', 'So.', 'Fr.'])

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

export async function GET(request: Request) {
  // Founder-only — this endpoint exposes the full current-player roster
  // including hometowns + enrichment fields, and the PATCH below mutates
  // membership data. Both reads and writes are founder-gated.
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  const store = await readStore()

  const players = store.teamMemberships
    .filter(m => m.teamId === team.id && m.memberRole === 'current_player')
    .map(membership => {
      const person = store.people.find(p => p.id === membership.personId)
      if (!person) return null
      const enrichment = store.personEnrichments.find(
        e => e.personId === person.id && e.teamId === team.id,
      ) ?? null
      return { person, membership, enrichment }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => {
      const aO = CLASS_ORDER[a.membership.classLabel ?? ''] ?? 99
      const bO = CLASS_ORDER[b.membership.classLabel ?? ''] ?? 99
      if (aO !== bO) return aO - bO
      return a.person.canonicalName.localeCompare(b.person.canonicalName)
    })

  return NextResponse.json({ team, players })
}

export async function PATCH(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamSlug, personId, person: personPatch, membership: membershipPatch, enrichment: enrichmentPatch } = body as {
    teamSlug?: string
    personId?: string
    person?: Record<string, unknown>
    membership?: Record<string, unknown>
    enrichment?: Record<string, unknown>
  }

  if (!teamSlug) return NextResponse.json({ error: 'teamSlug required' }, { status: 400 })
  if (!personId) return NextResponse.json({ error: 'personId required' }, { status: 400 })

  // Check for forbidden keys in any patch object
  for (const patch of [personPatch, membershipPatch, enrichmentPatch]) {
    if (!patch) continue
    for (const key of Object.keys(patch)) {
      if (FORBIDDEN_PATCH_KEYS.has(key)) {
        return NextResponse.json({ error: `Field not allowed: ${key}` }, { status: 400 })
      }
    }
  }

  const team = await getTeamBySlug(teamSlug as string)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  // Apply all three patches atomically. Lookups + validation live inside the
  // mutator so the CAS guard keeps this PATCH from clobbering a concurrent
  // write (e.g. an alum editing their own profile) to the same blob. Errors
  // are returned as { error, status } and turned into a response outside.
  const result = await mutateStore<
    | { error: string; status: number }
    | { ok: true; person: unknown; membership: unknown; enrichment: unknown }
  >((store) => {
    const personIdx = store.people.findIndex(p => p.id === personId)
    if (personIdx === -1) return { error: 'Person not found', status: 404 }

    const membershipIdx = store.teamMemberships.findIndex(
      m => m.personId === personId && m.teamId === team.id,
    )
    if (membershipIdx === -1) return { error: 'Membership not found', status: 404 }

    if (store.teamMemberships[membershipIdx].memberRole !== 'current_player') {
      return { error: 'Person is not a current player', status: 403 }
    }

    // Validate inputs BEFORE mutating — mutateStore commits whatever the
    // callback leaves on the store, so returning an error after a partial
    // mutation would still persist it. Reject bad input up front.
    if (
      membershipPatch &&
      typeof membershipPatch.classLabel === 'string' &&
      !VALID_CLASS_LABELS.has(membershipPatch.classLabel)
    ) {
      return { error: 'classLabel must be Sr., Jr., So., or Fr.', status: 400 }
    }

    const now = new Date().toISOString()

    // Apply person patch
    if (personPatch) {
      if (typeof personPatch.canonicalName === 'string' && personPatch.canonicalName.trim()) {
        store.people[personIdx].canonicalName = personPatch.canonicalName.trim()
        store.people[personIdx].normalizedName = normName(personPatch.canonicalName.trim())
        const parts = personPatch.canonicalName.trim().split(' ')
        store.people[personIdx].firstName = parts[0]
        store.people[personIdx].lastName = parts.slice(1).join(' ')
      }
    }

    // Apply membership patch
    if (membershipPatch) {
      const m = store.teamMemberships[membershipIdx]
      if (typeof membershipPatch.classLabel === 'string') {
        if (!VALID_CLASS_LABELS.has(membershipPatch.classLabel)) {
          return { error: 'classLabel must be Sr., Jr., So., or Fr.', status: 400 }
        }
        m.classLabel = membershipPatch.classLabel
      }
      if (typeof membershipPatch.classYearEstimate === 'string') m.classYearEstimate = membershipPatch.classYearEstimate
      if (typeof membershipPatch.hometown === 'string') m.hometown = membershipPatch.hometown || undefined
      if (typeof membershipPatch.highSchool === 'string') m.highSchool = membershipPatch.highSchool || undefined
      if (membershipPatch.rosterStartYear !== undefined) {
        const y = Number(membershipPatch.rosterStartYear)
        if (!isNaN(y)) m.rosterStartYear = y
      }
      if (membershipPatch.rosterEndYear !== undefined) {
        const y = Number(membershipPatch.rosterEndYear)
        if (!isNaN(y)) m.rosterEndYear = y
      }
      if (typeof membershipPatch.publishedToNetwork === 'boolean') m.publishedToNetwork = membershipPatch.publishedToNetwork
      m.updatedAt = now
    }

    // Apply enrichment patch — create if missing
    const enrichmentIdx = store.personEnrichments.findIndex(
      e => e.personId === personId && e.teamId === team.id,
    )

    if (enrichmentPatch) {
      const safe: Partial<PersonEnrichment> = {}
      if (typeof enrichmentPatch.alumniBio === 'string') safe.alumniBio = enrichmentPatch.alumniBio || undefined
      if (Array.isArray(enrichmentPatch.helpTopics) && enrichmentPatch.helpTopics.every((t: unknown) => typeof t === 'string')) {
        safe.helpTopics = enrichmentPatch.helpTopics as string[]
      }
      if (typeof enrichmentPatch.contactPreference === 'string') safe.contactPreference = enrichmentPatch.contactPreference as PersonEnrichment['contactPreference']
      if (typeof enrichmentPatch.availabilityLevel === 'string') safe.availabilityLevel = enrichmentPatch.availabilityLevel as PersonEnrichment['availabilityLevel']
      if (typeof enrichmentPatch.openToGolfRounds === 'boolean') safe.openToGolfRounds = enrichmentPatch.openToGolfRounds
      if (typeof enrichmentPatch.openToCoffee === 'boolean') safe.openToCoffee = enrichmentPatch.openToCoffee
      if (typeof enrichmentPatch.openToMentorship === 'boolean') safe.openToMentorship = enrichmentPatch.openToMentorship
      if (typeof enrichmentPatch.openToWarmIntroductions === 'boolean') safe.openToWarmIntroductions = enrichmentPatch.openToWarmIntroductions
      if (typeof enrichmentPatch.favoritePennGolfMemory === 'string') safe.favoritePennGolfMemory = enrichmentPatch.favoritePennGolfMemory || undefined
      if (typeof enrichmentPatch.favoriteCourses === 'string') safe.favoriteCourses = enrichmentPatch.favoriteCourses || undefined
      if (typeof enrichmentPatch.visibleToPlayers === 'boolean') safe.visibleToPlayers = enrichmentPatch.visibleToPlayers

      if (enrichmentIdx === -1) {
        store.personEnrichments.push({
          id: crypto.randomUUID(),
          personId: personId as string,
          teamId: team.id,
          verificationStatus: 'unverified',
          sourceUrls: [],
          ...safe,
          createdAt: now,
          updatedAt: now,
        })
      } else {
        store.personEnrichments[enrichmentIdx] = {
          ...store.personEnrichments[enrichmentIdx],
          ...safe,
          updatedAt: now,
        }
      }
    }

    const updatedPerson = store.people[personIdx]
    const updatedMembership = store.teamMemberships[membershipIdx]
    const updatedEnrichment = store.personEnrichments.find(
      e => e.personId === personId && e.teamId === team.id,
    ) ?? null

    return { ok: true, person: updatedPerson, membership: updatedMembership, enrichment: updatedEnrichment }
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ person: result.person, membership: result.membership, enrichment: result.enrichment })
}
