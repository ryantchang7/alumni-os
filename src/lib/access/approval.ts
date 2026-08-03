/**
 * Approval-state helpers. An "approved member" is an account that has
 * been linked to a Member Book entry by a captain. This is the gate for
 * member-only surfaces (rounds, gatherings, Moments, Career floor).
 */

import { auth } from '@/auth'

export interface ApprovalState {
  signedIn: boolean
  approved: boolean
  email: string | null
  linkedPersonId: string | null
  /** 'parent' covers family + affiliates — their copy differs from players'. */
  memberRole: 'current_player' | 'alumni' | 'parent' | 'coach' | null
  /** e.g. "Parent of John Smith C'24" — shown instead of roster years. */
  parentRelationship: string | null
}

export async function getApprovalState(): Promise<ApprovalState> {
  const session = await auth()
  let memberRole: ApprovalState['memberRole'] = null
  let parentRelationship: string | null = null
  if (session?.linkedPersonId) {
    const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
    const [store, team] = await Promise.all([readStore(), getTeamBySlug('penn-mens-golf')])
    const membership = team
      ? store.teamMemberships.find(
          m => m.teamId === team.id && m.personId === session.linkedPersonId,
        )
      : undefined
    memberRole = membership?.memberRole ?? null
    parentRelationship = membership?.parentRelationship ?? null
  }
  return {
    signedIn: !!session?.accountId,
    approved: !!session?.linkedPersonId,
    email: session?.user?.email ?? null,
    linkedPersonId: session?.linkedPersonId ?? null,
    memberRole,
    parentRelationship,
  }
}

/** Family + affiliates get different copy than players and alumni. */
export function isFamilyViewer(state: Pick<ApprovalState, 'memberRole'>): boolean {
  return state.memberRole === 'parent'
}
