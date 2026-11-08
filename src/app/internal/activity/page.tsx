/**
 * Who has actually done anything.
 *
 * The pulse route computes this per member and then throws the detail
 * away, returning only counts: "profile 9, posted 1, rsvped 1". Those
 * counts are what the strategy has been argued from, and they cannot
 * answer the first question anyone asks about them, which is who. This
 * page keeps the names.
 *
 * It also lists the accounts that signed in and never claimed a card.
 * There were twelve of them against thirty-six who had, they already
 * found the site and already have an account, and until now nobody had
 * written to a single one.
 *
 * Founder only. It reads the store directly, like the other internal
 * pages, and writes nothing.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { findClubYearsName } from '@/lib/program-history/penn-club-years'
import { findCardCandidates } from '@/lib/member-book/candidates'
import ActivityClient, { type MemberRow, type UnclaimedRow } from './ActivityClient'

const TEAM_SLUG = 'penn-mens-golf'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ActivityPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login?next=/internal/activity')
  const email = session.user.email.toLowerCase().trim()
  if (!FOUNDER_EMAILS.has(email)) {
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#fbf9f6] flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-3">
            Restricted
          </p>
          <h1 className="text-[#0a1628] text-2xl font-medium mb-2 font-heading">
            Founder only.
          </h1>
        </div>
      </div>
    )
  }

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return <div className="p-8 text-sm text-red-600">Team not found</div>

  const personName = new Map(store.people.map(p => [p.id, p.canonicalName]))
  const teamAccounts = store.accounts.filter(a => a.teamId === team.id)

  const members: MemberRow[] = teamAccounts
    .filter(a => a.linkedPersonId)
    .map((a): MemberRow => {
      const personId = a.linkedPersonId as string
      const e = store.personEnrichments.find(x => x.personId === personId)
      const messages = store.chatMessages.filter(m => m.fromAccountId === a.id).length
      const moments = store.moments.filter(m => m.postedByAccountId === a.id).length
      const comments = store.momentComments.filter(c => c.fromAccountId === a.id).length
      const rsvps = store.clubhouseGatheringRequests.filter(r => r.fromAccountId === a.id).length
      const hosted = store.clubhouseGatherings.filter(g => g.hostPersonId === personId).length
      const asks = store.playerAlumniRequests.filter(
        r => r.alumniPersonId === personId || r.fromEmail === (a.email ?? '').toLowerCase(),
      ).length
      const openReqs = store.openRequests.filter(r => r.fromAccountId === a.id).length
      const questions = store.teamQuestions.filter(q => q.askerAccountId === a.id).length
      const profile = !!(e?.alumniBio || e?.currentRole || e?.city || e?.photoUrl)
      return {
        name: personName.get(personId) ?? a.name ?? a.email ?? 'Unknown',
        joinedAt: a.linkedAt ?? a.createdAt,
        profile,
        messages,
        moments,
        comments,
        rsvps,
        hosted,
        asks,
        openReqs,
        questions,
        total: messages + moments + comments + rsvps + hosted + asks + openReqs + questions,
      }
    })
    .sort((x, y) => y.total - x.total || x.name.localeCompare(y.name))

  // Cards already spoken for, so the page can mark a namesake or a second
  // sign-in as skipped rather than inviting a bogus claim.
  const claimedNames = new Set(
    teamAccounts
      .filter(a => a.linkedPersonId)
      .map(a => personName.get(a.linkedPersonId as string))
      .filter((n): n is string => !!n)
      .map(n => n.trim().toLowerCase()),
  )

  const unclaimed: UnclaimedRow[] = teamAccounts
    .filter(a => !a.linkedPersonId && !!a.email)
    .map((a): UnclaimedRow => {
      const entry = a.name ? findBookEntryForTeamStorePerson(a.name) : null
      const clubYears = entry ? null : findClubYearsName(a.name)
      // Review-only suggestions. The strict matcher above missed a 1976
      // captain over a middle initial and a 2004-05 women's captain whose
      // account carries no name at all, so the page shows what it suspects
      // and leaves the decision to a human.
      const candidates = entry
        ? []
        : findCardCandidates({ name: a.name, email: a.email }).slice(0, 3).map(c => ({
            bookId: c.entry.id,
            displayName: c.entry.displayName,
            program: c.program,
            years:
              c.startYear && c.endYear
                ? c.startYear === c.endYear
                  ? `${c.startYear}`
                  : `${c.startYear}-${c.endYear}`
                : null,
            basis: c.basis,
            evidence: c.evidence,
          }))
      return {
        accountId: a.id,
        name: a.name ?? null,
        email: a.email as string,
        signedUpAt: a.createdAt,
        matchName: entry?.displayName ?? null,
        matchClassLabel: entry?.profile.classYearEstimate ?? null,
        matchBookId: entry?.id ?? null,
        matchClaimedByOther:
          !!entry && claimedNames.has(entry.displayName.trim().toLowerCase()),
        clubYearsDetail: clubYears?.detail ?? clubYears?.name ?? null,
        candidates,
        nudgedAt: a.claimNudgeSentAt ?? null,
      }
    })
    .sort((x, y) => x.signedUpAt.localeCompare(y.signedUpAt))

  return <ActivityClient members={members} unclaimed={unclaimed} />
}
