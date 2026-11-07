'use client'

/**
 * Who has claimed a card lately, on the Member Book.
 *
 * The book is a list of 404 people, 18 of whom have actually arrived. A
 * browsing alum has no way to tell the difference, so the page reads like an
 * archive rather than somewhere anyone is. This is the one strip that says
 * people are still turning up.
 *
 * `/api/clubhouse/activity` returns names to approved members and scrubs them
 * to nulls for everyone else. Rather than render a row of blanks, the
 * unapproved version falls back to the count, which is the part of the signal
 * that is nobody's business to hide.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MemberAvatar from '@/components/MemberAvatar'

interface RecentClaim {
  name: string | null
  bookId: string | null
  createdAt: string
}

/**
 * The list is capped by the API, so its length is a ceiling, not a count.
 * The honest total rides along in `totals.recentClaimsCount`.
 */
interface ActivityResponse {
  recentClaims?: unknown
  totals?: { recentClaimsCount?: number }
}

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86400000)
  if (Number.isNaN(d)) return ''
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 14) return 'last week'
  return `${Math.floor(d / 7)} weeks ago`
}

export default function RecentlyJoined({
  photosByBookId = {},
}: {
  photosByBookId?: Record<string, string>
}) {
  const [claims, setClaims] = useState<RecentClaim[] | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/clubhouse/activity', { cache: 'no-store' })
      .then(r => (r.ok ? (r.json() as Promise<ActivityResponse>) : null))
      .then(d => {
        setClaims(Array.isArray(d?.recentClaims) ? (d.recentClaims as RecentClaim[]) : [])
        setTotal(d?.totals?.recentClaimsCount ?? 0)
      })
      .catch(() => setClaims([]))
  }, [])

  if (!claims || claims.length === 0) return null

  const named = claims.filter((c): c is RecentClaim & { name: string } => !!c.name)
  // Never fewer than the rows in hand, in case an older API answers.
  const count = Math.max(total, claims.length)

  return (
    <section className="mb-8" data-testid="recently-joined">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 className="text-[#0a1628] text-base font-medium font-heading">
          Just joined
        </h2>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Last 30 days
        </span>
      </div>

      {named.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {named.map(c => {
            const card = (
              <>
                <MemberAvatar
                  photoUrl={c.bookId ? photosByBookId[c.bookId] : undefined}
                  name={c.name}
                  size={40}
                  tone="navy"
                />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-[#0a1628] truncate font-heading">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-ink-muted">{daysAgo(c.createdAt)}</p>
                </div>
              </>
            )
            const cls =
              'flex-shrink-0 flex items-center gap-2.5 bg-white border border-[rgba(180,168,150,0.4)] rounded-xl pl-2.5 pr-4 py-2.5 min-w-[172px]'
            return c.bookId ? (
              <Link
                key={`${c.name}-${c.createdAt}`}
                href={`/member-book/${encodeURIComponent(c.bookId)}`}
                className={`${cls} hover:border-[#0a1628]/30 transition-colors`}
              >
                {card}
              </Link>
            ) : (
              <div key={`${c.name}-${c.createdAt}`} className={cls}>
                {card}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-[#3d4a5c]">
            <span className="font-semibold text-[#0a1628]">{count}</span>{' '}
            {count === 1 ? 'member has' : 'members have'} claimed a card in
            the last 30 days. Names are members only.
          </p>
          <Link
            href="/login?next=/account/setup"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
          >
            Claim yours &rarr;
          </Link>
        </div>
      )}
    </section>
  )
}
