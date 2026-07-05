'use client'

/**
 * Navy section header with one of the framed gold emblems as "art on the
 * wall" beside the title. The emblems are transparent PNGs (gold oval on a
 * dark scene), so they sit on the navy-dark band like a hung plate. One
 * header treatment across every section — replaces the assorted per-page
 * navy blocks so the app reads as one club, not eight pages.
 */
import { motion } from 'framer-motion'
import { settle } from '@/lib/motion'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  /** Path under /public, e.g. "/emblems/course.png". */
  emblemSrc: string
  emblemAlt: string
  /** Optional CTA row / controls rendered under the subtitle. */
  children?: React.ReactNode
  /** Container max width — match the page body. Default 1320px. */
  maxWidth?: string
  /** Optional data-testid on the <h1> (some pages assert on it in e2e). */
  titleTestId?: string
}

export default function SectionEmblemHeader({
  eyebrow,
  title,
  subtitle,
  emblemSrc,
  emblemAlt,
  children,
  maxWidth = '1320px',
  titleTestId,
}: Props) {
  return (
    <div className="relative overflow-hidden bg-[#060e1a] px-6 sm:px-8 pt-10 pb-12 sm:pt-12 sm:pb-14">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none texture-engraved" />
      <div
        className="mx-auto relative flex items-center justify-between gap-4 sm:gap-8"
        style={{ maxWidth }}
      >
        <div className="min-w-0 flex-1">
          <motion.p
            className="eyebrow text-gold mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            className="font-heading text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05]"
            data-testid={titleTestId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, ...settle }}
          >
            {title}
          </motion.h1>
          <motion.span
            className="block h-px bg-gold mt-4 w-16 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.18, ...settle }}
          />
          {subtitle && (
            <motion.p
              className="text-white/60 text-sm sm:text-base mt-3 max-w-xl leading-relaxed whitespace-pre-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.14, duration: 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src={emblemSrc}
          alt={emblemAlt}
          className="flex-shrink-0 h-28 sm:h-40 lg:h-52 w-auto"
          style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.55))' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...settle }}
        />
      </div>
    </div>
  )
}
