// First-time setup: signed-in user picks their Member Book entry to claim.

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { memberBookEntries, getMemberById } from '@/lib/member-book/data'
import { getPublicMembers, getMemberPennGolfYears } from '@/lib/member-book/helpers'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'
import AccountSetupClient from './AccountSetupClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Claim your card',
  description: 'Find your Member Book card and claim it.',
}

const TEAM_SLUG = 'penn-mens-golf'

export const dynamic = 'force-dynamic'

export default async function AccountSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string; q?: string }>
}) {
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

  // Came from a member card ('Is this you?') — seed the search with that
  // name so they don't have to find themselves twice.
  const sp = await searchParams
  const seeded = sp.bookId ? getMemberById(sp.bookId)?.displayName ?? null : sp.q ?? null

  return (
    <AccountSetupClient
      initialQuery={seeded}
      members={minimal}
      signedInName={session.user?.name ?? null}
      signedInEmail={session.user?.email ?? null}
      claimedCount={claimedCount}
      monthCount={monthCount}
    />
  )
}
