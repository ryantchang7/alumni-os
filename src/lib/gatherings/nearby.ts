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

/**
 * Approved members whose card puts them in the same place as the round.
 *
 * State is the reliable signal, so it wins when present; city text is the
 * fallback for a round posted without one. A gathering with neither reaches
 * nobody, which is deliberate: we would otherwise be guessing.
 */
export function selectNearbyRecipients(input: NearbyInput): Account[] {
  const { gathering } = input
  if (!gathering.city && !gathering.state) return []

  const stateCode = enrichmentStateToCode(gathering.state)
  const cityLc = gathering.city?.toLowerCase().trim()
  if (!stateCode && !cityLc) return []

  const enrichByPerson = new Map(
    input.enrichments.filter(e => e.teamId === gathering.teamId).map(e => [e.personId, e]),
  )
  const roleByPerson = new Map(
    input.memberships.filter(m => m.teamId === gathering.teamId).map(m => [m.personId, m.memberRole]),
  )

  return input.accounts.filter(a => {
    // Unapproved accounts cannot see the round, so must not be told about it.
    if (!a.linkedPersonId || a.id === input.hostAccountId) return false

    // Respect who the host said it was for.
    const role = roleByPerson.get(a.linkedPersonId)
    if (gathering.audience === 'players' && role !== 'current_player') return false
    if (gathering.audience === 'alumni' && role !== 'alumni') return false

    const e = enrichByPerson.get(a.linkedPersonId)
    if (!e) return false
    if (stateCode) return enrichmentStateToCode(e.state) === stateCode
    return (e.city ?? '').toLowerCase().trim() === cityLc
  })
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
