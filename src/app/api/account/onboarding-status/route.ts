/**
 * Onboarding status for the current signed-in linked account. Used by
 * <ClubhouseChecklist /> to render its 0/3 → 3/3 state. Returns three
 * booleans + the linkedPersonId so the client can decide to mount.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ linked: false })
  }

  const teamSlug = 'penn-mens-golf'
  const { readStore, getTeamBySlug, getPersonEnrichment } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ linked: false })

  const enrichment = await getPersonEnrichment(session.linkedPersonId, team.id)
  const hasCity = !!enrichment?.city?.trim()
  const hasAvailability = !!(
    enrichment?.openToCoffee ||
    enrichment?.openToMentorship ||
    enrichment?.openToWarmIntroductions ||
    enrichment?.openToGolfRounds
  )

  // First-post check: any of Moments / CareerPosts (by accountId) or
  // gatherings (by hostPersonId).
  const store = await readStore()
  const hasMoment = store.moments.some(
    m => m.teamId === team.id && m.postedByAccountId === session.accountId,
  )
  const hasCareerPost = store.careerPosts.some(
    p => p.teamId === team.id && p.postedByAccountId === session.accountId,
  )
  const hasGathering = store.clubhouseGatherings.some(
    g => g.teamId === team.id && g.hostPersonId === session.linkedPersonId,
  )
  const hasFirstPost = hasMoment || hasCareerPost || hasGathering

  return NextResponse.json({
    linked: true,
    hasCity,
    hasAvailability,
    hasFirstPost,
  })
}
