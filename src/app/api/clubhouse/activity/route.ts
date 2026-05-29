// Clubhouse activity feed: recent claims + upcoming gatherings + RSVP momentum.
//
// Read-only. No auth required (browse-public). Surfaces signals that the
// Clubhouse is alive — recently-joined alumni and gatherings with momentum.

import { NextResponse } from 'next/server'
import { readStore, getTeamBySlug, getRecentTeamNewsItems } from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'

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
// "starting now."
function tripIsActive(t: { startDate?: string; endDate?: string }): boolean {
  const today = new Date().toISOString().slice(0, 10)
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

  // On the Loop — anyone (alumni, players, coaches, family) with an
  // active `inTown` trip. The data field is what gates it — if you
  // haven't told us you're passing through somewhere, you don't appear.
  const onTheLoop: OnTheLoopMember[] = []
  for (const e of store.personEnrichments) {
    if (e.teamId !== team.id) continue
    if (e.visibleToPlayers === false) continue
    if (!e.inTown) continue
    if (!tripIsActive(e.inTown)) continue
    const person = store.people.find((p) => p.id === e.personId)
    if (!person) continue
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

  return NextResponse.json({
    recentClaims: recentClaims.slice(0, 5),
    upcoming: upcoming.slice(0, 4),
    recentMoments,
    onTheLoop,
    newsItems,
    totals,
  })
}
