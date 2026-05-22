'use client'

import { motion } from 'framer-motion'

/**
 * Hero for /the-course — one dramatic par-4 dogleg-left rendered like a
 * yardage-book sketch. Water carries the front of the green; sand
 * clusters defend the corner of the dogleg and the back of the green;
 * trees border the right side. Hand-drawn feel via irregular polygon
 * paths (not smooth ellipses), variable stroke widths, and clustered
 * tree shapes.
 */
export default function CourseHero() {
  return (
    <div className="relative overflow-hidden bg-[#f4ecdb] border-b border-[#d9c8a8]/40">
      {/* Wash + light grid texture suggesting plot paper */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern id="plotGrid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0a1628" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1200" height="700" fill="url(#plotGrid)" />
      </svg>

      <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-14 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
          {/* Title block */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5a7a3e] mb-3">
              Penn Men&rsquo;s Golf · Tee Sheet
            </p>
            <h1
              className="text-[#0a1628] text-5xl sm:text-7xl font-medium tracking-tight leading-[0.92]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The Course
            </h1>
            <span className="block w-12 h-[2px] bg-[#5a7a3e] mt-6 mb-6" />
            <p className="text-[#3d4a5c]/80 text-[15px] leading-relaxed max-w-md mb-6">
              Tee times, foursomes, and home courses across the Penn Golf
              network. Every round here is hosted by a member.
            </p>
            <div className="flex gap-3">
              <a
                href="/the-course/host"
                className="bg-[#5a7a3e] hover:bg-[#4a6a35] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                Host a Round
              </a>
              <a
                href="#open-to-rounds"
                className="bg-white border border-[rgba(180,168,150,0.5)] hover:border-[#5a7a3e] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                Find a Round
              </a>
            </div>
          </div>

          {/* Aerial of one hole — hide on small screens; reads as decoration */}
          <div className="relative hidden lg:block">
            {/* Yardage-book corner annotation */}
            <div className="absolute -top-1 right-0 z-10 text-right">
              <p
                className="text-[#0a1628] text-[15px] font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Hole No. 1
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mt-0.5">
                Par 4 · 415 yards · Dogleg L
              </p>
            </div>

            <svg
              viewBox="0 0 760 540"
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
              style={{ filter: 'drop-shadow(0 12px 30px rgba(45,80,40,0.15))' }}
            >
              <defs>
                {/* Mowing stripes in the fairway */}
                <pattern
                  id="fairwayMow"
                  x="0"
                  y="0"
                  width="18"
                  height="540"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(28)"
                >
                  <rect width="18" height="540" fill="#9bb87d" />
                  <rect x="9" y="0" width="9" height="540" fill="#a8c285" />
                </pattern>
                {/* Sand texture */}
                <pattern
                  id="sandFleck"
                  x="0"
                  y="0"
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="7" height="7" fill="#e6d4a8" />
                  <circle cx="2" cy="2.5" r="0.45" fill="#bea676" />
                  <circle cx="5.2" cy="5" r="0.4" fill="#bea676" />
                  <circle cx="4.5" cy="1.5" r="0.3" fill="#cdb588" />
                </pattern>
                {/* Water ripples */}
                <pattern
                  id="waterRipple"
                  x="0"
                  y="0"
                  width="50"
                  height="18"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="50" height="18" fill="#7fa9b8" />
                  <path d="M 0 9 Q 12 4 24 9 T 50 9" stroke="#9cc1ce" strokeWidth="0.8" fill="none" />
                  <path d="M 0 15 Q 12 12 24 15 T 50 15" stroke="#a8cad7" strokeWidth="0.6" fill="none" />
                </pattern>
                {/* Edge fade for the rough boundary */}
                <radialGradient id="roughVignette">
                  <stop offset="60%" stopColor="#f4ecdb" stopOpacity="0" />
                  <stop offset="100%" stopColor="#f4ecdb" stopOpacity="0.7" />
                </radialGradient>
              </defs>

              {/* Distant rough / out-of-bounds */}
              <path
                d="M 0 0 H 760 V 540 H 0 Z"
                fill="#e8debf"
                opacity="0.5"
              />

              {/* Trees lining the right (rough) */}
              <g fill="#3d5a32">
                {[
                  { cx: 680, cy: 60, r: 18 }, { cx: 720, cy: 90, r: 14 },
                  { cx: 700, cy: 130, r: 20 }, { cx: 730, cy: 170, r: 13 },
                  { cx: 680, cy: 210, r: 17 }, { cx: 715, cy: 250, r: 15 },
                  { cx: 690, cy: 295, r: 19 }, { cx: 735, cy: 330, r: 12 },
                  { cx: 680, cy: 370, r: 16 }, { cx: 720, cy: 415, r: 18 },
                  { cx: 690, cy: 460, r: 14 },
                  // Bottom-left tree stand
                  { cx: 70, cy: 470, r: 16 }, { cx: 40, cy: 510, r: 13 },
                  { cx: 100, cy: 500, r: 18 }, { cx: 30, cy: 460, r: 14 },
                  { cx: 60, cy: 430, r: 12 },
                  // Top-left grove around tee
                  { cx: 360, cy: 30, r: 14 }, { cx: 400, cy: 20, r: 12 },
                  { cx: 440, cy: 35, r: 16 }, { cx: 480, cy: 25, r: 13 },
                ].map((t, i) => (
                  <g key={i}>
                    <circle cx={t.cx} cy={t.cy + 2} r={t.r} fill="#000" opacity="0.18" />
                    <circle cx={t.cx} cy={t.cy} r={t.r} />
                  </g>
                ))}
              </g>

              {/* Fairway — a dogleg-left polygon with deliberately irregular edges */}
              <path
                d="M 540 70 L 610 90 L 625 130 L 615 175 L 590 220 L 555 265 L 510 305 L 450 345 L 380 380 L 300 405 L 230 425 L 175 440 L 145 455 L 130 480 L 145 500 L 200 510 L 270 500 L 340 475 L 390 445 L 425 410 L 442 380 L 460 355 L 490 320 L 530 280 L 565 235 L 600 180 L 630 130 L 640 90 L 615 60 Z"
                fill="url(#fairwayMow)"
                stroke="#5a7a3e"
                strokeWidth="1.2"
                strokeOpacity="0.55"
              />

              {/* Hand-drawn fairway outline (wobble for character) */}
              <path
                d="M 540 70 L 610 90 L 625 130 L 615 175 L 590 220 L 555 265 L 510 305 L 450 345 L 380 380 L 300 405 L 230 425 L 175 440 L 145 455 L 130 480"
                fill="none"
                stroke="#3d5a32"
                strokeWidth="1.4"
                opacity="0.5"
                strokeLinejoin="round"
              />

              {/* Tee box */}
              <g>
                <rect x="558" y="55" width="56" height="18" rx="2" fill="#a8c285" stroke="#5a7a3e" strokeWidth="0.8" />
                <line x1="568" y1="64" x2="586" y2="64" stroke="#fff" strokeWidth="1" />
                <line x1="588" y1="64" x2="606" y2="64" stroke="#fff" strokeWidth="1" />
                {/* tee markers */}
                <circle cx="575" cy="64" r="2.5" fill="#990000" />
                <circle cx="595" cy="64" r="2.5" fill="#990000" />
                <text
                  x="640"
                  y="68"
                  fill="#3d4a5c"
                  fontSize="9"
                  fontFamily="var(--font-playfair)"
                  fontStyle="italic"
                >
                  Tee
                </text>
              </g>

              {/* Fairway bunkers — corner of the dogleg (4 small irregular shapes) */}
              <g>
                <path
                  d="M 270 365 Q 245 358 230 372 Q 218 388 235 398 Q 258 405 280 392 Q 285 380 270 365 Z"
                  fill="url(#sandFleck)"
                  stroke="#a89060"
                  strokeWidth="0.7"
                />
                <path
                  d="M 315 395 Q 295 392 285 405 Q 290 420 310 422 Q 325 415 320 402 Z"
                  fill="url(#sandFleck)"
                  stroke="#a89060"
                  strokeWidth="0.7"
                />
                <path
                  d="M 360 410 Q 350 415 348 425 Q 360 432 372 425 Q 375 415 360 410 Z"
                  fill="url(#sandFleck)"
                  stroke="#a89060"
                  strokeWidth="0.7"
                />
              </g>

              {/* Water — lake guarding the front of the green */}
              <path
                d="M 70 350 Q 55 365 60 395 Q 65 430 100 445 Q 140 455 175 440 Q 195 425 188 405 Q 175 380 145 370 Q 110 360 90 348 Q 78 345 70 350 Z"
                fill="url(#waterRipple)"
                stroke="#3d6878"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />
              <text
                x="120"
                y="402"
                fill="#3d6878"
                fontSize="8.5"
                fontStyle="italic"
                textAnchor="middle"
                fontFamily="var(--font-playfair)"
              >
                Hazard
              </text>

              {/* Greenside bunkers (back-left of green) */}
              <path
                d="M 110 305 Q 90 308 88 325 Q 95 342 115 340 Q 135 335 130 318 Q 125 305 110 305 Z"
                fill="url(#sandFleck)"
                stroke="#a89060"
                strokeWidth="0.7"
              />
              <path
                d="M 80 290 Q 65 295 65 310 Q 75 320 92 315 Q 100 305 92 295 Q 86 288 80 290 Z"
                fill="url(#sandFleck)"
                stroke="#a89060"
                strokeWidth="0.7"
              />
              {/* Right greenside bunker */}
              <path
                d="M 215 470 Q 200 478 205 492 Q 218 505 240 500 Q 250 488 240 478 Q 228 468 215 470 Z"
                fill="url(#sandFleck)"
                stroke="#a89060"
                strokeWidth="0.7"
              />

              {/* Green — irregular oval, darker */}
              <path
                d="M 135 330 Q 100 340 95 365 Q 95 395 135 405 Q 175 410 195 395 Q 205 370 190 345 Q 170 325 135 330 Z"
                fill="#4a6a35"
                stroke="#2f4d24"
                strokeWidth="1.2"
              />
              {/* Subtle green contour line */}
              <path
                d="M 130 350 Q 155 355 175 370 Q 180 385 165 395"
                fill="none"
                stroke="#3d5a32"
                strokeWidth="0.6"
                strokeDasharray="2 3"
                opacity="0.6"
              />

              {/* Flagstick */}
              <line x1="160" y1="380" x2="160" y2="335" stroke="#0a1628" strokeWidth="1.4" />
              <motion.path
                d="M 160 335 L 185 339 L 183 345 L 185 351 L 160 351 Z"
                fill="#990000"
                animate={{
                  d: [
                    'M 160 335 L 185 339 L 183 345 L 185 351 L 160 351 Z',
                    'M 160 335 L 185 337 L 187 343 L 185 349 L 160 351 Z',
                    'M 160 335 L 185 339 L 183 345 L 185 351 L 160 351 Z',
                  ],
                }}
                transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
              />
              {/* Hole on the green */}
              <circle cx="160" cy="380" r="2.2" fill="#0a1628" />

              {/* Cart path snaking from tee to green */}
              <motion.path
                d="M 612 78 Q 642 95 645 130 Q 642 175 615 215 Q 580 260 540 285 Q 480 320 410 350 Q 340 375 270 400 Q 215 420 190 445 Q 175 462 200 470 Q 222 472 230 460"
                fill="none"
                stroke="#c5b08a"
                strokeWidth="1.6"
                strokeDasharray="4 6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: 'easeOut', delay: 0.4 }}
              />

              {/* 150-yard marker (white stake near the dogleg corner) */}
              <g>
                <circle cx="395" cy="395" r="3.5" fill="#fff" stroke="#3d4a5c" strokeWidth="0.6" />
                <line x1="395" y1="398" x2="395" y2="408" stroke="#3d4a5c" strokeWidth="0.8" />
              </g>

              {/* Yardage callouts in italic, like a yardage book */}
              <text
                x="585"
                y="160"
                fill="#3d4a5c"
                fontSize="9"
                fontStyle="italic"
                fontFamily="var(--font-playfair)"
              >
                240 to corner
              </text>
              <text
                x="320"
                y="345"
                fill="#3d4a5c"
                fontSize="9"
                fontStyle="italic"
                fontFamily="var(--font-playfair)"
              >
                175 to green
              </text>

              {/* Vignette mask */}
              <rect width="760" height="540" fill="url(#roughVignette)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
