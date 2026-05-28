'use client'

/**
 * Locker Room hero — animated entrance. Chip rises, then title, then the
 * gold underline draws in left-to-right, then the subline rises. Total
 * < 0.8s; fires once on mount. Kept Locker-Room-only on purpose so this
 * surface reads as the special-within-the-special; if we ever want parity
 * across tabs, lift this pattern into a shared component.
 */

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import HeroCrest from '@/components/HeroCrest'

// Faint diagonal leather-stripe texture — gives the navy header a
// locker-feeling depth without an image asset.
const HERO_PATTERN: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, rgba(200,168,75,0.04) 0%, transparent 40%), repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 9px)',
}

interface Props {
  /** Resolved crest URL (already passed through getSiteContentOrDefault). */
  crestImage: string
}

export default function LockerRoomHero({ crestImage }: Props) {
  return (
    <div className="relative bg-[#0a1628] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={HERO_PATTERN} />
      <div className="relative max-w-[1100px] mx-auto px-6 sm:px-8 pt-14 pb-16 flex items-center gap-6 sm:gap-10">
        {crestImage ? (
          <HeroCrest src={crestImage} alt="Locker Room crest" />
        ) : null}
        <div className="border-l-2 border-[#c8a84b]/55 pl-5 sm:pl-6 flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 mb-5 px-2.5 py-1 rounded-full bg-[#c8a84b]/12 border border-[#c8a84b]/40"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a84b]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
              Players &amp; Alumni Only
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
            className="flex items-center gap-4"
          >
            {!crestImage ? (
              <span
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0a1628] border border-[#c8a84b]/55"
                style={{ boxShadow: '0 0 0 6px rgba(200,168,75,0.08), 0 0 26px rgba(200,168,75,0.15)' }}
              >
                <Lock className="w-5 h-5 text-[#c8a84b]" />
              </span>
            ) : null}
            <h1
              className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Locker Room
            </h1>
          </motion.div>

          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.28 }}
            className="block w-14 h-[2px] bg-[#c8a84b] mt-6 mb-5 origin-left"
          />

          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.4 }}
            className="text-white/60 text-[15px] sm:text-base max-w-xl leading-relaxed"
          >
            Players and alumni only.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
