// /moments — the Penn Golf wall. Reverse-chrono feed of member-posted
// photos + captions. Two tabs: "All Moments" (public) and "Locker Room"
// (players + alumni only). Sign-in + claim required to post / react /
// comment.

import Link from 'next/link'
import {
  getTeamBySlug,
  getMomentsForTeam,
  getAccountById,
  readStore,
} from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { Camera, Lock } from 'lucide-react'
import { auth } from '@/auth'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import HeroCrest from '@/components/HeroCrest'
import { getBadgesForAccount, type BadgeId } from '@/lib/badges'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'
import { getSiteContentOrDefault } from '@/lib/site-content/read'
import MomentCard from '@/components/moments/MomentCard'

const TEAM_SLUG = 'penn-mens-golf'

type View = 'all' | 'locker-room'

interface PageProps {
  searchParams: Promise<{ view?: string }>
}

export default async function MomentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const requestedView: View = params.view === 'locker-room' ? 'locker-room' : 'all'

  const approval = await getApprovalState()
  const team = await getTeamBySlug(TEAM_SLUG)
  const allMoments = team ? await getMomentsForTeam(team.id) : []
  const store = team ? await readStore() : null
  const crestImage = await getSiteContentOrDefault('moments.crest-image')
  const lockerCrest = await getSiteContentOrDefault('locker-room.crest-image')
  const subtitle = await getSiteContentOrDefault('moments.subtitle')
  const emptyHeadline = await getSiteContentOrDefault('moments.empty-headline')
  const emptyBlurb = await getSiteContentOrDefault('moments.empty-blurb')
  const lockerEmptyHeadline = await getSiteContentOrDefault('locker-room.empty-headline')
  const lockerEmptyBlurb = await getSiteContentOrDefault('locker-room.empty-blurb')

  const session = await auth()
  let canSeeLockerRoom = false
  if (session?.accountId && team && store) {
    const account = await getAccountById(session.accountId)
    canSeeLockerRoom = canSeeLockerRoomForAccount(account, store, team.id)
  }

  // Fall back to "all" if the viewer asks for locker-room but isn't eligible.
  const view: View = requestedView === 'locker-room' && canSeeLockerRoom ? 'locker-room' : 'all'

  // The "All Moments" tab is public-only; locker-room posts live in their
  // own tab so the audience always reads cleanly from where you're standing.
  const moments =
    view === 'locker-room'
      ? allMoments.filter(m => m.audience === 'locker-room')
      : allMoments.filter(m => m.audience !== 'locker-room')

  const lockerCount = allMoments.filter(m => m.audience === 'locker-room').length

  if (!approval.approved) {
    const uniquePosters = new Set(moments.map((m) => m.postedByAccountId)).size
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
          <div className="max-w-[820px] mx-auto flex items-center gap-5 sm:gap-7">
            <HeroCrest src={crestImage} alt="Moments crest" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
                Penn Men&rsquo;s Golf · The Wall
              </p>
              <h1
                className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Moments
              </h1>
            </div>
          </div>
        </div>
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · The Wall"
          headline="Moments stay between members."
          blurb="The Wall is where Penn Golf alumni share rounds, dinners, championship memories — the stuff the Penn Golf family is built on. Claim your card to see and post."
          stats={[
            { label: 'On the wall', value: moments.length },
            { label: 'Posters', value: uniquePosters },
          ]}
        />
      </div>
    )
  }

  // Resolve poster -> Member Book bookId for linking.
  function bookIdForPerson(personId: string | undefined): string | null {
    if (!personId || !store) return null
    const person = store.people.find((p) => p.id === personId)
    if (!person) return null
    const entry = findBookEntryForTeamStorePerson(person.canonicalName)
    return entry?.id ?? null
  }

  // Resolve poster -> tier/captain/founder badges for the inline pin.
  function badgesForPoster(accountId: string): BadgeId[] {
    if (!store) return []
    const account = store.accounts.find(a => a.id === accountId)
    return account ? getBadgesForAccount(account) : []
  }

  const allComments = store?.momentComments.filter(c => c.status === 'published') ?? []
  const allReactions = store?.momentReactions ?? []
  const viewerAccountId = session?.accountId ?? null
  const canPost = !!session?.linkedPersonId

  const isLockerView = view === 'locker-room'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14 relative overflow-hidden">
        <div className="max-w-[820px] mx-auto relative flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="Moments crest" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
              Penn Men&rsquo;s Golf · The Wall
            </p>
            <h1
              className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Moments
            </h1>
            <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed whitespace-pre-line mt-5">
              {subtitle}
            </p>
            <div className="mt-7">
              <Link
                href={isLockerView ? '/moments/new?audience=locker-room' : '/moments/new'}
                className={`inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors ${
                  isLockerView
                    ? 'bg-[#0a1628] hover:bg-[#112240] text-[#c8a84b] border border-[#c8a84b]/55'
                    : 'bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628]'
                }`}
              >
                {isLockerView ? <Lock className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {isLockerView ? 'Post to the Locker Room' : 'Post a moment'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab segmented control. Sits on a navy strip so the bar reads
          as a continuation of the hero. The active pill is a solid block,
          the inactive pill is a quiet outline — clearly two different
          places, not two style variants of the same feed. Only eligible
          viewers (players + alumni) see the Locker Room pill at all. */}
      {canSeeLockerRoom && (
        <div className="bg-[#0a1628] border-t border-[rgba(255,255,255,0.06)] border-b border-[rgba(255,255,255,0.06)]">
          <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-4 flex items-center gap-3">
            <Link
              href="/moments"
              className={`inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.18em] px-5 py-2.5 rounded-lg transition-all ${
                isLockerView
                  ? 'text-white/55 hover:text-white border border-transparent'
                  : 'bg-white text-[#0a1628] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
              }`}
              aria-current={!isLockerView ? 'page' : undefined}
            >
              All Moments
            </Link>
            <Link
              href="/moments?view=locker-room"
              className={`inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.18em] px-5 py-2.5 rounded-lg transition-all ${
                isLockerView
                  ? 'bg-[#c8a84b] text-[#0a1628] shadow-[0_2px_18px_rgba(200,168,75,0.45)]'
                  : 'text-[#c8a84b] border border-[#c8a84b]/45 hover:border-[#c8a84b] hover:bg-[#c8a84b]/10'
              }`}
              aria-current={isLockerView ? 'page' : undefined}
            >
              <Lock className="w-3.5 h-3.5" />
              Locker Room
              {lockerCount > 0 && (
                <span
                  className={`text-[10.5px] tabular-nums px-1.5 py-0.5 rounded-full ${
                    isLockerView
                      ? 'bg-[#0a1628]/15 text-[#0a1628]'
                      : 'bg-[#c8a84b]/15 text-[#0a1628]/70'
                  }`}
                >
                  {lockerCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {moments.length === 0 ? (
          isLockerView ? (
            // Locker-room empty state — atmospheric navy panel with the
            // Locker Room crest in place of an icon. Matches /locker-room.
            <div
              className="relative overflow-hidden rounded-2xl border border-[#c8a84b]/35 bg-gradient-to-br from-[#0a1628] to-[#15233f] text-white px-8 py-14 text-center"
              style={{
                boxShadow:
                  '0 1px 3px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.18)',
              }}
            >
              <div className="relative flex flex-col items-center">
                {lockerCrest ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lockerCrest}
                    alt="Locker Room crest"
                    className="h-28 sm:h-32 w-auto mb-6"
                    style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
                  />
                ) : (
                  <Lock className="w-7 h-7 text-[#c8a84b] mb-5" />
                )}
                <p
                  className="text-[#c8a84b] text-2xl font-medium mb-3"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {lockerEmptyHeadline}
                </p>
                <p className="text-white/65 text-[13.5px] max-w-md mx-auto mb-7 leading-relaxed whitespace-pre-line">
                  {lockerEmptyBlurb}
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
            <div
              className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-10 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <Camera className="w-7 h-7 text-[#c8a84b] mx-auto mb-4" />
              <p
                className="text-[#0a1628] text-lg font-medium mb-2"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {emptyHeadline}
              </p>
              <p className="text-[13px] text-[#8a7f70] max-w-md mx-auto mb-6 whitespace-pre-line">
                {emptyBlurb}
              </p>
              <Link
                href="/moments/new"
                className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                Post the first
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {moments.map((m) => (
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
                showLockerPill={isLockerView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
