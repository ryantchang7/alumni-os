'use client'

import { motion } from 'framer-motion'
import { settle } from '@/lib/motion'

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
 * Sizing notes: height-only constraint `h-32 sm:h-44 lg:h-48` with
 * `w-auto`. Width auto-derives from the source aspect ratio. The Penn
 * Golf badge family is all vertical ovals at ~2:3 native aspect, so
 * every badge ends up the same width at the same height — no
 * bounding-box padding, no empty space, drop shadow hugs the silhouette.
 *
 * If a future badge has a wildly different aspect (e.g. a horizontal
 * banner), it'll render wider than the rest at the same height. Crop
 * the source PNG to match the vertical-oval family instead of adding
 * CSS workarounds here.
 */
export default function HeroCrest({ src, alt = 'Crest', delay = 0.15 }: Props) {
  if (!src) return null
  return (
    <motion.div
      className="flex-shrink-0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...settle, delay }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-32 sm:h-44 lg:h-48 w-auto"
        style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.28))' }}
      />
    </motion.div>
  )
}
