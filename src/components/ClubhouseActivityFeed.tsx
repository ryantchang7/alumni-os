'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Camera, ArrowUpRight, UserPlus, Calendar } from 'lucide-react'
import MemberOnlyTease from './MemberOnlyTease'

interface RecentClaim {
  name: string | null
  personId: string | null
  bookId: string | null
  createdAt: string
}
interface UpcomingGathering {
  id: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  dateText: string
  city?: string
  state?: string
  interestedCount: number
}
interface RecentMoment {
  id: string
  photoUrl: string
  mediaType?: 'image' | 'video'
  caption: string
  postedByName: string
  postedByBookId: string | null
  createdAt: string
}
interface NewsItem {
  id: string
  title: string
  sourceUrl: string
  publishedAt?: string
}
interface ActivityResponse {
  recentClaims: RecentClaim[]
  upcoming: UpcomingGathering[]
  recentMoments?: RecentMoment[]
  newsItems?: NewsItem[]
  totals: {
    membersClaimed?: number
    openGatherings?: number
    upcomingRsvps?: number
    publishedMoments?: number
  }
}

const GATHERING_HREF: Record<UpcomingGathering['type'], string> = {
  round: '/the-course',
  coffee: '/19th-hole',
  drinks: '/19th-hole',
  dinner: '/19th-hole',
  event: '/19th-hole',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

interface ClubhouseActivityFeedProps {
  /** True if the viewer is signed in + captain-approved. Non-approved viewers
   * see teased counts in place of Latest Moments / Recently Joined / Upcoming
   * Gatherings. The Pulse and From the Box stay visible to everyone. */
  approved: boolean
}

export default function ClubhouseActivityFeed({ approved }: ClubhouseActivityFeedProps) {
  const [data, setData] = useState<ActivityResponse | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/clubhouse/activity')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) return null
  if (!data) return null

  const hasClaims = data.recentClaims.length > 0
  const hasUpcoming = data.upcoming.length > 0
  const hasMoments = (data.recentMoments?.length ?? 0) > 0
  const hasNews = (data.newsItems?.length ?? 0) > 0
  if (!hasClaims && !hasUpcoming && !hasMoments && !hasNews) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
      className="pb-8"
      data-testid="clubhouse-activity-feed"
    >
      <div className="flex items-baseline gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#990000]" />
        <h2 className="text-base font-semibold text-[#0a1628]">In the Clubhouse</h2>
      </div>

      {hasMoments && (
        approved ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-5 mb-4"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#c8a84b]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Latest Moments
                </p>
              </div>
              <Link
                href="/moments"
                className="text-[11.5px] font-medium text-[#990000] hover:underline"
              >
                See the wall &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.recentMoments?.map((m) => (
                <Link
                  key={m.id}
                  href="/moments"
                  className="group block"
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#fdfcf9] border border-[rgba(180,168,150,0.35)]">
                    {m.mediaType === 'video' ? (
                      <video
                        src={m.photoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photoUrl}
                        alt={m.caption}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    )}
                  </div>
                  <p className="text-[12px] text-[#3d4a5c] mt-1.5 line-clamp-2 leading-snug">
                    {m.caption}
                  </p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    <span className="font-heading">{m.postedByName}</span>
                    <span className="mx-1.5">·</span>
                    {timeAgo(m.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <MemberOnlyTease
              icon={Camera}
              title="Latest Moments"
              count={data.totals.publishedMoments ?? data.recentMoments?.length ?? 0}
              countLabel={
                (data.totals.publishedMoments ?? data.recentMoments?.length ?? 0) === 1
                  ? 'moment on the wall'
                  : 'moments on the wall'
              }
              valueProp="Members see the photos, captions, and who posted them."
            />
          </div>
        )
      )}

      {/* Non-approved: stack the two member-only teases above the public grid. */}
      {!approved && hasClaims && (
        <div className="mb-4">
          <MemberOnlyTease
            icon={UserPlus}
            title="Recently Joined"
            count={data.recentClaims.length}
            countLabel={
              data.recentClaims.length === 1
                ? 'member just claimed their card'
                : 'members just claimed their cards'
            }
            valueProp="Members see who just joined."
          />
        </div>
      )}
      {!approved && hasUpcoming && (
        <div className="mb-4">
          <MemberOnlyTease
            icon={Calendar}
            title="Upcoming Gatherings"
            count={data.upcoming.length}
            countLabel={
              data.upcoming.length === 1
                ? 'gathering on the books'
                : 'gatherings on the books'
            }
            valueProp="Members see hosts, cities, and can RSVP."
          />
        </div>
      )}

      {/* Public grid: From the Box + The Pulse always; Recently Joined +
          Upcoming Gatherings only when approved. */}
      <div
        className={`bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-5 grid grid-cols-1 md:grid-cols-2 ${
          approved
            ? hasNews
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-3'
            : hasNews
              ? 'lg:grid-cols-2'
              : 'lg:grid-cols-1'
        } gap-6`}
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        {/* From the box — latest Penn Athletics news (public) */}
        {hasNews && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#990000] mb-2.5">
              From the Box
            </p>
            <ul className="space-y-2">
              {data.newsItems!.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <p
                      className="text-[13px] text-[#0a1628] group-hover:text-[#990000] leading-snug transition-colors line-clamp-3 font-heading"
                    >
                      {n.title}
                      <ArrowUpRight className="inline w-3 h-3 ml-1 opacity-60 align-middle" />
                    </p>
                    {n.publishedAt && (
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {timeAgo(n.publishedAt)} · Penn Athletics
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recently joined — approved only */}
        {approved && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2.5">
              Recently Joined
            </p>
            {hasClaims ? (
              <ul className="space-y-1.5">
                {data.recentClaims.map((c, i) => (
                  <li key={`${c.personId}-${i}`} className="text-[13px] leading-snug">
                    <Link
                      href={c.bookId ? `/member-book/${encodeURIComponent(c.bookId)}` : '/member-book'}
                      className="text-[#0a1628] hover:underline font-heading"
                    >
                      {c.name ?? 'A new member'}
                    </Link>
                    <span className="text-ink-muted text-[12px] ml-2">{timeAgo(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-ink-muted italic">
                Be one of the first to claim a card &mdash;{' '}
                <Link href="/login?next=/account/setup" className="text-[#990000] hover:underline">
                  sign in
                </Link>
                .
              </p>
            )}
          </div>
        )}

        {/* Upcoming gatherings — approved only */}
        {approved && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2.5">
              Upcoming Gatherings
            </p>
            {hasUpcoming ? (
              <ul className="space-y-2">
                {data.upcoming.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={GATHERING_HREF[g.type]}
                      className="block group"
                    >
                      <p className="text-[13px] text-[#0a1628] group-hover:underline leading-snug">
                        {g.title}
                      </p>
                      <p className="text-[12px] text-ink-muted">
                        {g.dateText}
                        {g.city ? ` · ${g.city}${g.state ? `, ${g.state}` : ''}` : ''}
                        {g.interestedCount > 0 ? ` · ${g.interestedCount} interested` : ''}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-ink-muted italic">
                No gatherings scheduled yet. Captains and hosts add them anytime.
              </p>
            )}
          </div>
        )}

        {/* Totals — public, aggregate only */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2.5">
            The Pulse
          </p>
          {(data.totals.publishedMoments ?? 0) > 0 && (
            <p className="text-[13px] text-[#3d4a5c] mb-1.5">
              <span className="text-[#0a1628] font-semibold">{data.totals.publishedMoments}</span>{' '}
              {data.totals.publishedMoments === 1 ? 'moment' : 'moments'} on the wall
            </p>
          )}
          <div className="space-y-1.5 text-[13px] text-[#3d4a5c]">
            {data.totals.membersClaimed !== undefined && (
              <p>
                <span className="text-[#0a1628] font-semibold">{data.totals.membersClaimed}</span>{' '}
                {data.totals.membersClaimed === 1 ? 'member has' : 'members have'} claimed their card
              </p>
            )}
            {(data.totals.openGatherings ?? 0) > 0 && (
              <p>
                <span className="text-[#0a1628] font-semibold">{data.totals.openGatherings}</span>{' '}
                gathering{data.totals.openGatherings === 1 ? '' : 's'} open
              </p>
            )}
            {(data.totals.upcomingRsvps ?? 0) > 0 && (
              <p>
                <span className="text-[#0a1628] font-semibold">{data.totals.upcomingRsvps}</span>{' '}
                interest{data.totals.upcomingRsvps === 1 ? '' : 's'} this season
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
