// Clubhouse activity feed: recent claims + upcoming gatherings + RSVP momentum.
//
// Read-only and reachable without auth (browse-public), BUT member detail is
// session-gated: non-approved viewers get the same response shape with names,
// travel plans, photos, and titles stripped — array lengths and aggregate
// totals survive so the member-only teases can still show counts.

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readStore, getTeamBySlug, getRecentTeamNewsItems } from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { usEasternToday } from '@/lib/us-date'

const TEAM_SLUG = 'penn-mens-golf'
const RECENT_DAYS = 30

interface RecentClaim {
  name: string | null
  personId: string | null
  bookId: string | null
  createdAt: string
}
interface UpcomingGathering {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  dateText: string
  city?: string
  state?: string
  interestedCount: number
}
interface RecentMoment {
  id: string
  photoUrl: string
  mediaType: 'image' | 'video'
  caption: string
  postedByName: string
  postedByBookId: string | null
  createdAt: string
}
interface OnTheLoopMember {
  personId: string
  bookId: string | null
  name: string
  city?: string
  state?: string
  startDate?: string
  endDate?: string
  note?: string
}

// Helper: is this trip currently active? A trip with no endDate is treated
// as "active until cleared." A trip with no startDate is treated as
// "starting now." Compared in US Eastern — endDate is a member-local
// calendar date and UTC "today" hid trips hours early in the evening.
function tripIsActive(t: { startDate?: string; endDate?: string }): boolean {
  const today = usEasternToday()
  if (t.endDate && t.endDate < today) return false
  return true
}

