/**
 * Launch metrics — founder-facing counts only. No tracking, no
 * cookies, no third-party analytics. Reads straight from the store.
 *
 * Intended caller: src/app/api/internal/launch-readiness/metrics or
 * a server-rendered page that's already founder-gated.
 */

import 'server-only'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export interface LaunchMetrics {
  generatedAt: string
  membersInBook: number
  teamMembershipsLive: number
  approvedAccounts: number
  pendingClaims: number
  approvedClaims: number
  declinedClaims: number
  profilesWithCity: number
  profilesWithPhoto: number
  profilesOpenToRounds: number
  openRequestsLive: number
  gatherings: number
  moments: number
  careerPosts: number
  chatConversations: number
  supportersActive: number
  donationsTotal: number
  donationsCount: number
  familyAffiliateMembers: number
}

export async function getLaunchMetrics(): Promise<LaunchMetrics> {
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)
  const teamId = team?.id ?? null

  const accounts = store.accounts ?? []
  const claims = store.profileClaimRequests ?? []
  const enrichments = store.personEnrichments ?? []
  const memberships = teamId ? store.teamMemberships.filter(m => m.teamId === teamId) : []
  const openRequestsLive = (store.openRequests ?? []).filter(r => r.status === 'open').length
  const moments = (store.moments ?? []).filter(m => m.status === 'published').length
  const chatConversations = store.chatConversations?.length ?? 0
  const careerPosts = (store.careerPosts ?? []).filter(p => p.status === 'open').length
  const gatherings = (store.clubhouseGatherings ?? []).filter(g => g.status !== 'closed').length

  const approvedAccounts = accounts.filter(a => !!a.linkedPersonId).length
  const familyAffiliateMembers = memberships.filter(m => (m as { parentRelationship?: string }).parentRelationship).length

  const profilesWithCity = enrichments.filter(e => (e.city ?? '').trim().length > 0).length
  const profilesWithPhoto = enrichments.filter(e => (e.photoUrl ?? '').trim().length > 0).length
  const profilesOpenToRounds = enrichments.filter(e => e.openToGolfRounds === true).length

  const supportersActive = accounts.filter(
    a => a.subscription?.status === 'active' || a.subscription?.status === 'trialing',
  ).length

  const donations = store.donations ?? []
  const donationsTotal = donations.reduce((sum, d) => sum + (d.amountCents ?? 0), 0)

  return {
    generatedAt: new Date().toISOString(),
    membersInBook: 0, // book entries live in a separate JSON read by /lib/member-book/data; counted on the page
    teamMembershipsLive: memberships.length,
    approvedAccounts,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    approvedClaims: claims.filter(c => c.status === 'approved').length,
    declinedClaims: claims.filter(c => c.status === 'declined').length,
    profilesWithCity,
    profilesWithPhoto,
    profilesOpenToRounds,
    openRequestsLive,
    gatherings,
    moments,
    careerPosts,
    chatConversations,
    supportersActive,
    donationsTotal,
    donationsCount: donations.length,
    familyAffiliateMembers,
  }
}
