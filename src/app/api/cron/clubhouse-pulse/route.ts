/**
 * Read-only. Where the Clubhouse actually stands, and where people stop.
 *
 * Every public signal is behind a members-only gate, which is how "upcoming
 * gatherings is zero" got measured wrong once already: `/api/gatherings` and
 * friends answer with empty arrays to anyone not approved, so a signed-out
 * probe reports a dead site whether or not it is one. This reads the store
 * directly so the numbers are the numbers.
 *
 * It writes nothing, ever, and it returns no email addresses or names of
 * people who have not published themselves to the network.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>, or a founder session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCronAuth } from '@/lib/cron-auth'
import { requireFounder } from '@/lib/auth/guards'
import { PROGRAMS } from '@/lib/teams/programs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Decade bucket for a roster career, used to see which eras have arrived. */
function era(startYear?: number, endYear?: number): string {
  const y = startYear ?? endYear
  if (!y) return 'unknown'
  if (y >= 2020) return '2020s'
  if (y >= 2010) return '2010s'
  if (y >= 2000) return '2000s'
  if (y >= 1993) return '1990s (varsity)'
  if (y >= 1983) return '1983-1992 (club years)'
  if (y >= 1970) return '1970s-82'
  return 'pre-1970'
}

async function runJob(req: NextRequest) {
  if (!checkCronAuth(req)) {
    const gate = await requireFounder()
    if (!gate.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()

  const mens = await getTeamBySlug(PROGRAMS.mens.slug)
  const womens = await getTeamBySlug(PROGRAMS.womens.slug)

  const accounts = store.accounts
  const claimed = accounts.filter(a => a.linkedPersonId)
  const claimedIds = new Set(claimed.map(a => a.id))
  const claimedPersonIds = new Set(claimed.map(a => a.linkedPersonId!))

  /** Did this account do anything beyond claiming a card? */
  const didSomething = (accountId: string, personId: string) => {
    const enrichment = store.personEnrichments.find(e => e.personId === personId)
    return {
      profile: !!(
        enrichment &&
        (enrichment.alumniBio ||
          enrichment.currentRole ||
          enrichment.city ||
          enrichment.photoUrl)
      ),
      posted: store.moments.some(m => m.postedByAccountId === accountId),
      commented: store.momentComments.some(c => c.fromAccountId === accountId),
      rsvped: store.clubhouseGatheringRequests.some(r => r.fromAccountId === accountId),
      hosted: store.clubhouseGatherings.some(g => g.hostPersonId === personId),
      asked: store.openRequests.some(r => r.fromAccountId === accountId),
      messaged: store.chatMessages.some(m => m.fromAccountId === accountId),
      questioned: store.teamQuestions.some(q => q.askerAccountId === accountId),
    }
  }

  const funnel = { claimed: claimed.length, profile: 0, posted: 0, rsvped: 0, asked: 0, any: 0 }
  const erasArrived: Record<string, number> = {}

  for (const a of claimed) {
    const d = didSomething(a.id, a.linkedPersonId!)
    if (d.profile) funnel.profile++
    if (d.posted || d.commented) funnel.posted++
    if (d.rsvped || d.hosted) funnel.rsvped++
    if (d.asked || d.messaged || d.questioned) funnel.asked++
    if (Object.values(d).some(Boolean)) funnel.any++

    const m = store.teamMemberships.find(x => x.personId === a.linkedPersonId)
    const key = era(m?.rosterStartYear, m?.rosterEndYear)
    erasArrived[key] = (erasArrived[key] ?? 0) + 1
  }

  /**
   * Which roster years nobody in the store covers. The men's book runs 1930
   * onward, but Penn dropped golf to club status in the eighties and kept no
   * roster for those seasons, so the book has a decade-shaped hole in it that
   * nothing on the site currently admits to.
   */
  const covered = new Set<number>()
  for (const m of store.teamMemberships) {
    const s = m.rosterStartYear
    const e = m.rosterEndYear ?? s
    if (!s || !e) continue
    for (let y = s; y <= e; y++) covered.add(y)
  }
  const thisYear = new Date().getFullYear()
  const gaps: Array<{ from: number; to: number }> = []
  let run: { from: number; to: number } | null = null
  for (let y = 1930; y <= thisYear; y++) {
    if (covered.has(y)) {
      if (run) {
        gaps.push(run)
        run = null
      }
    } else if (run) {
      run.to = y
    } else {
      run = { from: y, to: y }
    }
  }
  if (run) gaps.push(run)

  return NextResponse.json({
    ok: true,
    people: {
      inStore: store.people.length,
      mensMemberships: mens
        ? store.teamMemberships.filter(m => m.teamId === mens.id).length
        : 0,
      womensMemberships: womens
        ? store.teamMemberships.filter(m => m.teamId === womens.id).length
        : 0,
    },
    accounts: {
      signedUp: accounts.length,
      claimed: claimed.length,
      signedUpButUnclaimed: accounts.length - claimed.length,
      pendingClaims: store.profileClaimRequests.filter(r => r.status === 'pending').length,
    },
    /** Of the people who got in, how many did anything at all. */
    activation: funnel,
    erasArrived,
    content: {
      moments: store.moments.length,
      gatherings: store.clubhouseGatherings.length,
      openRequests: store.openRequests.length,
      teamQuestions: store.teamQuestions.length,
      chatMessages: store.chatMessages.length,
      spotlights: store.alumniSpotlights.length,
      nominations: store.spotlightNominations.length,
    },
    /** Runs of roster years with nobody in them, longest first. */
    rosterGaps: gaps
      .map(g => ({ ...g, years: g.to - g.from + 1 }))
      .sort((a, b) => b.years - a.years)
      .slice(0, 8),
    claimedPeople: claimedPersonIds.size,
    accountsWithoutCards: accounts.length - claimedIds.size,
  })
}

export async function GET(req: NextRequest) {
  try {
    return await runJob(req)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
