/**
 * Who hears about a newly posted round.
 *
 * Kept pure and separate from the route so the rule can be tested without a
 * server: this decides who gets an email, and getting it wrong means either
 * silence or mailing the whole roster about a round three states away.
 */

import type { Account, PersonEnrichment, TeamMembership, ClubhouseGathering } from '@/lib/store/types'
import { enrichmentStateToCode, CODE_TO_NAME } from '@/lib/map/state-lookup'

/**
 * Who the host wants told.
 *
 * 'nearby' is the default and what everyone got before this existed: anyone
 * whose card puts them in the same place. 'invite' is for a round that is
 * really for a few specific people, and 'quiet' posts it to the board without
 * mailing anyone, which is what you want for a placeholder or a re-post.
 */
export type NotifyMode = 'nearby' | 'invite' | 'quiet'

export interface NearbyInput {
  accounts: Account[]
  enrichments: PersonEnrichment[]
  memberships: TeamMembership[]
  gathering: Pick<
    ClubhouseGathering,
    'teamId' | 'city' | 'state' | 'audience' | 'type' | 'hostName' | 'dateText'
  >
  /** The host never gets notified about their own round. */
  hostAccountId: string
}

/** Where a post ended up going, so the caller can log it and the email can
 *  avoid telling someone in Boston that a Chicago round is "in your area". */
export type Reach = 'nearby' | 'everyone'

export interface ReachResult {
  recipients: Account[]
  reach: Reach
}

/**
 * Enough people nearby that a geographic send is a real send. Below this we
 * would rather tell the whole club than tell nobody.
 */
export const MIN_NEARBY_REACH = 12

/**
 * Above this many members, "tell everyone" stops being neighbourly and starts
 * being spam, so posts go back to geography only even when that reaches few.
 * Revisit with a per-member notification preference before the club gets here.
 */
export const BROADCAST_CLUB_CEILING = 150

/**
 * Widen a geographic match to the whole club when the match is too small to
 * matter.
 *
 * Measured 2026-11-07: 36 members had claimed a card and 9 had saved a
 * location. The geographic filter therefore resolved to nobody for almost
 * every post, so a member posted "I'm in Chicago the 20th", it reached one
 * person or none, nothing happened, and they never posted again. The profile
 * had quietly become the distribution list. At this size everything the club
 * does is relevant to everyone in it, so a post that matches nobody nearby
 * goes to everybody instead of into the void.
 */
export function widenReach(near: Account[], eligible: Account[]): ReachResult {
  if (near.length >= MIN_NEARBY_REACH) return { recipients: near, reach: 'nearby' }
  if (eligible.length <= BROADCAST_CLUB_CEILING) {
    return { recipients: eligible, reach: 'everyone' }
  }
  return { recipients: near, reach: 'nearby' }
}

/**
 * A club-wide send is a broadcast, so it honours the community mute that a
 * genuinely local one ignores.
 *
 * Without this, widening reach would quietly override a preference a member
 * had already set: they ticked "no community-wide notifications" and would
 * have started getting mail about every round in the country. The mute only
 * ever covered the bell and push, never the email the routes send
 * separately, so both now drop the same people.
 */
export function dropCommunityMuted(accounts: Account[], reach: Reach): Account[] {
  if (reach !== 'everyone') return accounts
  return accounts.filter(a => a.mutedCommunityNotifications !== true)
}

/**
 * Approved members who should hear about a round: the ones in the same place,
 * widened to the whole club while the club is small enough that it is welcome
 * (see widenReach). A gathering with no place at all still goes club-wide, as
 * there is nothing to narrow by.
 */
export function selectNearbyRecipients(input: NearbyInput): ReachResult {
  const { gathering } = input

  const enrichByPerson = new Map(
    input.enrichments.filter(e => e.teamId === gathering.teamId).map(e => [e.personId, e]),
  )
  const roleByPerson = new Map(
    input.memberships.filter(m => m.teamId === gathering.teamId).map(m => [m.personId, m.memberRole]),
  )

  // Anyone who could see this round at all. The audience rule is the host's
  // instruction and is never widened; only geography is.
  const eligible = input.accounts.filter(a => {
    // Unapproved accounts cannot see the round, so must not be told about it.
    if (!a.linkedPersonId || a.id === input.hostAccountId) return false
    const role = roleByPerson.get(a.linkedPersonId)
    if (gathering.audience === 'players' && role !== 'current_player') return false
    if (gathering.audience === 'alumni' && role !== 'alumni') return false
    return true
  })

  const stateCode = enrichmentStateToCode(gathering.state)
  const cityLc = gathering.city?.toLowerCase().trim()
  if (!stateCode && !cityLc) return widenReach([], eligible)

  const near = eligible.filter(a => {
    const e = enrichByPerson.get(a.linkedPersonId as string)
    if (!e) return false
    if (stateCode) return enrichmentStateToCode(e.state) === stateCode
    return (e.city ?? '').toLowerCase().trim() === cityLc
  })

  const picked = widenReach(near, eligible)
  return { ...picked, recipients: dropCommunityMuted(picked.recipients, picked.reach) }
}

/** "Ardmore, PA" / "Pennsylvania" / "the area" — what the email says. */
export function placeLabel(
  gathering: Pick<ClubhouseGathering, 'city' | 'state'>,
): string {
  if (gathering.city) return gathering.state ? `${gathering.city}, ${gathering.state}` : gathering.city
  const code = enrichmentStateToCode(gathering.state)
  if (code) return CODE_TO_NAME[code] ?? gathering.state ?? 'the area'
  return gathering.state ?? 'the area'
}

export const TYPE_LABEL: Record<ClubhouseGathering['type'], string> = {
  round: 'a round',
  coffee: 'coffee',
  drinks: 'drinks',
  dinner: 'dinner',
  event: 'an event',
}
