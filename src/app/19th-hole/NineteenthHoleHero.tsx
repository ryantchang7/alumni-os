'use client'

import { useSiteContent } from '@/lib/site-content/use-site-content'
import HeroCrest from '@/components/HeroCrest'

/**
 * Hero for /19th-hole — clubhouse-bar atmosphere. Badge on the left,
 * title block on the right. Matches the /player layout pattern.
 */
export default function NineteenthHoleHero() {
  const crestImage = useSiteContent('19th-hole.crest-image', '')

  return (
    <div className="relative overflow-hidden bg-[#0a1628]">
      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-16">
        <div className="flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="19th Hole crest" />
          {/* Title block */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d49b52]/80 mb-3">
              Penn Men&rsquo;s Golf · After the Round
            </p>
            <h1
              className="text-[#f4ecdb] text-5xl sm:text-7xl font-medium tracking-tight leading-[0.92]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The 19th Hole
            </h1>
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md mt-5">
              Coffee, dinners, and signature Penn Golf gatherings — wherever
              members find each other.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
