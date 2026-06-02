'use client'

/**
 * The Course hero — compact crest + title + blurb + CTAs band, matching
 * every other tab (19th Hole, Career Room, Locker Room, Team Room) so the
 * page reads as part of the same Clubhouse. The interactive tee-sheet flow
 * was removed: it left a lot of empty space and duplicated the rounds list
 * that already lives in the section below.
 */

import type { GatheringData } from '@/components/gatherings/GatheringCard'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import HeroCrest from '@/components/HeroCrest'

interface Props {
  rounds: GatheringData[]
}

export default function CourseHero({ rounds }: Props) {
  const crestImage = useSiteContent('the-course.crest-image', '')
  const heroBlurb = useSiteContent(
    'the-course.hero-blurb',
    'A place for Penn Golf members to host rounds, join foursomes, share home courses, and stay connected through the game.',
  )
  const ctaPrimary = useSiteContent('the-course.stage-tee-cta', 'Find a Round')
  const ctaSecondary = useSiteContent('the-course.stage-tee-secondary', 'Host a Round')
  const openCount = rounds.length

  return (
    <div className="relative overflow-hidden bg-[#0a1628]">
      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-16">
        <div className="flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="The Course crest" />
          {/* Title block */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4a9d72] mb-3">
              Penn Men&rsquo;s Golf · The Tee Sheet
            </p>
            <h1
              className="text-[#f4ecdb] text-5xl sm:text-7xl font-medium tracking-tight leading-[0.92]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The Course
            </h1>
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md mt-5">
              {heroBlurb}
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href="#rounds-section"
                className="bg-[#2d6a4f] hover:bg-[#3a8060] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                {ctaPrimary}
                {openCount > 0 ? ` · ${openCount}` : ''}
              </a>
              <a
                href="/the-course/host"
                className="bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.06] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                {ctaSecondary}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
