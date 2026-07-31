/**
 * Who may POST Season Updates (qualifiers, results, notes): the founder,
 * team captains, and coaches. Deleting updates and travel stops stays
 * founder-only — this guard is for posting.
 */

import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { getAccountById, readStore, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export async function canPostSeasonUpdates(): Promise<
  { ok: true; email: string; accountId: string | null } | { ok: false }
> {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email) return { ok: false }
  if (FOUNDER_EMAILS.has(email)) return { ok: true, email, accountId: session?.accountId ?? null }

  const store = await readStore()
  if (isCaptainEmailWithOverrides(email, TEAM_SLUG, store.accounts)) {
    return { ok: true, email, accountId: session?.accountId ?? null }
  }
  // Coach: signed-in account linked to a person with a coach membership.
  if (session?.accountId) {
    const account = await getAccountById(session.accountId)
    const team = await getTeamBySlug(TEAM_SLUG)
    if (
      account?.linkedPersonId &&
      team &&
      store.teamMemberships.some(
        m =>
          m.teamId === team.id &&
          m.personId === account.linkedPersonId &&
          m.memberRole === 'coach',
      )
    ) {
      return { ok: true, email, accountId: session?.accountId ?? null }
    }
  }
  return { ok: false }
}
