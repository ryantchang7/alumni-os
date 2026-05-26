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
}

export async function getApprovalState(): Promise<ApprovalState> {
  const session = await auth()
  return {
    signedIn: !!session?.accountId,
    approved: !!session?.linkedPersonId,
    email: session?.user?.email ?? null,
    linkedPersonId: session?.linkedPersonId ?? null,
  }
}