export async function GET() {
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({ recentClaims: [], upcoming: [], totals: {} })
  }

  const store = await readStore()
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000

  // Recently linked accounts — show display name from the linked person.
  const recentClaims: RecentClaim[] = []
  for (const account of store.accounts) {
    if (account.teamId !== team.id) continue
    if (!account.linkedPersonId) continue
    const created = Date.parse(account.createdAt)
    if (Number.isNaN(created) || created < cutoff) continue
    const person = store.people.find((p) => p.id === account.linkedPersonId)
    const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
    recentClaims.push({
      name: person?.canonicalName ?? account.name ?? null,
      personId: account.linkedPersonId,
      bookId: bookEntry?.id ?? null,
      createdAt: account.createdAt,
    })
  }
  recentClaims.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Upcoming open gatherings, joined with active RSVP counts.
  const interestedByGathering = new Map<string, number>()
  for (const r of store.clubhouseGatheringRequests) {
    if (r.teamId !== team.id) continue
    if (r.status === 'declined' || r.status === 'closed') continue
    interestedByGathering.set(
      r.gatheringId,
      (interestedByGathering.get(r.gatheringId) ?? 0) + 1,
    )
  }
  const upcoming: UpcomingGathering[] = store.clubhouseGatherings
    .filter((g) => g.teamId === team.id && g.status === 'open')
    .map((g) => ({
      id: g.id,
      type: g.type,
      title: g.title,
      dateText: g.dateText,
      city: g.city,
      state: g.state,
      interestedCount: interestedByGathering.get(g.id) ?? 0,
    }))

  // Latest moments — only published ones, newest first.
  const recentMoments: RecentMoment[] = store.moments
    .filter((m) => m.teamId === team.id && m.status === 'published')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((m) => {
      const person = m.postedByPersonId
        ? store.people.find((p) => p.id === m.postedByPersonId)
        : undefined
      const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
      return {
        id: m.id,
        photoUrl: m.photoUrl,
        mediaType: m.mediaType ?? 'image',
        caption: m.caption,
        postedByName: m.postedByName,
        postedByBookId: bookEntry?.id ?? null,
        createdAt: m.createdAt,
      }
    })

  // On the Loop — who's passing through. This used to read the passive
  // `inTown` field on enrichment, which lived at line ~566 of a 1,000-line
  // profile editor and had zero users, while Open Requests ("In NYC Aug
  // 5-10, looking to play") is the thing members actually post. Two
  // mechanisms for one need is why neither got used; this reads the one
  // with a real front door, and still honors a legacy inTown if set.
  const onTheLoop: OnTheLoopMember[] = []
  const seenLoopPersons = new Set<string>()
  for (const r of store.openRequests ?? []) {
    if (r.teamId !== team.id) continue
    if (r.status !== 'open') continue
    if (r.endDate && r.endDate < usEasternToday()) continue
    const personId = r.fromPersonId
    if (!personId || seenLoopPersons.has(personId)) continue
    const person = store.people.find((p) => p.id === personId)
    if (!person) continue
    const enrichment = store.personEnrichments.find(
      (e) => e.teamId === team.id && e.personId === personId,
    )
    if (enrichment?.visibleToPlayers === false) continue
    seenLoopPersons.add(personId)
    const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)
    onTheLoop.push({
      personId: person.id,
      bookId: bookEntry?.id ?? null,
      name: person.canonicalName,
      city: r.city,
      state: r.state,
      startDate: r.startDate,
      endDate: r.endDate,
      note: r.note,
    })
  }
  // Legacy: anyone who filled in the old inTown field before it was retired.
  for (const e of store.personEnrichments) {
    if (e.teamId !== team.id) continue
    if (e.visibleToPlayers === false) continue
    if (!e.inTown) continue
    if (!tripIsActive(e.inTown)) continue
    if (seenLoopPersons.has(e.personId)) continue
    const person = store.people.find((p) => p.id === e.personId)
    if (!person) continue
    seenLoopPersons.add(e.personId)
    const bookEntry = findBookEntryForTeamStorePerson(person.canonicalName)
    onTheLoop.push({
      personId: person.id,
      bookId: bookEntry?.id ?? null,
      name: person.canonicalName,
      city: e.inTown.city,
      state: e.inTown.state,
      startDate: e.inTown.startDate,
      endDate: e.inTown.endDate,
      note: e.inTown.note,
    })
  }
  onTheLoop.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

  const totals = {
    membersClaimed: store.accounts.filter(
      (a) => a.teamId === team.id && a.linkedPersonId,
    ).length,
    openGatherings: upcoming.length,
    upcomingRsvps: upcoming.reduce((s, g) => s + g.interestedCount, 0),
    publishedMoments: store.moments.filter(
      (m) => m.teamId === team.id && m.status === 'published',
    ).length,
  }

  // Latest team news (Penn Athletics) — top 2 for the feed.
  const newsItems = (await getRecentTeamNewsItems(team.id, 2)).map((n) => ({
    id: n.id,
    title: n.title,
    sourceUrl: n.sourceUrl,
    publishedAt: n.publishedAt,
  }))

  const session = await auth()
  const approved = Boolean(session?.accountId && session.linkedPersonId)

  if (!approved) {
    return NextResponse.json({
      recentClaims: recentClaims
        .slice(0, 5)
        .map((c) => ({ name: null, personId: null, bookId: null, createdAt: c.createdAt })),
      upcoming: upcoming
        .slice(0, 4)
        .map((g) => ({ id: g.id, type: g.type, title: '', dateText: '', interestedCount: 0 })),
      recentMoments: recentMoments.map((m) => ({
        id: m.id,
        photoUrl: '',
        mediaType: 'image' as const,
        caption: '',
        postedByName: '',
        postedByBookId: null,
        createdAt: m.createdAt,
      })),
      onTheLoop: onTheLoop.map((_, i) => ({
        personId: `hidden_${i}`,
        bookId: null,
        name: '',
      })),
      newsItems,
      totals,
    })
  }

  return NextResponse.json({
    recentClaims: recentClaims.slice(0, 5),
    upcoming: upcoming.slice(0, 4),
    recentMoments,
    onTheLoop,
    newsItems,
    totals,
  })
}
