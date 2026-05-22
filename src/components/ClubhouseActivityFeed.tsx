'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Camera } from 'lucide-react'

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
  caption: string
  postedByName: string
  postedByBookId: string | null
  createdAt: string
}
interface ActivityResponse {
  recentClaims: RecentClaim[]
  upcoming: UpcomingGathering[]
  recentMoments?: RecentMoment[]
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

export default function ClubhouseActivityFeed() {
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
  if (!hasClaims && !hasUpcoming && !hasMoments) return null

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
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-5 mb-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#c8a84b]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
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
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#faf7f2] border border-[rgba(180,168,150,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photoUrl}
                    alt={m.caption}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <p className="text-[12px] text-[#3d4a5c] mt-1.5 line-clamp-2 leading-snug">
                  {m.caption}
                </p>
                <p className="text-[11px] text-[#8a7f70] mt-0.5">
                  <span style={{ fontFamily: 'var(--font-playfair)' }}>{m.postedByName}</span>
                  <span className="mx-1.5">·</span>
                  {timeAgo(m.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        {/* Recently joined */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2.5">
            Recently Joined
          </p>
          {hasClaims ? (
            <ul className="space-y-1.5">
              {data.recentClaims.map((c, i) => (
                <li key={`${c.personId}-${i}`} className="text-[13px] leading-snug">
                  <Link
                    href={c.bookId ? `/member-book/${encodeURIComponent(c.bookId)}` : '/member-book'}
                    className="text-[#0a1628] hover:underline"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {c.name ?? 'A new member'}
                  </Link>
                  <span className="text-[#8a7f70] text-[12px] ml-2">{timeAgo(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-[#8a7f70] italic">
              Be one of the first to claim a card &mdash;{' '}
              <Link href="/login?next=/account/setup" className="text-[#990000] hover:underline">
                sign in
              </Link>
              .
            </p>
          )}
        </div>

        {/* Upcoming gatherings */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2.5">
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
                    <p className="text-[12px] text-[#8a7f70]">
                      {g.dateText}
                      {g.city ? ` · ${g.city}${g.state ? `, ${g.state}` : ''}` : ''}
                      {g.interestedCount > 0 ? ` · ${g.interestedCount} interested` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-[#8a7f70] italic">
              No gatherings scheduled yet. Captains and hosts add them anytime.
            </p>
          )}
        </div>

        {/* Totals */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2.5">
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
