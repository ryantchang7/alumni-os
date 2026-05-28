/**
 * Locker Room — standalone page for the audience: 'locker-room' feed.
 * Mirrors the /moments?view=locker-room tab; both surfaces exist so
 * direct links to /locker-room keep working. Coach + family + signed-out
 * viewers get a GatedPreview.
 */

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { auth } from '@/auth'
import {
  getAccountById,
  getMomentsForTeam,
  getTeamBySlug,
  readStore,
} from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'
import { getBadgesForAccount, type BadgeId } from '@/lib/badges'
import GatedPreview from '@/components/GatedPreview'
import { getSiteContentOrDefault } from '@/lib/site-content/read'
import LockerRoomHero from './LockerRoomHero'
import MomentCard from '@/components/moments/MomentCard'

const TEAM_SLUG = 'penn-mens-golf'

export default async function LockerRoomPage() {
  const session = await auth()
  const team = await getTeamBySlug(TEAM_SLUG)
  const crestImage = await getSiteContentOrDefault('locker-room.crest-image')

  const signedIn = !!session?.accountId
  let canSee = false
  let store: Awaited<ReturnType<typeof readStore>> | null = null
  if (signedIn && team) {
    const account = await getAccountById(session!.accountId!)
    store = await readStore()
    canSee = canSeeLockerRoomForAccount(account, store, team.id)
  }

  if (!signedIn || !canSee) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <LockerRoomHero crestImage={crestImage} showPostCta={false} />
        <GatedPreview
          signedIn={signedIn}
          eyebrow="Players &amp; alumni only · Locker Room"
          headline="This one stays between us."
          blurb="The Locker Room is for current players and alumni — coaches and family are intentionally not in here. Sign in with your Penn email and claim your card to see what&rsquo;s on the wall."
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

  function badgesForPoster(accountId: string): BadgeId[] {
    if (!store) return []
    const account = store.accounts.find(a => a.id === accountId)
    return account ? getBadgesForAccount(account) : []
  }

  const allComments = store?.momentComments.filter(c => c.status === 'published') ?? []
  const allReactions = store?.momentReactions ?? []
  const viewerAccountId = session?.accountId ?? null
  const canPost = !!session?.linkedPersonId

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
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
            <div className="relative">
              <span
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0a1628] border border-[#c8a84b]/60 mb-5"
                style={{ boxShadow: '0 0 0 8px rgba(200,168,75,0.08), 0 0 28px rgba(200,168,75,0.20)' }}
              >
                <Lock className="w-6 h-6 text-[#c8a84b]" />
              </span>
              <p
                className="text-[#c8a84b] text-2xl font-medium mb-3"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Locker&rsquo;s empty.
              </p>
              <p className="text-white/65 text-[13.5px] max-w-md mx-auto mb-7 leading-relaxed">
                Drop the first Locker Room post — a road trip dinner, a
                pre-round shot, the Penn-Princeton afterparty. Players + alumni
                see it. No one else.
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
