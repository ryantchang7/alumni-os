'use client'

import { motion } from 'framer-motion'

interface Props {
  hole: number
  title: string
  rightLabel?: string
  subtitle?: string
  children: React.ReactNode
}

/**
 * Each section on /the-course is a "hole". The number sits in a green flag
 * marker; the title is Playfair. Section fades up on scroll-into-view via
 * framer-motion so the page reads like you're walking onto each green.
 */
export default function CourseHoleSection({
  hole,
  title,
  rightLabel,
  subtitle,
  children,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#2d6a4f] text-white text-[12px] font-semibold flex-shrink-0 shadow-sm"
            style={{ boxShadow: '0 2px 6px rgba(45,106,79,0.35)' }}
          >
            {hole}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2d6a4f]">
              Hole {hole}
            </p>
            <h2
              className="text-2xl text-[#0a1628] font-medium leading-snug"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {title}
            </h2>
          </div>
        </div>
        {rightLabel && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f]">
            {rightLabel}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-[#8a7f70] mb-6 ml-12">{subtitle}</p>}
      <div className="ml-0">{children}</div>
    </motion.section>
  )
}

/** Cart-path divider between two holes. Soft dashed curve in green. */
export function CartPathDivider() {
  return (
    <div
      className="flex items-center justify-center py-2"
      aria-hidden
    >
      <svg
        width="220"
        height="36"
        viewBox="0 0 220 36"
        className="opacity-60"
      >
        <path
          d="M 6 24 Q 60 4 110 18 T 214 12"
          fill="none"
          stroke="#86c79f"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
