/**
 * Locker Room access — current players + alumni only. Coach and family
 * are explicitly excluded. Used to gate both the dedicated /locker-room
 * surface and `audience: 'locker-room'` Moments.
 */

import type { Account, Store, TeamMembership } from '@/lib/store/types'

export function canSeeLockerRoomByMembership(
  membership: TeamMembership | null | undefined,
): boolean {
  const role = membership?.memberRole
  return role === 'current_player' || role === 'alumni'
}

/**
 * Convenience: resolve the viewer's TeamMembership from the store via
 * their linked person id, then apply the gate. Returns false for
 * unlinked accounts (pending users) and signed-out viewers.
 */
export function canSeeLockerRoomForAccount(
  account: Account | null | undefined,
  store: Pick<Store, 'teamMemberships'>,
  teamId: string,
): boolean {
  if (!account?.linkedPersonId) return false
  const membership = store.teamMemberships.find(
    m => m.personId === account.linkedPersonId && m.teamId === teamId,
  )
  return canSeeLockerRoomByMembership(membership)
}
