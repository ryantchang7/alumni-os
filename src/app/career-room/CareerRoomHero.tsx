'use client'

import { useSiteContent } from '@/lib/site-content/use-site-content'
import HeroCrest from '@/components/HeroCrest'

/**
 * Hero for /career-room — a private-library register. Badge on the left,
 * title block on the right. Matches the /player layout pattern.
 */
export default function CareerRoomHero() {
  const crestImage = useSiteContent('career-room.crest-image', '')

  return (
    <div className="relative overflow-hidden bg-[#0a1628]">
      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-16">
        <div className="flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="Career Room crest" />
          {/* Title block */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-3">
              Penn Men&rsquo;s Golf · Advice &amp; Introductions
            </p>
            <h1
              className="text-[#f4ecdb] text-5xl sm:text-7xl font-medium tracking-tight leading-[0.92]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Career Room
            </h1>
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md mt-5">
              Advice, introductions, and career paths from Penn Golf alumni.
              Take the meeting; pay it forward.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
