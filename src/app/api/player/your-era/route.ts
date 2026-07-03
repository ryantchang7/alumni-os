/**
 * Your Era — the teammates whose roster years overlapped the viewer's.
 *
 * GET /api/player/your-era
 * → { eraLabel, hereCount, teammates } for the signed-in approved member.
 *
 * "Played together" = roster-year intervals intersect. Members with no
 * roster years on file (family, affiliates) get an empty list, not an
 * error. Unclaimed members appear only when publishedToNetwork — the same
 * visibility rule as the Member Book.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

const TEAM_SLUG = 'penn-mens-golf'

interface EraTeammate {
  personId: string
  name: string
  photoUrl: string | null
  classLabel: string | null
  overlapStart: number
  overlapEnd: number
  claimed: boolean
  /** Set when claimed — powers the one-tap chat button. */
  accountId: string | null
  bookId: string | null
}

export async function GET() {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const store = await readStore()
  const viewerPersonId = gate.session.linkedPersonId

  const mine = store.teamMemberships.find(
    m =>
      m.teamId === team.id &&
      m.personId === viewerPersonId &&
      (m.memberRole === 'current_player' || m.memberRole === 'alumni'),
  )
  const myStart = mine?.rosterStartYear ?? mine?.rosterEndYear
  const myEnd = mine?.rosterEndYear ?? mine?.rosterStartYear
  if (!mine || !myStart || !myEnd) {
    return NextResponse.json({ eraLabel: null, hereCount: 0, teammates: [] })
  }

  const accountByPerson = new Map(
    store.accounts
      .filter(a => a.teamId === team.id && a.linkedPersonId)
      .map(a => [a.linkedPersonId as string, a]),
  )
  const enrichByPerson = new Map(
    store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
  )

  const teammates: EraTeammate[] = []
  const seenPersonIds = new Set<string>()
  for (const m of store.teamMemberships) {
    if (m.teamId !== team.id || m.personId === viewerPersonId) continue
    if (m.memberRole !== 'current_player' && m.memberRole !== 'alumni') continue
    if (seenPersonIds.has(m.personId)) continue
    const start = m.rosterStartYear ?? m.rosterEndYear
    const end = m.rosterEndYear ?? m.rosterStartYear
    if (!start || !end) continue
    const overlapStart = Math.max(start, myStart)
    const overlapEnd = Math.min(end, myEnd)
    if (overlapStart > overlapEnd) continue

    const account = accountByPerson.get(m.personId)
    if (!account && m.publishedToNetwork !== true) continue
    const person = store.people.find(p => p.id === m.personId)
    if (!person) continue
    const enrichment = enrichByPerson.get(m.personId)
    if (enrichment?.visibleToPlayers === false) continue

    seenPersonIds.add(m.personId)
    const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)
    teammates.push({
      personId: person.id,
      name: person.canonicalName,
      photoUrl: enrichment?.photoUrl ?? account?.image ?? null,
      classLabel: m.classLabel ?? null,
      overlapStart,
      overlapEnd,
      claimed: !!account,
      accountId: account?.id ?? null,
      bookId: bookEntry?.id ?? null,
    })
  }

  // Claimed teammates first (they can be greeted today), then by how long
  // you shared a roster, then alphabetically.
  teammates.sort(
    (a, b) =>
      Number(b.claimed) - Number(a.claimed) ||
      (b.overlapEnd - b.overlapStart) - (a.overlapEnd - a.overlapStart) ||
      a.name.localeCompare(b.name),
  )

  return NextResponse.json({
    eraLabel: myStart === myEnd ? `${myStart}` : `${myStart}–${myEnd}`,
    hereCount: teammates.filter(t => t.claimed).length,
    teammates,
  })
}
