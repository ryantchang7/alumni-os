'use client'

import { motion } from 'framer-motion'

/**
 * Hero for /19th-hole — a clubhouse-bar atmosphere. Warm amber wash,
 * brass lamp glow, a low-poly whisky tumbler beside the title. Same
 * design depth as /the-course but the "after the round" register
 * instead of "on the course."
 */
export default function NineteenthHoleHero() {
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
          {/* Title block */}
          <div>
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

          {/* Whisky tumbler illustration */}
          <div className="hidden lg:block relative">
            <motion.svg
              viewBox="0 0 400 360"
              className="w-full h-auto"
              aria-hidden
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              style={{ filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Whisky color */}
                <linearGradient id="whisky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d49b52" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#a26829" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#7a4818" stopOpacity="1" />
                </linearGradient>
                {/* Glass body (subtle gradient for depth) */}
                <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3d2418" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#3d2418" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#3d2418" stopOpacity="0.45" />
                </linearGradient>
                {/* Lamp glow behind */}
                <radialGradient id="lampGlow">
                  <stop offset="0%" stopColor="#d49b52" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#d49b52" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#d49b52" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Behind-the-glass lamp wash */}
              <ellipse cx="200" cy="180" rx="220" ry="160" fill="url(#lampGlow)" />

              {/* Coaster */}
              <ellipse cx="200" cy="320" rx="105" ry="14" fill="#1a0f08" opacity="0.7" />
              <ellipse cx="200" cy="318" rx="100" ry="11" fill="#3d2418" />
              <ellipse cx="200" cy="318" rx="100" ry="11" fill="none" stroke="#d49b52" strokeWidth="0.8" opacity="0.5" />

              {/* Glass — old-fashioned tumbler. Slightly tapered. */}
              {/* Back side reflection */}
              <path
                d="M 120 130 L 130 310 L 270 310 L 280 130 Z"
                fill="#f4ecdb"
                opacity="0.05"
              />
              {/* Whisky body */}
              <path
                d="M 124 200 L 132 308 L 268 308 L 276 200 Q 200 215 124 200 Z"
                fill="url(#whisky)"
              />
              {/* Whisky surface ellipse */}
              <ellipse cx="200" cy="200" rx="76" ry="10" fill="#a26829" />
              <ellipse cx="200" cy="199" rx="76" ry="9" fill="none" stroke="#d49b52" strokeWidth="1" opacity="0.6" />

              {/* Ice cube */}
              <g>
                <path
                  d="M 180 190 L 210 188 L 218 198 L 215 213 L 185 215 L 178 205 Z"
                  fill="#f4ecdb"
                  opacity="0.65"
                />
                <path
                  d="M 180 190 L 210 188 L 215 213 L 185 215 Z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="0.6"
                  opacity="0.7"
                />
              </g>

              {/* Glass outline + highlights */}
              <path
                d="M 120 130 L 130 310 L 270 310 L 280 130"
                fill="url(#glassBody)"
              />
              <path
                d="M 120 130 L 130 310 L 270 310 L 280 130"
                fill="none"
                stroke="#1a0f08"
                strokeWidth="1.2"
              />
              {/* Rim */}
              <ellipse cx="200" cy="130" rx="80" ry="10" fill="none" stroke="#1a0f08" strokeWidth="1.4" />
              <ellipse cx="200" cy="130" rx="80" ry="10" fill="#f4ecdb" opacity="0.04" />
              {/* Left edge highlight */}
              <line x1="128" y1="145" x2="135" y2="290" stroke="#f4ecdb" strokeWidth="1" opacity="0.4" />
              <line x1="138" y1="160" x2="143" y2="290" stroke="#f4ecdb" strokeWidth="0.6" opacity="0.25" />
            </motion.svg>
          </div>
        </div>
      </div>
    </div>
  )
}
