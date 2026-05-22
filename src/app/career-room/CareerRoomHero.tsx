'use client'

import { motion } from 'framer-motion'

/**
 * Hero for /career-room — a private-library register. Deep navy ground,
 * a stack of leather-bound books beside the title, brass desk-lamp glow
 * casting warm light over the volumes. "Where alumni take the meeting."
 */
export default function CareerRoomHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0c1c34] to-[#102137]">
      {/* Warm desk-lamp wash on the right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          right: '15%',
          width: '700px',
          height: '500px',
          transform: 'translate(50%, -50%)',
          background:
            'radial-gradient(ellipse at center, rgba(200,168,75,0.22) 0%, rgba(200,168,75,0.06) 40%, transparent 70%)',
        }}
      />
      {/* Subtle vertical lines like book bindings on a shelf */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        aria-hidden
      >
        <defs>
          <pattern id="shelf" x="0" y="0" width="14" height="20" patternUnits="userSpaceOnUse">
            <line x1="3" y1="0" x2="3" y2="20" stroke="#c8a84b" strokeWidth="0.6" />
            <line x1="9" y1="0" x2="9" y2="20" stroke="#c8a84b" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#shelf)" />
      </svg>

      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
          {/* Title block */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-3">
              Penn Men&rsquo;s Golf · Advice &amp; Introductions
            </p>
            <h1
              className="text-[#f4ecdb] text-5xl sm:text-7xl font-medium tracking-tight leading-[0.92]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Career Room
            </h1>
            <span className="block w-12 h-[2px] bg-[#c8a84b] mt-6 mb-6" />
            <p className="text-[#f4ecdb]/65 text-[15px] leading-relaxed max-w-md">
              Advice, introductions, and career paths from Penn Golf alumni.
              Take the meeting; pay it forward.
            </p>
          </div>

          {/* Stack of books illustration */}
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
                {/* Burgundy leather */}
                <linearGradient id="burgundy" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5c1a1a" />
                  <stop offset="50%" stopColor="#7a2424" />
                  <stop offset="100%" stopColor="#4a1414" />
                </linearGradient>
                {/* Forest green leather */}
                <linearGradient id="forest" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1a3a2a" />
                  <stop offset="50%" stopColor="#2a5240" />
                  <stop offset="100%" stopColor="#143020" />
                </linearGradient>
                {/* Navy leather */}
                <linearGradient id="navyLeather" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0c1c34" />
                  <stop offset="50%" stopColor="#1a2c4d" />
                  <stop offset="100%" stopColor="#08152a" />
                </linearGradient>
                {/* Tan leather */}
                <linearGradient id="tan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8a6a3e" />
                  <stop offset="50%" stopColor="#a8855a" />
                  <stop offset="100%" stopColor="#6a4e28" />
                </linearGradient>
                {/* Page texture */}
                <pattern id="pages" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
                  <rect width="2" height="2" fill="#e8dcc0" />
                  <line x1="0" y1="1" x2="2" y2="1" stroke="#d4c4a0" strokeWidth="0.2" />
                </pattern>
              </defs>

              {/* Desk surface */}
              <ellipse cx="200" cy="330" rx="180" ry="14" fill="#000" opacity="0.4" />
              <rect x="20" y="320" width="360" height="40" fill="#3d2418" opacity="0.7" />

              {/* BOOK 1 — bottom, largest, tan, lying horizontal */}
              <g>
                <rect x="60" y="276" width="280" height="36" rx="2" fill="url(#tan)" />
                {/* Pages on the side */}
                <rect x="62" y="280" width="276" height="28" fill="url(#pages)" />
                <rect x="60" y="276" width="280" height="36" rx="2" fill="none" stroke="#3d2418" strokeWidth="1" />
                {/* Gold bands */}
                <rect x="60" y="282" width="280" height="2" fill="#c8a84b" opacity="0.7" />
                <rect x="60" y="304" width="280" height="2" fill="#c8a84b" opacity="0.7" />
                {/* Title plate */}
                <rect x="120" y="288" width="160" height="14" fill="#c8a84b" opacity="0.85" />
                <text
                  x="200"
                  y="298"
                  fill="#1a0e08"
                  fontSize="8"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="var(--font-playfair)"
                  letterSpacing="2"
                >
                  PENN GOLF · VOL. III
                </text>
              </g>

              {/* BOOK 2 — middle, burgundy, slightly offset */}
              <g>
                <rect x="80" y="232" width="260" height="42" rx="2" fill="url(#burgundy)" />
                <rect x="82" y="237" width="256" height="32" fill="url(#pages)" />
                <rect x="80" y="232" width="260" height="42" rx="2" fill="none" stroke="#1a0e08" strokeWidth="1" />
                {/* Gold horizontal bands */}
                <rect x="80" y="240" width="260" height="1.5" fill="#c8a84b" opacity="0.8" />
                <rect x="80" y="266" width="260" height="1.5" fill="#c8a84b" opacity="0.8" />
                {/* Title */}
                <text
                  x="210"
                  y="258"
                  fill="#c8a84b"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="var(--font-playfair)"
                  letterSpacing="1.5"
                >
                  THE RECORD BOOK
                </text>
              </g>

              {/* BOOK 3 — forest green, top-left, offset further */}
              <g>
                <rect x="50" y="188" width="240" height="38" rx="2" fill="url(#forest)" />
                <rect x="52" y="192" width="236" height="30" fill="url(#pages)" />
                <rect x="50" y="188" width="240" height="38" rx="2" fill="none" stroke="#0a1a12" strokeWidth="1" />
                <rect x="50" y="195" width="240" height="1.2" fill="#c8a84b" opacity="0.75" />
                <rect x="50" y="217" width="240" height="1.2" fill="#c8a84b" opacity="0.75" />
                <text
                  x="170"
                  y="211"
                  fill="#c8a84b"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="var(--font-playfair)"
                  letterSpacing="1.4"
                >
                  CLASSES &middot; MMV–MMXXV
                </text>
              </g>

              {/* BOOK 4 — navy, leaning vertical on the right side */}
              <g transform="translate(310 138) rotate(-10)">
                <rect x="0" y="0" width="34" height="140" rx="2" fill="url(#navyLeather)" />
                <rect x="32" y="3" width="2" height="134" fill="url(#pages)" />
                <rect x="0" y="0" width="34" height="140" rx="2" fill="none" stroke="#08152a" strokeWidth="1" />
                {/* Spine title runs vertically */}
                <text
                  x="17"
                  y="80"
                  fill="#c8a84b"
                  fontSize="8"
                  fontWeight="700"
                  textAnchor="middle"
                  transform="rotate(-90 17 80)"
                  fontFamily="var(--font-playfair)"
                  letterSpacing="2.5"
                >
                  THE CAREER ROOM
                </text>
                <rect x="0" y="22" width="34" height="1.5" fill="#c8a84b" opacity="0.7" />
                <rect x="0" y="118" width="34" height="1.5" fill="#c8a84b" opacity="0.7" />
              </g>

              {/* Brass desk lamp glow over the books */}
              <ellipse cx="220" cy="200" rx="220" ry="100" fill="#c8a84b" opacity="0.08" />

              {/* Small fountain pen leaning on the books */}
              <g transform="translate(180 170) rotate(18)">
                <rect x="0" y="0" width="80" height="6" rx="3" fill="#1a0e08" />
                <rect x="0" y="0" width="20" height="6" rx="3" fill="#c8a84b" />
                <path d="M 78 1 L 86 3 L 78 5 Z" fill="#888" />
              </g>
            </motion.svg>
          </div>
        </div>
      </div>
    </div>
  )
}
