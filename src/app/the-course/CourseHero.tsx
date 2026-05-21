'use client'

import { motion } from 'framer-motion'

export default function CourseHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0e2a2e] to-[#173b34] px-6 sm:px-8 pt-14 pb-20">
      {/* Soft contour topo lines in the background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        viewBox="0 0 1320 480"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern id="contour" x="0" y="0" width="1320" height="480" patternUnits="userSpaceOnUse">
            <path
              d="M 0 320 Q 220 280 440 320 T 880 300 T 1320 330"
              stroke="white"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M 0 360 Q 220 320 440 360 T 880 340 T 1320 370"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 0 400 Q 220 360 440 400 T 880 380 T 1320 410"
              stroke="white"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M 0 440 Q 220 400 440 440 T 880 420 T 1320 450"
              stroke="white"
              strokeWidth="0.6"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="1320" height="480" fill="url(#contour)" />
      </svg>

      <div className="max-w-[1320px] mx-auto relative flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Course
          </h1>
          <span className="block w-12 h-[2px] bg-[#86c79f] mt-5 mb-5" />
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed">
            Tee times, foursomes, and home courses across the Penn Golf network.
          </p>
        </div>

        {/* Animated flag */}
        <motion.svg
          className="hidden sm:block flex-shrink-0"
          width="120"
          height="160"
          viewBox="0 0 120 160"
          aria-hidden
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          {/* Flagstick */}
          <line
            x1="42"
            y1="20"
            x2="42"
            y2="150"
            stroke="#dcd2bf"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Ball at the base */}
          <circle cx="42" cy="148" r="4" fill="#f8f5f0" />
          {/* Flag — animated with subtle wave */}
          <motion.path
            d="M 42 22 Q 70 30 95 25 Q 90 38 92 50 Q 70 48 42 55 Z"
            fill="#990000"
            initial={{ scaleX: 1 }}
            animate={{
              d: [
                'M 42 22 Q 70 30 95 25 Q 90 38 92 50 Q 70 48 42 55 Z',
                'M 42 22 Q 70 26 95 30 Q 88 40 94 52 Q 70 46 42 55 Z',
                'M 42 22 Q 70 30 95 25 Q 90 38 92 50 Q 70 48 42 55 Z',
              ],
            }}
            transition={{
              duration: 3.2,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
          {/* Subtle hole shadow under flag */}
          <ellipse cx="42" cy="152" rx="14" ry="2.5" fill="#000" opacity="0.18" />
        </motion.svg>
      </div>
    </div>
  )
}
