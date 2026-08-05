'use client'

/**
 * Your Era — the guys whose roster years overlapped yours: who's here
 * (one-tap hello via chat) and who's missing (one-tap invite). Renders
 * on /player for approved members; disappears silently when the viewer
 * has no roster years or no overlapping teammates.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import RespondButton from './RespondButton'

interface EraTeammate {
  personId: string
  name: string
  photoUrl: string | null
  classLabel: string | null
  overlapStart: number
  overlapEnd: number
  claimed: boolean
  accountId: string | null
  bookId: string | null
}

interface EraResponse {
  eraLabel: string | null
  hereCount: number
  teammates: EraTeammate[]
}

const SHOW_MAX = 8

function overlapText(t: EraTeammate): string {
  return t.overlapStart === t.overlapEnd
    ? `Played together in ${t.overlapStart}`
    : `Played together ${t.overlapStart}–${String(t.overlapEnd).slice(2)}`
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name
}

export default function YourEraSection({ approved }: { approved: boolean }) {
  const [data, setData] = useState<EraResponse | null>(null)

  useEffect(() => {
    if (!approved) return
    fetch('/api/player/your-era')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setData(d))
      .catch(() => setData(null))
  }, [approved])

  if (!approved || !data || data.teammates.length === 0) return null

  const shown = data.teammates.slice(0, SHOW_MAX)
  const missingCount = data.teammates.length - data.hereCount

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="pb-8"
      data-testid="your-era-section"
    >
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <Users className="w-4 h-4 text-[#c8a84b] self-center" />
        <h2 className="text-base font-semibold text-[#0a1628]">Your Era</h2>
        {data.eraLabel && (
          <p className="text-[12px] text-ink-muted italic ml-1">
           The guys you played with, {data.eraLabel}
          </p>
        )}
      </div>
      <p className="text-[12.5px] text-[#3d4a5c] mb-3">
        {data.hereCount > 0 ? (
          <>
            <span className="font-semibold text-[#0a1628]">{data.hereCount}</span>{' '}
            {data.hereCount === 1 ? 'is' : 'are'} in the Clubhouse
            {missingCount > 0 && (
              <>
                {' '}&middot; {missingCount} {missingCount === 1 ? 'is' : 'are'} still missing. {' '}
                <Link href="/invite" className="text-[#990000] hover:underline font-medium">
                  pull them in
                </Link>
              </>
            )}
            .
          </>
        ) : (
          <>
            None of them are in yet. {' '}
            <Link href="/invite" className="text-[#990000] hover:underline font-medium">
              be the one who pulls them in
            </Link>
            .
          </>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map(t => (
          <div
            key={t.personId}
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-4 py-3.5 flex flex-col"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <MemberAvatar photoUrl={t.photoUrl} name={t.name} size={40} />
              <div className="min-w-0">
                <Link
                  href={
                    t.bookId
                      ? `/member-book/${encodeURIComponent(t.bookId)}`
                      : `/player/alumni/${encodeURIComponent(t.personId)}?teamSlug=penn-mens-golf`
                  }
                  className="block text-[#0a1628] text-[14.5px] leading-snug truncate hover:underline font-heading"
                >
                  {t.name}
                </Link>
                <p className="text-[11px] text-ink-muted truncate">
                  {overlapText(t)}
                  {t.classLabel ? ` · ${t.classLabel}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-2">
              {t.claimed && t.accountId ? (
                <RespondButton
                  targetAccountId={t.accountId}
                  label="Say hello"
                  kickoff={`Hey ${firstName(t.name)}, saw you in the Clubhouse, been a while. `}
                  bgColor="#0a1628"
                  className="w-full"
                />
              ) : (
                <Link
                  href="/invite"
                  className="inline-flex w-full items-center justify-center text-[11.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-2 rounded-lg border border-[#0a1628]/25 text-[#3d4a5c] hover:bg-[#0a1628] hover:text-white transition-colors"
                >
                  Not in yet, invite him
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.teammates.length > SHOW_MAX && (
        <p className="text-[11.5px] text-ink-muted mt-2.5">
          + {data.teammates.length - SHOW_MAX} more from your era in the{' '}
          <Link href="/member-book" className="text-[#990000] hover:underline">
            Member Book
          </Link>
          .
        </p>
      )}
    </motion.section>
  )
}
