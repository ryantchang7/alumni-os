/**
 * Your Era — the teammates whose roster years overlapped the viewer's — and
 * Your People, for everyone that cannot serve.
 *
 * GET /api/player/your-era
 * → { eraLabel, hereCount, teammates, neighbours } for the signed-in
 *   approved member.
 *
 * "Played together" = roster-year intervals intersect. That is the whole
 * matching logic the Clubhouse had, and it is empty for a Penn alum who
 * plays golf but never played for Penn: no roster years, so no era, so no
 * teammates, so nothing personal on the page they land on. Since that door
 * opened on 2026-11-07 they are the fastest-growing kind of member here.
 *
 * `neighbours` matches on the things those members do share: the course
 * they play, the city they live in, the work they do. It is computed for
 * everyone, because a 1994 alum with two teammates in the book also
 * benefits, but it is the only list a non-roster member gets.
 *
 * Unclaimed members appear in `teammates` when publishedToNetwork — the
 * same visibility rule as the Member Book. They never appear in
 * `neighbours`, which is built entirely from enrichment fields that only a
 * claimed member has filled in.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { getTeamBySlug, readStore } from '@/lib/store/local-store'
import { livePrograms } from '@/lib/teams/programs'
import { resolveViewerProgram } from '@/lib/teams/viewer-program'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { memberBookEntries, getMemberById } from '@/lib/member-book/data'
import {
  getPublicMembers,
  getMemberStartYear,
  getMemberEndYear,
  getMemberProgram,
} from '@/lib/member-book/helpers'

/** Someone matched on where they play, live or work rather than on years. */
interface Neighbour {
  personId: string
  name: string
  photoUrl: string | null
  /** Why they are here: "Plays out of Merion" / "In Chicago" / "In finance" */
  reason: string
  /** Higher is a closer match; the list is sorted by it. */
  score: number
  accountId: string | null
  bookId: string | null
}

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

  const store = await readStore()
  const viewerPersonId = gate.session.linkedPersonId

  // Which roster the viewer was actually on. This was hardcoded to the men's
  // team, so a women's member had no era, no teammates and nobody to invite:
  // the teammate loop was simply dark for her.
  const teamsBySlug = new Map<string, string>()
  for (const prog of livePrograms()) {
    const t = await getTeamBySlug(prog.slug)
    if (t) teamsBySlug.set(prog.slug, t.id)
  }
  const viewer = resolveViewerProgram(
    store,
    viewerPersonId,
    slug => teamsBySlug.get(slug) ?? null,
  )
  if (!viewer.teamId) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }
  const team = { id: viewer.teamId }
  const viewerBookEntry = viewer.bookEntry
  const myStart = viewer.startYear
  const myEnd = viewer.endYear

  const accountByPerson = new Map(
    store.accounts
      .filter(a => a.teamId === team.id && a.linkedPersonId)
      .map(a => [a.linkedPersonId as string, a]),
  )
  const enrichByPerson = new Map(
    store.personEnrichments.filter(e => e.teamId === team.id).map(e => [e.personId, e]),
  )

  // ── Your People ──────────────────────────────────────────────────────
  // Built before the era check, because the member who needs it most is the
  // one the era check is about to send away empty-handed.
  const norm = (v?: string) => v?.trim().toLowerCase() ?? ''
  const me = viewerPersonId ? enrichByPerson.get(viewerPersonId) : undefined
  const myCourse = norm(me?.homeCourse)
  const myCity = norm(me?.city)
  const myState = norm(me?.state)
  const myIndustry = norm(me?.industry)

  const neighbours: Neighbour[] = []
  for (const [personId, account] of accountByPerson) {
    if (personId === viewerPersonId) continue
    const e = enrichByPerson.get(personId)
    if (!e || e.visibleToPlayers === false) continue
    const person = store.people.find(p => p.id === personId)
    if (!person) continue

    // Course first: two Penn people out of the same club is the most useful
    // thing this product can tell either of them. Then city, then state,
    // then work. One reason is shown, the strongest.
    let score = 0
    let reason = ''
    if (myCourse && norm(e.homeCourse) === myCourse) {
      score = 4
      reason = `Plays out of ${e.homeCourse}`
    } else if (myCity && norm(e.city) === myCity) {
      score = 3
      reason = `In ${e.city}`
    } else if (myIndustry && norm(e.industry) === myIndustry) {
      score = 2
      reason = `In ${e.industry}`
    } else if (myState && norm(e.state) === myState) {
      score = 1
      reason = `In ${e.state}`
    }
    if (score === 0) continue

    const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)
    neighbours.push({
      personId,
      name: person.canonicalName,
      photoUrl: e.photoUrl ?? account.image ?? null,
      reason,
      score,
      accountId: account.id,
      bookId: bookEntry?.id ?? null,
    })
  }
  neighbours.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

  // A member with nothing on their own card matches nobody, which is the
  // honest answer and is what the "finish your card" nudge is for.
  const viewerHasMatchableCard = !!(myCourse || myCity || myIndustry || myState)

  if (!myStart || !myEnd) {
    return NextResponse.json({
      eraLabel: null,
      hereCount: 0,
      viewerName: viewer.canonicalName,
      teamSlug: viewer.program.slug,
      teammates: [],
      neighbours,
      viewerHasMatchableCard,
    })
  }


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

  // Now the Member Book — 346 people with letter years going back to 1930,
  // versus 81 in the store. Without this, an alum from 1994 saw an empty
  // section: the one feature that is personal on day one was dark for the
  // majority of the people being emailed.
  //
  // `memberBookEntries` is the MERGED view of both programs, and this loop
  // matched on overlapping years alone. Since women's golf went live that
  // meant a men's alum from 2010 was shown women's players from 2010 as
  // people he was "on the roster with", and invited to pull them in as
  // teammates. They were never on the same roster. Same program only.
  const seenBookIds = new Set(
    teammates.map(t => t.bookId).filter((b): b is string => !!b),
  )
  const viewerBookId = viewerBookEntry?.id ?? null
  const viewerProgram = viewer.program.id
  for (const entry of getPublicMembers(memberBookEntries)) {
    if (entry.id === viewerBookId) continue
    if (seenBookIds.has(entry.id)) continue
    if (getMemberProgram(entry) !== viewerProgram) continue
    const start = getMemberStartYear(entry)
    const end = getMemberEndYear(entry)
    if (!start || !end) continue
    const overlapStart = Math.max(start, myStart)
    const overlapEnd = Math.min(end, myEnd)
    if (overlapStart > overlapEnd) continue
    seenBookIds.add(entry.id)
    teammates.push({
      personId: '',
      name: entry.displayName,
      photoUrl: null,
      classLabel: entry.profile.classYearEstimate ?? null,
      overlapStart,
      overlapEnd,
      claimed: false,
      accountId: null,
      bookId: entry.id,
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
    eraLabel: viewer.eraLabel,
    // The UI links to /player/alumni/[id]?teamSlug=..., which 404s on the
    // wrong program. It had the men's slug hardcoded.
    teamSlug: viewer.program.slug,
    hereCount: teammates.filter(t => t.claimed).length,
    // So an invite can say who it came from. An SMS naming nobody reads as
    // spam, and the one invite loop that has actually worked here was a
    // named alum writing to people who knew him.
    viewerName: viewer.canonicalName,
    teammates,
    neighbours,
    viewerHasMatchableCard,
  })
}
