'use client'

/**
 * Locker Room hero — matches the visual pattern used by /moments and
 * /member-book: eyebrow + crest + Playfair title, on navy. No chip pill,
 * no vertical stripe, no gold underline, no subline. Animation is a
 * quiet two-step fade (eyebrow → title) so the surface still gets a
 * little entrance moment without standing out from the other tabs.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import HeroCrest from '@/components/HeroCrest'

interface Props {
  /** Resolved crest URL (already passed through getSiteContentOrDefault). */
  crestImage: string
  /** When true, render the gold "Post to the Locker Room" CTA inside the
   *  hero. The signed-out / non-eligible view hides it. */
  showPostCta?: boolean
}

export default function LockerRoomHero({ crestImage, showPostCta }: Props) {
  return (
    <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14 relative overflow-hidden">
      <div className="max-w-[820px] mx-auto relative flex items-center gap-5 sm:gap-7">
        <HeroCrest src={crestImage} alt="Locker Room crest" />
        <div className="min-w-0 flex-1">
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4"
          >
            Penn Men&rsquo;s Golf · Locker Room
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
            className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight font-heading"
          >
            Locker Room
          </motion.h1>
          {showPostCta ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.32 }}
              className="mt-6"
            >
              <Link
                href="/moments/new?audience=locker-room"
                className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                Post to the Locker Room
              </Link>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
