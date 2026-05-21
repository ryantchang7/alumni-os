// First-time setup: signed-in user picks their Member Book entry to claim.

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { memberBookEntries } from '@/lib/member-book/data'
import { getPublicMembers, getMemberPennGolfYears } from '@/lib/member-book/helpers'
import AccountSetupClient from './AccountSetupClient'

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

  return (
    <AccountSetupClient
      members={minimal}
      signedInName={session.user?.name ?? null}
      signedInEmail={session.user?.email ?? null}
    />
  )
}
