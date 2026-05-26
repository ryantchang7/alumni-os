// First-time setup: signed-in user picks their Member Book entry to claim.

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers, getMemberPennGolfYears } from '@/lib/member-book/helpers'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'
import AccountSetupClient from './AccountSetupClient'

const TEAM_SLUG = 'penn-mens-golf'

export const dynamic = 'force-dynamic'

export default async function AccountSetupPage() {
  const session = await auth()
  if (!session) {
    redirect('/login?next=/account/setup')
  }
  if (session.linkedPersonId) {
    redirect('/account/profile')
  }

  const publicMembers = getPublicMembers(memberBookEntries)
  const minimal = publicMembers.map((m) => ({
    bookId: m.id,
    displayName: m.displayName,
    yearsLabel: getMemberPennGolfYears(m),
    hometown: m.profile.hometown ?? null,
    classYear: m.profile.classYearEstimate ?? null,
  }))

  // Live counts to anchor the welcome — "X classmates already checked in,
  // Y came back this month."
  let claimedCount = 0
  let monthCount = 0
  try {
    const team = await getTeamBySlug(TEAM_SLUG)
    if (team) {
      const store = await readStore()
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      for (const a of store.accounts) {
        if (a.teamId !== team.id) continue
        if (!a.linkedPersonId) continue
        claimedCount++
        if (Date.parse(a.createdAt) >= startOfMonth.getTime()) monthCount++
      }
    }
  } catch {
    // Counts are decoration. Soldier on.
  }

  return (
    <AccountSetupClient
      members={minimal}
      signedInName={session.user?.name ?? null}
      signedInEmail={session.user?.email ?? null}
      claimedCount={claimedCount}
      monthCount={monthCount}
    />
  )
}
