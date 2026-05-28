/**
 * Lightweight viewer-access endpoint. Tells client components whether
 * the signed-in user can see the Locker Room (alumni + current
 * players) so they can render the right toggles and nav entries.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAccountById,
  getTeamBySlug,
  readStore,
} from '@/lib/store/local-store'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'

const TEAM_SLUG = 'penn-mens-golf'

export async function GET() {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({
      signedIn: false,
      approved: false,
      canSeeLockerRoom: false,
    })
  }
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return NextResponse.json({
      signedIn: true,
      approved: !!session.linkedPersonId,
      canSeeLockerRoom: false,
    })
  }
  const account = await getAccountById(session.accountId)
  const store = await readStore()
  const canSeeLockerRoom = canSeeLockerRoomForAccount(account, store, team.id)
  return NextResponse.json({
    signedIn: true,
    approved: !!account?.linkedPersonId,
    canSeeLockerRoom,
  })
}
