'use client'

import { motion } from 'framer-motion'

interface Props {
  /** Resolved image URL. Empty string → component renders nothing. */
  src: string
  /** Accessible alt text. Defaults to "Crest". */
  alt?: string
  /** Stagger delay (seconds) for the fade-in-and-scale-up animation. */
  delay?: number
}

/**
 * Single source of truth for the badge/crest that sits next to each
 * hero heading across the site. Same size, same animation, same drop
 * shadow everywhere — change here, it propagates.
 *
 * Sizing notes: `h-20 sm:h-28 lg:h-32 w-auto` (80 / 112 / 128px tall).
 * This is the user-approved size from the /player iteration. The badge
 * scales by height; aspect ratio is honored by `w-auto`.
 *
 * If a specific badge looks "off" after a future upload, crop the
 * source PNG tighter to the artwork rather than reaching for CSS.
 */
export default function HeroCrest({ src, alt = 'Crest', delay = 0.15 }: Props) {
  if (!src) return null
  return (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.55 }}
    >
      {/* Fixed bounding box + object-contain so badges with different
          native aspect ratios all occupy the same visual footprint.
          A specific badge with lots of internal padding may look small
          INSIDE the box — fix that by cropping the source PNG tighter
          and re-uploading. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 object-contain"
        style={{ filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.22))' }}
      />
    </motion.div>
  )
}
