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
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0c1c34] to-[#102137]">
      {/* Warm desk-lamp wash on the right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          right: '15%',
          width: '700px',
          height: '500px',
          transform: 'translate(50%, -50%)',
          background:
            'radial-gradient(ellipse at center, rgba(200,168,75,0.22) 0%, rgba(200,168,75,0.06) 40%, transparent 70%)',
        }}
      />
      {/* Subtle vertical lines like book bindings on a shelf */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        aria-hidden
      >
        <defs>
          <pattern id="shelf" x="0" y="0" width="14" height="20" patternUnits="userSpaceOnUse">
            <line x1="3" y1="0" x2="3" y2="20" stroke="#c8a84b" strokeWidth="0.6" />
            <line x1="9" y1="0" x2="9" y2="20" stroke="#c8a84b" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#shelf)" />
      </svg>

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
            <span className="block w-12 h-[2px] bg-[#c8a84b] mt-6 mb-6" />
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md">
              Advice, introductions, and career paths from Penn Golf alumni.
              Take the meeting; pay it forward.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
