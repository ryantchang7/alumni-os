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
        <div className="flex items-start gap-4">
          {/* Flagstick marker with hole number, replaces the round badge */}
          <FlagMarker hole={hole} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5a7a3e]">
              Hole {hole}
            </p>
            <h2
              className="text-2xl text-[#0a1628] font-medium leading-snug font-heading"
            >
              {title}
            </h2>
          </div>
        </div>
        {rightLabel && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a7a3e]">
            {rightLabel}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-ink-muted mb-6 ml-14">{subtitle}</p>}
      <div>{children}</div>
    </motion.section>
  )
}

function FlagMarker({ hole }: { hole: number }) {
  return (
    <svg
      width="40"
      height="56"
      viewBox="0 0 40 56"
      className="flex-shrink-0 mt-1"
      aria-hidden
    >
      {/* Green base */}
      <ellipse cx="20" cy="50" rx="16" ry="4.5" fill="#4a6a35" />
      <ellipse cx="20" cy="49" rx="16" ry="4" fill="#5a7a3e" />
      {/* Flagstick */}
      <line x1="20" y1="48" x2="20" y2="10" stroke="#0a1628" strokeWidth="1.6" strokeLinecap="round" />
      {/* Flag */}
      <path d="M 20 10 L 36 14 L 34 19 L 36 24 L 20 24 Z" fill="#990000" />
      {/* Hole number on the flag */}
      <text
        x="26"
        y="20"
        fill="#fff"
        fontSize="8"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="var(--font-playfair)"
      >
        {hole}
      </text>
    </svg>
  )
}

/** Cart-path divider between two holes. Soft dashed curve in green. */
export function CartPathDivider() {
  return (
    <div className="flex items-center justify-center py-3" aria-hidden>
      <svg width="300" height="44" viewBox="0 0 300 44" className="opacity-70">
        {/* Curving cart path */}
        <path
          d="M 10 30 Q 80 8 150 22 T 290 16"
          fill="none"
          stroke="#c5b08a"
          strokeWidth="1.6"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        {/* Tiny tree clusters along the path */}
        <g fill="#3d5a32" opacity="0.6">
          <circle cx="40" cy="14" r="3.5" />
          <circle cx="52" cy="10" r="2.8" />
          <circle cx="60" cy="15" r="3" />
          <circle cx="200" cy="30" r="3.2" />
          <circle cx="212" cy="34" r="2.8" />
          <circle cx="222" cy="30" r="3.5" />
        </g>
        {/* Sand fleck */}
        <ellipse cx="150" cy="32" rx="9" ry="3" fill="#e6d4a8" stroke="#a89060" strokeWidth="0.5" opacity="0.7" />
      </svg>
    </div>
  )
}
