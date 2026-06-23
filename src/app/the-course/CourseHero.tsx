'use client'

/**
 * The Course hero — three-stage interactive flow.
 *
 *   1. plaque   — a clean navy + gold "Hole I" plaque. Resting state.
 *   2. sheet    — the tee sheet: a cream paper scorecard with rounds.
 *   3. on-green — a green with a flagstick + confirmation tag.
 *
 * This is the v2 design — same flow as before, but the ornament has
 * been quieted: no red banner, no gradient noise, fewer bevels. The
 * visual hierarchy now matches the rest of the Clubhouse (navy + gold
 * + cream), and the animations are slower + softer so the page reads
 * cleanly rather than busy.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GatheringData } from '@/components/gatherings/GatheringCard'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import HeroCrest from '@/components/HeroCrest'

type Stage = 'plaque' | 'sheet' | 'on-green'

interface Props {
  rounds: GatheringData[]
}

export default function CourseHero({ rounds }: Props) {
  const [stage, setStage] = useState<Stage>('plaque')
  const [pickedRound, setPickedRound] = useState<GatheringData | null>(null)
  const crestImage = useSiteContent('the-course.crest-image', '')
  const heroBlurb = useSiteContent(
    'the-course.hero-blurb',
    'A place for Penn Golf members to host rounds, join foursomes, share home courses, and stay connected through the game.',
  )
  const stageOneBlurb = useSiteContent(
    'the-course.stage-tee-blurb',
    'A place for Penn Golf members to host rounds, join foursomes, share home courses, and stay connected through the game.',
  )
  const stageOneCta = useSiteContent('the-course.stage-tee-cta', 'Find a Round')
  const stageOneSecondary = useSiteContent('the-course.stage-tee-secondary', 'Host a Round')
  const stageTwoBlurbWithRounds = useSiteContent(
    'the-course.stage-sheet-blurb',
    'Pick a round on the sheet. We’ll let the host know you’re interested.',
  )
  const stageTwoBlurbEmpty = useSiteContent(
    'the-course.stage-sheet-blurb-empty',
    'The sheet is open — no rounds posted yet.',
  )
  const stageThreePrefix = useSiteContent(
    'the-course.stage-confirmed-prefix',
    'You’re on the sheet for',
  )
  const stageThreeSuffix = useSiteContent(
    'the-course.stage-confirmed-suffix',
    'The host will be in touch.',
  )

  const visibleRounds = rounds.slice(0, 4)

  return (
    <section className="relative bg-[#0a1628] border-b border-white/[0.08] overflow-hidden">
      <div className="relative max-w-[1180px] mx-auto px-6 sm:px-10 pt-10 pb-12">
        {/* Eyebrow + crest + title row — matches every other tab hero so
            the flow below feels like a continuation rather than a
            different page. */}
        <div className="flex items-center gap-5 sm:gap-7">
          <HeroCrest src={crestImage} alt="The Course crest" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4a9d72] mb-4">
              Penn Men&rsquo;s Golf · The Tee Sheet
            </p>
            <h1
              className="text-white text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The Course
            </h1>
          </div>
        </div>

        {/* Two-column flow zone — narrative on the left, visual on the
            right. Both columns top-aligned so the visual feels anchored
            to the same baseline as the headline copy. */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-x-12 gap-y-8 items-start">
          {/* LEFT — copy + CTAs change per stage */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {stage === 'plaque' && (
                <motion.div
                  key="left-plaque"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <p className="text-white/70 text-[15px] leading-[1.65] max-w-[480px]">
                    {stageOneBlurb || heroBlurb}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-7">
                    <button
                      type="button"
                      onClick={() => setStage('sheet')}
                      className="bg-[#2d6a4f] hover:bg-[#3a8060] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {stageOneCta}
                    </button>
                    <a
                      href="/the-course/host"
                      className="bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.06] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {stageOneSecondary}
                    </a>
                  </div>
                </motion.div>
              )}

              {stage === 'sheet' && (
                <motion.div
                  key="left-sheet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <p className="text-white/70 text-[15px] leading-[1.65] max-w-[480px]">
                    {visibleRounds.length > 0 ? (
                      stageTwoBlurbWithRounds
                    ) : (
                      <>
                        {stageTwoBlurbEmpty}{' '}
                        <a href="/the-course/host" className="text-[#4a9d72] underline">
                          Be the first to open one.
                        </a>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-7">
                    <button
                      type="button"
                      onClick={() => setStage('plaque')}
                      className="bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.06] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                </motion.div>
              )}

              {stage === 'on-green' && pickedRound && (
                <motion.div
                  key="left-on-green"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <p className="text-white/70 text-[15px] leading-[1.65] max-w-[480px]">
                    {stageThreePrefix}{' '}
                    <span
                      className="text-white"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {pickedRound.title}
                    </span>
                    . {stageThreeSuffix}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-7">
                    <button
                      type="button"
                      onClick={() => {
                        setPickedRound(null)
                        setStage('plaque')
                      }}
                      className="bg-[#2d6a4f] hover:bg-[#3a8060] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                    <a
                      href="#rounds-section"
                      className="bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.06] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      See the full sheet
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage indicator. Quieter than v1 — single gold rule that
                grows as you progress, with a clear textual stage label. */}
            <div className="flex items-center gap-3 mt-7">
              {(['plaque', 'sheet', 'on-green'] as Stage[]).map((s, i) => {
                const reached =
                  stage === s ||
                  (stage === 'sheet' && i === 0) ||
                  (stage === 'on-green' && i < 2)
                return (
                  <span
                    key={s}
                    className={`block h-[2px] rounded-full transition-all duration-400 ${
                      stage === s
                        ? 'w-10 bg-[#4a9d72]'
                        : reached
                          ? 'w-6 bg-[#4a9d72]/55'
                          : 'w-4 bg-white/12'
                    }`}
                  />
                )
              })}
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/45 ml-1">
                {stage === 'plaque'
                  ? 'Tee'
                  : stage === 'sheet'
                    ? 'Sheet'
                    : 'On the Green'}
              </span>
            </div>
          </div>

          {/* RIGHT — the visual swaps per stage. */}
          <div className="relative min-h-[300px] flex items-start justify-center">
            <AnimatePresence mode="wait">
              {stage === 'plaque' && <HolePlaque key="vis-plaque" />}
              {stage === 'sheet' && (
                <TeeSheet
                  key="vis-sheet"
                  rounds={visibleRounds}
                  onPick={(r) => {
                    setPickedRound(r)
                    setStage('on-green')
                  }}
                />
              )}
              {stage === 'on-green' && <FlagstickGreen key="vis-green" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Stage 1 visual — a refined navy plaque with a single gold rule. No
// gradient noise, no bevel stack — just type + spacing.
function HolePlaque() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.48, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
      style={{
        width: '360px',
        padding: '44px 38px',
        background: '#0a1628',
        borderRadius: '10px',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.06) inset, 0 28px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,168,75,0.4)',
      }}
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c8a84b] mb-6">
        Hole&nbsp;I
      </p>

      <p
        className="text-center text-[#f4e3b8] text-[28px] leading-none"
        style={{
          fontFamily: 'var(--font-playfair)',
          letterSpacing: '0.08em',
        }}
      >
        PENN GOLF
      </p>

      <p
        className="text-center text-[12px] italic text-[#c8a84b]/80 mt-3"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Founded 1894
      </p>

      <div
        className="mx-auto mt-6"
        style={{
          width: '60px',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(200,168,75,0.7) 50%, transparent)',
        }}
      />

      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/75 mt-5">
        Par 4 · 415 Yards
      </p>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Stage 2 visual — cream paper scorecard. Drop the v1 red banner; the
// header is now a quiet navy strip, in keeping with the rest of the
// Clubhouse palette.
function TeeSheet({
  rounds,
  onPick,
}: {
  rounds: GatheringData[]
  onPick: (r: GatheringData) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.48, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
      style={{
        width: '460px',
        background: '#faf6ec',
        borderRadius: '4px',
        boxShadow:
          '0 28px 60px rgba(20,30,50,0.24), 0 6px 12px rgba(20,30,50,0.10), inset 0 0 0 1px rgba(180,160,120,0.4)',
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: '#0a1628', color: '#f4e3b8' }}
      >
        <p
          className="text-[15px] tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          THE TEE SHEET
        </p>
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-70">
          Open Times
        </p>
      </div>

      <ul className="divide-y divide-[rgba(120,100,70,0.18)]">
        {rounds.length === 0 ? (
          <li className="px-6 py-8 text-center">
            <p className="text-[13.5px] text-[#5a4732] italic">
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
                  className="w-full text-left px-6 py-4 hover:bg-[#f0e8d4] transition-colors group"
                >
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-[11px] font-semibold text-[#0a1628] w-5"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[16px] text-[#2c1f0e] leading-snug truncate"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {g.title}
                      </p>
                      {meta && (
                        <p className="text-[12.5px] text-[#5a4732] mt-0.5 truncate">
                          {meta}
                        </p>
                      )}
                    </div>
                    <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#0a1628] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity whitespace-nowrap">
                      Pick →
                    </span>
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ul>

      <div className="px-6 py-3 text-[10.5px] italic text-[#7a6448] text-center border-t border-[rgba(120,100,70,0.2)]">
        Signed at the first tee, Penn Men&rsquo;s Golf
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Stage 3 visual — a refined green with flagstick. Cleaner SVG: removed
// the grain blur, lightened the contour line, and quieted the
// confirmation stamp.
function FlagstickGreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
    >
      <svg viewBox="0 0 360 300" className="w-[400px] h-auto" aria-hidden>
        <defs>
          <radialGradient id="greenGrad-v2" cx="55%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#5a8a55" />
            <stop offset="55%" stopColor="#3f6a3a" />
            <stop offset="100%" stopColor="#2b4d28" />
          </radialGradient>
        </defs>

        {/* Soft ground shadow */}
        <ellipse cx="180" cy="230" rx="160" ry="20" fill="#1a2c1a" opacity="0.15" />

        {/* The green */}
        <path
          d="M 60 145 Q 50 110 95 90 Q 145 75 195 85 Q 260 95 295 130 Q 315 170 285 200 Q 240 225 170 220 Q 100 215 70 190 Q 50 170 60 145 Z"
          fill="url(#greenGrad-v2)"
          stroke="#26421f"
          strokeWidth="0.8"
        />

        {/* Subtle contour */}
        <path
          d="M 100 170 Q 155 180 220 162 Q 250 152 268 162"
          fill="none"
          stroke="#2a4d24"
          strokeWidth="0.6"
          strokeDasharray="3 5"
          opacity="0.45"
        />

        {/* Flagstick shadow */}
        <line
          x1="186"
          y1="155"
          x2="172"
          y2="65"
          stroke="#1a2c1a"
          strokeWidth="2.4"
          opacity="0.22"
        />
        {/* Flagstick */}
        <line x1="183" y1="155" x2="183" y2="55" stroke="#1a1612" strokeWidth="1.5" />
        {/* Flag — subtle wave */}
        <motion.path
          d="M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z"
          fill="#c8a84b"
          animate={{
            d: [
              'M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z',
              'M 183 55 L 221 58 L 219 68 L 221 78 L 183 78 Z',
              'M 183 55 L 220 60 L 217 70 L 220 80 L 183 78 Z',
            ],
          }}
          transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity }}
        />
        {/* Hole */}
        <ellipse cx="183" cy="155" rx="4" ry="2.2" fill="#0a1612" />
      </svg>

      {/* Refined confirmation label — no tilted ink stamp, just a clean
          navy + gold tag below the SVG. */}
      <div className="flex items-center justify-center mt-3 gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c8a84b]" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
          On the sheet
        </p>
        <span className="w-1.5 h-1.5 rounded-full bg-[#c8a84b]" />
      </div>
    </motion.div>
  )
}
