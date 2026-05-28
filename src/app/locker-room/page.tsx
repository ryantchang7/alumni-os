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
import HeroCrest from '@/components/HeroCrest'
import GatedPreview from '@/components/GatedPreview'
import { getSiteContentOrDefault } from '@/lib/site-content/read'

const TEAM_SLUG = 'penn-mens-golf'

// Inline radial-gold glow behind the hero icon. Kept as a constant so the
// gradient is shared between the gated and full views (so the hero feels
// the same in both states).
const HERO_GLOW: React.CSSProperties = {
  background:
    'radial-gradient(ellipse at 18% 35%, rgba(200,168,75,0.18), transparent 55%)',
}

// Faint Tudor-stripe pattern — gives the navy header a leather-bound,
// locker-feeling texture without an image asset.
const HERO_PATTERN: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, rgba(200,168,75,0.04) 0%, transparent 40%), repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 9px)',
}

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

function HeroHeader({ crestImage }: { crestImage: string }) {
  return (
    <div className="relative bg-[#0a1628] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={HERO_GLOW} />
      <div className="absolute inset-0 pointer-events-none" style={HERO_PATTERN} />
      <div className="relative max-w-[1100px] mx-auto px-6 sm:px-8 pt-14 pb-16 flex items-center gap-6 sm:gap-10">
        {crestImage ? (
          <HeroCrest src={crestImage} alt="Locker Room crest" />
        ) : null}
        {/* Vertical brand stripe — keeps everything left-aligned with a Penn
            gold accent rail. */}
        <div className="border-l-2 border-[#c8a84b]/55 pl-5 sm:pl-6 flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 mb-5 px-2.5 py-1 rounded-full bg-[#c8a84b]/12 border border-[#c8a84b]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a84b]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
              Players &amp; Alumni · Locker Room
            </span>
          </div>
          <div className="flex items-center gap-4">
            {!crestImage ? (
              <span
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0a1628] border border-[#c8a84b]/55"
                style={{ boxShadow: '0 0 0 6px rgba(200,168,75,0.08), 0 0 26px rgba(200,168,75,0.15)' }}
              >
                <Lock className="w-5 h-5 text-[#c8a84b]" />
              </span>
            ) : null}
            <h1
              className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Locker Room
            </h1>
          </div>
          <span className="block w-14 h-[2px] bg-[#c8a84b] mt-6 mb-5" />
          <p className="text-white/60 text-[15px] sm:text-base max-w-xl leading-relaxed">
            Players and alumni only. Coaches and family don&rsquo;t see what
            goes up here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function LockerRoomPage() {
  const session = await auth()
  const team = await getTeamBySlug(TEAM_SLUG)
  const crestImage = await getSiteContentOrDefault('locker-room.crest-image')

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
        <HeroHeader crestImage={crestImage} />
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
      <HeroHeader crestImage={crestImage} />

      {/* Reassurance rail — a single gold-on-navy strip running across the
          page, anchoring the "stays here" promise visually. */}
      <div className="bg-[#0a1628] border-t border-b border-[#c8a84b]/25">
        <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8a84b]/90">
            What goes up here, stays here.
          </p>
          <Link
            href="/moments/new"
            className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[11.5px] font-semibold uppercase tracking-[0.16em] px-4 py-2 rounded-md transition-all hover:shadow-[0_0_18px_rgba(200,168,75,0.35)]"
          >
            <Lock className="w-3.5 h-3.5" />
            Post
          </Link>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {moments.length === 0 ? (
          // Atmospheric empty state — dark panel with gold lock, warmer
          // language, no dashed-border default look.
          <div
            className="relative overflow-hidden rounded-2xl border border-[#c8a84b]/35 bg-gradient-to-br from-[#0a1628] to-[#15233f] text-white px-8 py-14 text-center"
            style={{
              boxShadow:
                '0 1px 3px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.18)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={HERO_GLOW} />
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
                href="/moments/new"
                className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_22px_rgba(200,168,75,0.45)]"
              >
                <Lock className="w-4 h-4" />
                Post the first
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {moments.map(m => {
              const bookId = bookIdForPerson(m.postedByPersonId)
              const posterBadges = badgesForPoster(m.postedByAccountId)
              return (
                <article
                  key={m.id}
                  className="group relative bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden transition-all hover:border-[#c8a84b]/55 hover:-translate-y-0.5"
                  style={{
                    boxShadow:
                      '0 1px 3px rgba(10,22,40,0.05), 0 12px 30px rgba(10,22,40,0.07)',
                  }}
                >
                  <div className="relative bg-[#0a1628]">
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
                    {/* Locker Room corner pill — anchors the card visually to
                        this surface so it never feels like a stray /moments post. */}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[#0a1628]/90 backdrop-blur-sm text-[#c8a84b] text-[9.5px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-[#c8a84b]/55">
                      <Lock className="w-2.5 h-2.5" />
                      Locker Room
                    </span>
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

        {/* Footer reassurance — quiet but final. */}
        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-[#b0a898]">
          Players + alumni only. No coaches, no family, no screenshots.
        </p>
      </div>
    </div>
  )
}
