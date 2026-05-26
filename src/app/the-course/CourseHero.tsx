'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GatheringData } from '@/components/gatherings/GatheringCard'

type Stage = 'marker' | 'sheet' | 'confirmed'

interface Props {
  rounds: GatheringData[]
}

/**
 * Three-stage hero that mimics the actual flow of joining a round:
 *
 *   1. marker     — a real tee marker plaque (Penn Golf). Resting state.
 *   2. sheet      — the tee sheet: scorecard listing of upcoming rounds.
 *   3. confirmed  — green with flagstick; user is on the sheet.
 *
 * The visual on the right is the narrative; the left side is the
 * caller-to-action. State is local (a visual preview), so picking a round
 * here is intentionally lightweight — the durable RSVP happens on the
 * round's own card further down the page.
 */
export default function CourseHero({ rounds }: Props) {
  const [stage, setStage] = useState<Stage>('marker')
  const [pickedRound, setPickedRound] = useState<GatheringData | null>(null)

  const visibleRounds = rounds.slice(0, 4)

  return (
    <section className="relative bg-[#f4ecdb] border-b border-[#d9c8a8]/40 overflow-hidden">
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-15%',
          right: '-8%',
          width: '55%',
          height: '160%',
          background:
            'radial-gradient(ellipse at center, rgba(45,106,79,0.10) 0%, rgba(45,106,79,0.03) 45%, transparent 75%)',
        }}
      />

      <div className="relative max-w-[1180px] mx-auto px-6 sm:px-10 pt-14 pb-14 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-x-12 gap-y-8 items-center">
          {/* LEFT — title + stage-dependent CTA */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2d6a4f] mb-4">
              Penn Men&rsquo;s Golf · The Tee Sheet
            </p>
            <h1
              className="text-[#0a1628] font-medium leading-[0.95] tracking-tight"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(56px, 8.5vw, 104px)',
              }}
            >
              The Course
            </h1>
            <span className="block w-12 h-[2px] bg-[#2d6a4f] mt-7 mb-6" />

            <AnimatePresence mode="wait">
              {stage === 'marker' && (
                <motion.div
                  key="left-marker"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                >
                  <p className="text-[#3d4a5c] text-[15px] leading-[1.65] max-w-[460px]">
                    Tee times, foursomes, and home courses across the Penn
                    Golf network. Every round here is hosted by a member.
                  </p>
                  <div className="flex gap-2.5 mt-7">
                    <button
                      type="button"
                      onClick={() => setStage('sheet')}
                      className="bg-[#2d6a4f] hover:bg-[#225239] text-white text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
                    >
                      Find a Round
                    </button>
                    <a
                      href="/the-course/host"
                      className="bg-transparent border border-[#0a1628]/15 hover:border-[#0a1628]/45 text-[#0a1628] text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
                    >
                      Host a Round
                    </a>
                  </div>
                </motion.div>
              )}

              {stage === 'sheet' && (
                <motion.div
                  key="left-sheet"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                >
                  <p className="text-[#3d4a5c] text-[15px] leading-[1.6] max-w-[460px]">
                    {visibleRounds.length > 0 ? (
                      <>
                        Pick a round on the sheet. We&rsquo;ll let the host
                        know you&rsquo;re interested.
                      </>
                    ) : (
                      <>
                        The sheet is open — no rounds posted yet.{' '}
                        <a href="/the-course/host" className="text-[#2d6a4f] underline">
                          Be the first to open one.
                        </a>
                      </>
                    )}
                  </p>
                  <div className="flex gap-2.5 mt-7">
                    <button
                      type="button"
                      onClick={() => setStage('marker')}
                      className="bg-transparent border border-[#0a1628]/15 hover:border-[#0a1628]/45 text-[#0a1628] text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
                    >
                      ← Back to the Tee
                    </button>
                  </div>
                </motion.div>
              )}

              {stage === 'confirmed' && pickedRound && (
                <motion.div
                  key="left-confirmed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                >
                  <p className="text-[#3d4a5c] text-[15px] leading-[1.6] max-w-[460px]">
                    You&rsquo;re on the sheet for{' '}
                    <span
                      className="text-[#0a1628]"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {pickedRound.title}
                    </span>
                    . The host will be in touch.
                  </p>
                  <div className="flex gap-2.5 mt-7">
                    <button
                      type="button"
                      onClick={() => {
                        setPickedRound(null)
                        setStage('marker')
                      }}
                      className="bg-[#2d6a4f] hover:bg-[#225239] text-white text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
                    >
                      Done
                    </button>
                    <a
                      href="#rounds-section"
                      className="bg-transparent border border-[#0a1628]/15 hover:border-[#0a1628]/45 text-[#0a1628] text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
                    >
                      See the full sheet
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage indicator dots */}
            <div className="flex items-center gap-2 mt-10">
              {(['marker', 'sheet', 'confirmed'] as Stage[]).map((s, i) => (
                <span
                  key={s}
                  className={`block h-[3px] rounded-full transition-all duration-300 ${
                    stage === s
                      ? 'w-9 bg-[#2d6a4f]'
                      : (i === 0 && stage !== 'marker') ||
                          (i === 1 && stage === 'confirmed')
                        ? 'w-3 bg-[#2d6a4f]/45'
                        : 'w-3 bg-[#0a1628]/15'
                  }`}
                />
              ))}
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a7f70] ml-2">
                {stage === 'marker'
                  ? '1 · Tee'
                  : stage === 'sheet'
                    ? '2 · Sheet'
                    : '3 · On the Green'}
              </span>
            </div>
          </div>

          {/* RIGHT — stage visual */}
          <div className="relative min-h-[340px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {stage === 'marker' && <TeeMarker key="vis-marker" />}
              {stage === 'sheet' && (
                <TeeSheet
                  key="vis-sheet"
                  rounds={visibleRounds}
                  onPick={(r) => {
                    setPickedRound(r)
                    setStage('confirmed')
                  }}
                />
              )}
              {stage === 'confirmed' && <HoleGreen key="vis-hole" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stage 1: Penn Golf tee marker. Wooden plaque with engraved title.
// Composed entirely from layered divs (gradients + shadows) so it reads
// as a physical object — no SVG illustration.
function TeeMarker() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.42, ease: [0.16, 0.84, 0.44, 1] }}
      className="relative"
    >
      {/* Stake (the post that holds the plaque) */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 top-full"
        style={{
          width: '14px',
          height: '90px',
          marginTop: '-2px',
          background:
            'linear-gradient(180deg, #3a2516 0%, #1f1409 100%)',
          boxShadow:
            'inset 1px 0 0 rgba(255,255,255,0.08), 0 6px 14px rgba(20,8,2,0.25)',
          borderRadius: '2px',
        }}
      />

      {/* The plaque itself — wooden, beveled, with PENN GOLF set in serif */}
      <div
        className="relative"
        style={{
          width: '300px',
          padding: '36px 30px 30px',
          background:
            'linear-gradient(160deg, #4a2c1a 0%, #6b3d24 30%, #5a3220 70%, #3a2010 100%)',
          borderRadius: '10px',
          boxShadow:
            '0 18px 40px rgba(20,8,2,0.35), 0 4px 8px rgba(20,8,2,0.2), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3)',
        }}
      >
        {/* Top inner bevel */}
        <span
          aria-hidden
          className="absolute inset-x-3 top-3 h-px"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        />
        {/* Bottom inner bevel */}
        <span
          aria-hidden
          className="absolute inset-x-3 bottom-3 h-px"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        />

        <p className="text-center text-[9.5px] font-semibold uppercase tracking-[0.32em] text-[#d9b97a] mb-3">
          Hole No. 1
        </p>

        <div className="flex items-center justify-center mb-2">
          <span
            className="inline-block w-2 h-2 rounded-full mr-2"
            style={{ background: '#c19a55' }}
          />
          <p
            className="text-center text-[#f4e3b8] text-[26px] leading-none"
            style={{
              fontFamily: 'var(--font-playfair)',
              letterSpacing: '0.08em',
              textShadow: '0 1px 0 rgba(0,0,0,0.5)',
            }}
          >
            PENN GOLF
          </p>
          <span
            className="inline-block w-2 h-2 rounded-full ml-2"
            style={{ background: '#c19a55' }}
          />
        </div>

        <p
          className="text-center text-[10px] italic text-[#d9b97a]/85 mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Founded 1894
        </p>

        <div
          className="mx-auto"
          style={{
            width: '60px',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(217,185,122,0.5) 50%, transparent)',
          }}
        />

        <p className="text-center text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#d9b97a]/80 mt-3">
          Par 4 · 415 Yards
        </p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stage 2: tee sheet. Looks like an actual paper scorecard.
