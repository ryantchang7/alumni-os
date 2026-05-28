'use client'

/**
 * The Course hero. Clean static design that matches the other tabs
 * (Member Book, Moments, Locker Room): navy bg + eyebrow + crest + Playfair
 * title + short subline + two CTAs. The earlier multi-stage interactive
 * flow (tee marker → tee sheet → hole green) was decommissioned in favor
 * of design consistency across the site.
 *
 * `rounds` is intentionally kept on the props so callers don't need to
 * change. It's unused here — a small wart, kept so removing the field
 * doesn't ripple. If we never re-add the preview, drop the prop later.
 */

import { useSiteContent } from '@/lib/site-content/use-site-content'
import HeroCrest from '@/components/HeroCrest'
import type { GatheringData } from '@/components/gatherings/GatheringCard'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rounds: GatheringData[]
}

export default function CourseHero(_props: Props) {
  const crestImage = useSiteContent('the-course.crest-image', '')

  return (
    <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
      <div className="max-w-[820px] mx-auto flex items-center gap-5 sm:gap-7">
        <HeroCrest src={crestImage} alt="The Course crest" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4a9d72] mb-4">
            Penn Men&rsquo;s Golf · The Tee Sheet
          </p>
          <h1
            className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Course
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            Tee times, foursomes, and home courses across the Penn Golf
            network. Every round here is hosted by a member.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#rounds-section"
              className="inline-flex items-center gap-2 bg-[#2d6a4f] hover:bg-[#3a8060] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Find a Round
            </a>
            <a
              href="/the-course/host"
              className="inline-flex items-center gap-2 bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.08] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Host a Round
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
