'use client'

import Link from 'next/link'
import { Lock, type LucideIcon } from 'lucide-react'

interface Props {
  /** Section icon shown next to the title (matches the approved-state header). */
  icon: LucideIcon
  /** Section title shown in the eyebrow row, e.g. "Latest Moments". */
  title: string
  /** Aggregate count surfaced inside the tease (no names, no specifics). */
  count: number
  /** Label after the count, e.g. "moments shared this month". */
  countLabel: string
  /** One-sentence value prop describing what members see. */
  valueProp: string
  /** Optional override; defaults to /account/setup (which routes signed-out users to /login). */
  ctaHref?: string
  /** Optional override; defaults to "Claim to see". */
  ctaLabel?: string
  /** Optional eyebrow color (matches the approved-state header color). */
  iconColor?: string
}

/**
 * Shared tease card for non-approved viewers. Used by ClubhouseActivityFeed,
 * ThisWeekPanel, OnTheLoopStrip. Shows that a feature exists (count + value
 * prop) without leaking any member-generated specifics.
 */
export default function MemberOnlyTease({
  icon: Icon,
  title,
  count,
  countLabel,
  valueProp,
  ctaHref = '/account/setup',
  ctaLabel = 'Claim to see',
  iconColor = '#c8a84b',
}: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
          {title}
        </p>
      </div>
      <div
        className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <div className="flex items-start gap-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0a1628] text-white flex-shrink-0 mt-0.5"
            aria-hidden
          >
            <Lock className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[#0a1628] text-[14px] font-medium leading-snug">
              <span className="text-[#c8a84b]">{count}</span>{' '}
              {countLabel}
            </p>
            <p className="text-[12.5px] text-[#8a7f70] mt-0.5">{valueProp}</p>
          </div>
        </div>
        <Link
          href={ctaHref}
          className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