function TeeSheet({
  rounds,
  onPick,
}: {
  rounds: GatheringData[]
  onPick: (r: GatheringData) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -0.6 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.42, ease: [0.16, 0.84, 0.44, 1] }}
      className="relative"
      style={{
        width: '380px',
        background: '#faf6ec',
        boxShadow:
          '0 24px 48px rgba(20,30,50,0.18), 0 6px 14px rgba(20,30,50,0.10), inset 0 0 0 1px rgba(180,160,120,0.35)',
      }}
    >
      {/* Red header band, like a scorecard */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: '#7a1318', color: '#f4e3b8' }}
      >
        <p
          className="text-[14px] tracking-[0.14em]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          THE TEE SHEET
        </p>
        <p className="text-[9px] uppercase tracking-[0.22em] opacity-80">
          Open Times
        </p>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-[rgba(120,100,70,0.18)]">
        {rounds.length === 0 ? (
          <li className="px-5 py-5 text-center">
            <p className="text-[12.5px] text-[#5a4732] italic">
              No rounds posted yet.
            </p>
          </li>
        ) : (
          rounds.map((g, i) => {
            const meta = [
              g.dateText,
              g.timeText,
              [g.city, g.state].filter(Boolean).join(', ') || g.venue,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => onPick(g)}
                  className="w-full text-left px-5 py-3 hover:bg-[#f0e8d4] transition-colors group"
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-[10px] font-semibold text-[#7a1318] w-5"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14.5px] text-[#2c1f0e] leading-snug truncate"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {g.title}
                      </p>
                      {meta && (
                        <p className="text-[11.5px] text-[#5a4732] mt-0.5 truncate">
                          {meta}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#7a1318] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Pick →
                    </span>
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ul>

      <div className="px-5 py-2.5 text-[9.5px] italic text-[#7a6448] text-center border-t border-[rgba(120,100,70,0.2)]">
        Signed at the first tee, Penn Men&rsquo;s Golf
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stage 3: a single green with a flagstick. Confirmed.
function HoleGreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: [0.16, 0.84, 0.44, 1] }}
      className="relative"
    >
      <svg
        viewBox="0 0 360 300"
        className="w-[320px] h-auto"
        aria-hidden
      >
        <defs>
          <radialGradient id="greenGrad" cx="55%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#5a8a55" />
            <stop offset="55%" stopColor="#3f6a3a" />
            <stop offset="100%" stopColor="#2b4d28" />
          </radialGradient>
          <filter id="grainBlur">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        {/* Soft ground shadow under green */}
        <ellipse cx="180" cy="225" rx="160" ry="22" fill="#1a2c1a" opacity="0.18" />

        {/* The green — irregular oval (not a perfect ellipse) */}
        <path
          d="M 60 145 Q 50 110 95 90 Q 145 75 195 85 Q 260 95 295 130 Q 315 170 285 200 Q 240 225 170 220 Q 100 215 70 190 Q 50 170 60 145 Z"
          fill="url(#greenGrad)"
          stroke="#26421f"
          strokeWidth="1"
          filter="url(#grainBlur)"
        />

        {/* Subtle contour line on the green */}
        <path
          d="M 95 165 Q 150 175 215 160 Q 250 150 270 165"
          fill="none"
          stroke="#2a4d24"
          strokeWidth="0.7"
          strokeDasharray="3 4"
          opacity="0.5"
        />

        {/* Flagstick shadow */}
        <line
          x1="186"
          y1="155"
          x2="172"
          y2="65"
          stroke="#1a2c1a"
          strokeWidth="2.5"
          opacity="0.25"
        />
        {/* Flagstick */}
        <line x1="183" y1="155" x2="183" y2="55" stroke="#1a1612" strokeWidth="1.6" />
        {/* Flag */}
        <motion.path
          d="M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z"
          fill="#990000"
          animate={{
            d: [
              'M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z',
              'M 183 55 L 220 58 L 222 68 L 220 78 L 183 78 Z',
              'M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z',
            ],
          }}
          transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
        />
        {/* Hole on the green */}
        <ellipse cx="183" cy="155" rx="4" ry="2.2" fill="#0a1612" />

        {/* "Confirmed" stamp — tilted, looks like ink stamp */}
        <g transform="translate(245 195) rotate(-8)">
          <rect
            x="-44"
            y="-12"
            width="88"
            height="24"
            fill="none"
            stroke="#990000"
            strokeWidth="1.4"
            rx="2"
            opacity="0.85"
          />
          <text
            x="0"
            y="5"
            fill="#990000"
            fontSize="11"
            textAnchor="middle"
            fontFamily="var(--font-playfair)"
            fontStyle="italic"
            opacity="0.9"
            letterSpacing="2"
          >
            On the sheet
          </text>
        </g>
      </svg>
    </motion.div>
  )
}
