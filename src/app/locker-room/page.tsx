/**
 * Locker Room — standalone page for the audience: 'locker-room' feed.
 * Mirrors the /moments?view=locker-room tab; both surfaces exist so
 * direct links to /locker-room keep working. Coach + family + signed-out
 * viewers get a GatedPreview.
 */

import Link from 'next/link'
import { getApprovalState } from '@/lib/access/approval'
import { Lock } from 'lucide-react'
import { auth } from '@/auth'
import {
  getAccountById,
  getMomentsForTeam,
  getTeamBySlug,
  readStore,
} from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { getMemberById } from '@/lib/member-book/data'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'
import { getBadgesForAccount, type BadgeId } from '@/lib/badges'
import GatedPreview from '@/components/GatedPreview'
import { getSiteContentOrDefault } from '@/lib/site-content/read'
import LockerRoomHero from './LockerRoomHero'
import MomentCard from '@/components/moments/MomentCard'
import { FOUNDER_EMAILS } from '@/lib/badges'

const TEAM_SLUG = 'penn-mens-golf'

export default async function LockerRoomPage() {
  const session = await auth()
  const team = await getTeamBySlug(TEAM_SLUG)
  const crestImage = await getSiteContentOrDefault('locker-room.crest-image')
  const emptyHeadline = await getSiteContentOrDefault('locker-room.empty-headline')
  const emptyBlurb = await getSiteContentOrDefault('locker-room.empty-blurb')

  const approval = await getApprovalState()
  const signedIn = !!session?.accountId
  let canSee = false
  let store: Awaited<ReturnType<typeof readStore>> | null = null
  if (signedIn && team) {
    const account = await getAccountById(session!.accountId!)
    store = await readStore()
    canSee = canSeeLockerRoomForAccount(account, store, team.id)
  }

  // Coaches and family are deliberately outside this room. They're already
  // approved members, so the generic 'claim your card' gate would be telling
  // them to do something they've done — say plainly that it isn't for them.
  const excludedByRole =
    approval.memberRole === 'coach' || approval.memberRole === 'parent'

  if (excludedByRole) {
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
        <LockerRoomHero crestImage={crestImage} showPostCta={false} />
        <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <div
            className="bg-white border border-[rgba(180,168,150,0.45)] rounded-2xl p-8 sm:p-12 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 10px 28px rgba(10,22,40,0.06)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
              Players &amp; alumni only · Locker Room
            </p>
            <h2 className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading mb-3">
              This one stays between the guys.
            </h2>
            <p className="text-[14px] text-[#3d4a5c] leading-relaxed max-w-md mx-auto">
              The Locker Room is kept to current players and alumni so they can
              talk freely. Everything else in the Clubhouse is yours.
            </p>
            <div className="mt-7 pt-6 border-t border-[rgba(180,168,150,0.3)] flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/moments" className="text-[12px] font-semibold text-[#0a1628] hover:text-[#990000] transition-colors">
                Go to Moments &rarr;
              </Link>
              <Link href="/team-room" className="text-[12px] font-semibold text-[#0a1628] hover:text-[#990000] transition-colors">
                Follow the team &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!signedIn || !canSee) {
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
        <LockerRoomHero crestImage={crestImage} showPostCta={false} />
        <GatedPreview
          signedIn={signedIn}
          eyebrow="Players &amp; alumni only · Locker Room"
          headline="This one stays between us."
          blurb="The Locker Room is for current players and alumni. Sign in and claim your card to see what&rsquo;s on the wall."
        />
      </div>
    )
  }

  // canSee + team + store are all defined here.
  const allMoments = await getMomentsForTeam(team!.id)
  const moments = allMoments.filter(m => m.audience === 'locker-room')

  function bookIdForPerson(personId: string | undefined): string | null {
    if (!personId || !store) return null
    const person = store.people.find(p => p.id === personId)
    if (!person) return null
    const entry = findBookEntryForTeamStorePerson(person.canonicalName)
    return entry?.id ?? null
  }

  function taggedMembersFor(personIds: string[] | undefined, bookIds?: string[]) {
    if (!store || (!personIds?.length && !bookIds?.length)) return undefined
    const out = (personIds ?? [])
      .map(id => {
        const person = store.people.find(p => p.id === id)
        if (!person) return null
        return { personId: id, name: person.canonicalName, bookId: bookIdForPerson(id) }
      })
      .filter((x): x is { personId: string; name: string; bookId: string | null } => x !== null)
    for (const bid of bookIds ?? []) {
      const entry = getMemberById(bid)
      if (!entry) continue
      if (out.some(x => x.bookId === bid)) continue
      out.push({ personId: 'book:' + bid, name: entry.displayName, bookId: bid })
    }
    return out.length ? out : undefined
  }

  function badgesForPoster(accountId: string): BadgeId[] {
    if (!store) return []
    const account = store.accounts.find(a => a.id === accountId)
    return account ? getBadgesForAccount(account) : []
  }

  const allComments = store?.momentComments.filter(c => c.status === 'published') ?? []
  const allReactions = store?.momentReactions ?? []
  const viewerAccountId = session?.accountId ?? null
  const viewerIsFounder = FOUNDER_EMAILS.has((session?.user?.email ?? '').toLowerCase().trim())
  const canPost = !!session?.linkedPersonId

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <LockerRoomHero crestImage={crestImage} showPostCta />

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {moments.length === 0 ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-[#c8a84b]/35 bg-gradient-to-br from-[#0a1628] to-[#15233f] text-white px-8 py-14 text-center"
            style={{
              boxShadow:
                '0 1px 3px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.18)',
            }}
          >
            <div className="relative flex flex-col items-center">
              {crestImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={crestImage}
                  alt="Locker Room crest"
                  className="h-28 sm:h-32 w-auto mb-6"
                  style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
                />
              ) : (
                <span
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0a1628] border border-[#c8a84b]/60 mb-5"
                  style={{ boxShadow: '0 0 0 8px rgba(200,168,75,0.08), 0 0 28px rgba(200,168,75,0.20)' }}
                >
                  <Lock className="w-6 h-6 text-[#c8a84b]" />
                </span>
              )}
              <p
                className="text-[#c8a84b] text-2xl font-medium mb-3 font-heading"
              >
                {emptyHeadline}
              </p>
              <p className="text-white/75 text-[13.5px] max-w-md mx-auto mb-7 leading-relaxed whitespace-pre-line">
                {emptyBlurb}
              </p>
              <Link
                href="/moments/new?audience=locker-room"
                className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_22px_rgba(200,168,75,0.45)]"
              >
                <Lock className="w-4 h-4" />
                Post the first
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {moments.map(m => (
              <MomentCard
                key={m.id}
                moment={m}
                bookId={bookIdForPerson(m.postedByPersonId)}
                posterBadges={badgesForPoster(m.postedByAccountId)}
                initialReactions={allReactions.filter(r => r.momentId === m.id)}
                initialComments={allComments
                  .filter(c => c.momentId === m.id)
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
                viewerAccountId={viewerAccountId}
                canPost={canPost}
                showLockerPill
                isFounder={viewerIsFounder}
                taggedMembers={taggedMembersFor(m.taggedPersonIds, m.taggedBookIds)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
