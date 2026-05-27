'use client'

import { motion } from 'framer-motion'
import { useSiteContent } from '@/lib/site-content/use-site-content'

/**
 * Hero for /19th-hole — clubhouse-bar atmosphere. Badge on the left,
 * title block on the right. Matches the /player layout pattern.
 */
export default function NineteenthHoleHero() {
  const crestImage = useSiteContent('19th-hole.crest-image', '')

  return (
    <div className="relative overflow-hidden bg-[#0a1628]">
      {/* Warm lamp glow over the bar */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          right: '15%',
          width: '900px',
          height: '600px',
          transform: 'translate(50%, -50%)',
          background:
            'radial-gradient(ellipse at center, rgba(212,155,82,0.18) 0%, rgba(212,155,82,0.06) 40%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-16">
        <div className="flex items-center gap-5 sm:gap-7">
          {crestImage && (
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.55 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={crestImage}
                alt="19th Hole crest"
                className="h-32 sm:h-44 lg:h-48 w-auto"
                style={{ filter: 'drop-shadow(0 5px 20px rgba(0,0,0,0.4))' }}
              />
            </motion.div>
          )}
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
            <span className="block w-12 h-[2px] bg-[#d49b52] mt-6 mb-6" />
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md">
              Coffee, dinners, and signature Penn Golf gatherings — wherever
              members find each other.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
