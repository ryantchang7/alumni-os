'use client'

import { motion } from 'framer-motion'

/**
 * Hero for /the-course — styled as a hand-drawn course architect's plan.
 * Three flowing fairways across the width with greens, bunkers, tree
 * clusters, and an animated flagstick. Cream parchment + sage greens +
 * bunker tan + navy accents.
 */
export default function CourseHero() {
  return (
    <div className="relative overflow-hidden bg-[#f4ecdb] px-6 sm:px-8 pt-14 pb-10 sm:pb-14 border-b border-[#d9c8a8]/40">
      {/* Faint topographic contours */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 1320 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g stroke="#0a1628" strokeWidth="0.6" fill="none">
          <path d="M -20 120 Q 200 70 440 110 T 880 100 T 1340 120" />
          <path d="M -20 170 Q 200 130 440 160 T 880 150 T 1340 175" />
          <path d="M -20 230 Q 200 200 440 220 T 880 210 T 1340 240" />
          <path d="M -20 300 Q 200 280 440 290 T 880 290 T 1340 320" />
        </g>
      </svg>

      <div className="max-w-[1320px] mx-auto relative">
        {/* Title block */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5a7a3e] mb-3">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-[#0a1628] text-4xl sm:text-6xl font-medium tracking-tight leading-[0.95]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Course
          </h1>
          <span className="block w-12 h-[2px] bg-[#5a7a3e] mt-5 mb-5" />
          <p className="text-[#3d4a5c]/70 text-sm sm:text-base max-w-xl leading-relaxed">
            Tee times, foursomes, and home courses across the Penn Golf network.
          </p>
        </div>

        {/* Course aerial — flowing 3-hole plan */}
        <div className="relative w-full" style={{ aspectRatio: '1320 / 280' }}>
          <svg
            viewBox="0 0 1320 280"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <pattern
                id="fairwayTexture"
                x="0"
                y="0"
                width="14"
                height="280"
                patternUnits="userSpaceOnUse"
              >
                <rect width="14" height="280" fill="#9bb87d" />
                <rect x="7" y="0" width="7" height="280" fill="#a8c285" />
              </pattern>
              <pattern
                id="bunkerTexture"
                x="0"
                y="0"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <rect width="6" height="6" fill="#e6d4a8" />
                <circle cx="2" cy="2" r="0.5" fill="#c5ad7a" />
                <circle cx="4.5" cy="4.5" r="0.4" fill="#c5ad7a" />
              </pattern>
            </defs>

            {/* Rough outline */}
            <path
              d="M 20 240 Q 100 220 200 230 Q 300 245 420 230 Q 540 215 660 225 Q 780 235 900 220 Q 1020 205 1140 215 Q 1240 222 1300 235"
              fill="none"
              stroke="#3d5a32"
              strokeWidth="1"
              strokeDasharray="0 4 1 4"
              opacity="0.5"
            />

            {/* HOLE 1 */}
            <path
              d="M 30 60 Q 100 70 180 80 Q 270 90 360 110 Q 430 124 500 145 L 520 175 Q 460 168 380 152 Q 290 132 200 118 Q 110 104 30 92 Z"
              fill="url(#fairwayTexture)"
              stroke="#5a7a3e"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            <rect x="34" y="65" width="14" height="6" rx="1.5" fill="#dcd2bf" />
            <circle cx="44" cy="80" r="3.5" fill="#990000" />
            <ellipse cx="280" cy="100" rx="22" ry="9" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="498" cy="135" rx="18" ry="7" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="520" cy="160" rx="22" ry="14" fill="#4a6a35" stroke="#3d5a32" strokeWidth="1" />
            <line x1="520" y1="160" x2="520" y2="128" stroke="#0a1628" strokeWidth="1.2" />
            <motion.path
              d="M 520 128 L 540 132 L 538 138 L 540 144 L 520 144 Z"
              fill="#990000"
              animate={{
                d: [
                  'M 520 128 L 540 132 L 538 138 L 540 144 L 520 144 Z',
                  'M 520 128 L 540 130 L 542 136 L 540 142 L 520 144 Z',
                  'M 520 128 L 540 132 L 538 138 L 540 144 L 520 144 Z',
                ],
              }}
              transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
            />
            <circle cx="44" cy="50" r="11" fill="#0a1628" />
            <text
              x="44"
              y="54"
              fill="#f4ecdb"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="var(--font-playfair)"
            >
              1
            </text>

            {/* HOLE 2 */}
            <path
              d="M 590 175 Q 660 165 740 155 Q 820 145 900 135 Q 970 128 1030 122 L 1050 92 Q 970 95 870 105 Q 770 115 670 135 Q 620 145 590 152 Z"
              fill="url(#fairwayTexture)"
              stroke="#5a7a3e"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            <rect x="594" y="160" width="14" height="6" rx="1.5" fill="#dcd2bf" />
            <circle cx="604" cy="175" r="3.5" fill="#990000" />
            <ellipse cx="780" cy="145" rx="14" ry="6" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="810" cy="155" rx="10" ry="5" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="1018" cy="100" rx="14" ry="7" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="1050" cy="108" rx="22" ry="14" fill="#4a6a35" stroke="#3d5a32" strokeWidth="1" />
            <line x1="1050" y1="108" x2="1050" y2="80" stroke="#0a1628" strokeWidth="1.2" />
            <path
              d="M 1050 80 L 1070 84 L 1068 90 L 1070 96 L 1050 96 Z"
              fill="#990000"
            />
            <circle cx="604" cy="148" r="11" fill="#0a1628" />
            <text
              x="604"
              y="152"
              fill="#f4ecdb"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="var(--font-playfair)"
            >
              2
            </text>

            {/* HOLE 3 */}
            <path
              d="M 1280 220 Q 1200 222 1110 220 Q 1010 218 920 222 Q 830 226 750 232 L 720 252 Q 800 256 900 250 Q 1010 244 1120 240 Q 1210 236 1280 240 Z"
              fill="url(#fairwayTexture)"
              stroke="#5a7a3e"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            <rect x="1262" y="220" width="14" height="6" rx="1.5" fill="#dcd2bf" />
            <circle cx="1272" cy="235" r="3.5" fill="#990000" />
            <ellipse cx="980" cy="230" rx="18" ry="6" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="745" cy="252" rx="20" ry="8" fill="url(#bunkerTexture)" stroke="#c5ad7a" strokeWidth="0.5" />
            <ellipse cx="715" cy="250" rx="22" ry="14" fill="#4a6a35" stroke="#3d5a32" strokeWidth="1" />
            <line x1="715" y1="250" x2="715" y2="222" stroke="#0a1628" strokeWidth="1.2" />
            <path
              d="M 715 222 L 735 226 L 733 232 L 735 238 L 715 238 Z"
              fill="#990000"
            />
            <circle cx="1272" cy="205" r="11" fill="#0a1628" />
            <text
              x="1272"
              y="209"
              fill="#f4ecdb"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="var(--font-playfair)"
            >
              3
            </text>

            {/* Tree dot clusters */}
            <g fill="#3d5a32" opacity="0.55">
              {[
                [60, 110], [80, 120], [105, 115], [130, 122], [160, 128],
                [200, 38], [225, 32], [250, 40], [275, 46],
                [400, 50], [430, 56], [460, 48], [490, 60],
                [600, 200], [630, 208], [660, 205],
                [880, 80], [905, 70], [930, 78], [955, 70],
                [1090, 50], [1115, 60], [1140, 48],
                [1200, 180], [1225, 188], [1250, 178],
                [840, 270], [875, 268], [905, 272],
                [560, 260], [590, 266],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r={cy % 7 === 0 ? 5 : 3.5} />
              ))}
            </g>

            {/* Cart path */}
            <motion.path
              d="M 30 110 Q 200 130 380 140 Q 540 148 620 200 Q 720 245 880 235 Q 1050 220 1170 215 Q 1240 212 1290 220"
              fill="none"
              stroke="#b5a98e"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.4, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
