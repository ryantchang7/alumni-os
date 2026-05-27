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
 * Sizing notes: vertical-oval bounding box `w-28 h-40 sm:w-36 sm:h-52
 * lg:w-40 lg:h-56` with `object-contain`. Box aspect ~1:1.4 to match the
 * Penn Golf badge family (oval crests). All badges share this footprint
 * regardless of native aspect ratio.
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
        className="w-28 h-40 sm:w-36 sm:h-52 lg:w-40 lg:h-56 object-contain"
        style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.28))' }}
      />
    </motion.div>
  )
}
