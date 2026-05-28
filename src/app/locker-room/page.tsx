/**
 * Locker Room — Moments + content visible only to current players and
 * alumni. Coach and family are gated out at the page level. Posts here
 * carry `audience: 'locker-room'`; create them from /moments/new with
 * the "Locker Room only" toggle on.
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
import MemberBadges from '@/components/MemberBadges'
import GatedPreview from '@/components/GatedPreview'

const TEAM_SLUG = 'penn-mens-golf'

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default async function LockerRoomPage() {
  const session = await auth()
  const team = await getTeamBySlug(TEAM_SLUG)

  // Gate before doing any work.
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
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
          <div className="max-w-[820px] mx-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
              Penn Men&rsquo;s Golf · Locker Room
            </p>
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-7 h-7 text-[#c8a84b]" />
              <h1
                className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Locker Room
              </h1>
            </div>
            <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5" />
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[820px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
            Penn Men&rsquo;s Golf · Locker Room
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-7 h-7 text-[#c8a84b]" />
            <h1
              className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Locker Room
            </h1>
          </div>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5 mb-5" />
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed">
            Players and alumni only. Coaches and family don&rsquo;t see what
            goes up here.
          </p>
          <div className="mt-7">
            <Link
              href="/moments/new"
              className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
              Post to the Locker Room
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {moments.length === 0 ? (
          <div
            className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
          >
            <Lock className="w-7 h-7 text-[#c8a84b] mx-auto mb-4" />
            <p
              className="text-[#0a1628] text-lg font-medium mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Empty for now.
            </p>
            <p className="text-[13px] text-[#8a7f70] max-w-md mx-auto mb-6">
              Drop the first Locker Room post — a road trip dinner, a
              pre-tournament shot, a Penn-Princeton afterparty. Only
              players + alumni see it.
            </p>
            <Link
              href="/moments/new"
              className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Post the first
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {moments.map(m => {
              const bookId = bookIdForPerson(m.postedByPersonId)
              const posterBadges = badgesForPoster(m.postedByAccountId)
              return (
                <article
                  key={m.id}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
                  style={{
                    boxShadow:
                      '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
                  }}
                >
                  <div className="relative bg-[#faf7f2]">
                    {m.mediaType === 'video' ? (
                      <video
                        src={m.photoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-[640px] object-contain bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photoUrl}
                        alt={m.caption}
                        className="w-full max-h-[640px] object-cover"
                      />
                    )}
                  </div>
                  <div className="px-6 sm:px-8 py-5">
                    <p className="text-[14.5px] text-[#0a1628] leading-relaxed whitespace-pre-wrap">
                      {m.caption}
                    </p>
                    <div className="mt-4 flex items-baseline justify-between gap-3 text-[12px]">
                      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                        <p className="text-[#8a7f70]">
                          <span className="text-[#8a7f70]">Posted by </span>
                          {bookId ? (
                            <Link
                              href={`/member-book/${encodeURIComponent(bookId)}`}
                              className="text-[#0a1628] hover:underline font-medium"
                              style={{ fontFamily: 'var(--font-playfair)' }}
                            >
                              {m.postedByName}
                            </Link>
                          ) : (
                            <span
                              className="text-[#0a1628] font-medium"
                              style={{ fontFamily: 'var(--font-playfair)' }}
                            >
                              {m.postedByName}
                            </span>
                          )}
                        </p>
                        <MemberBadges badges={posterBadges} size="sm" />
                      </div>
                      <span className="text-[#b0a898]">{timeAgo(m.createdAt)}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
