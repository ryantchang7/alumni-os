'use client'

/**
 * Public launch page. Shareable. The one URL that introduces Penn Golf
 * Clubhouse to anyone who hasn't claimed yet. Pulls every piece of
 * copy from src/lib/launch-kit/content.ts so the kit page, the
 * teleprompter, and this page stay in lockstep.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import ProofStrip from '@/components/ProofStrip'
import {
  HERO_TITLE,
  HERO_SUBTITLE,
  HERO_BODY,
  TAGLINE,
  FOUNDER_NOTE,
  ACCESS_LINE,
  ACCESS_STEPS,
  CLOSING_LINE,
  ROOM_CARDS,
  FEATURE_WALKTHROUGH,
} from '@/lib/launch-kit/content'

const ease = [0.25, 0.1, 0.25, 1] as const

/** Room emblems in /public/emblems, keyed by the route they belong to. */
const ROOM_EMBLEM: Record<string, string> = {
  '/member-book': '/emblems/member-book.png',
  '/member-map': '/emblems/member-map.png',
  '/the-course': '/emblems/course.png',
  '/19th-hole': '/emblems/19th-hole.png',
  '/moments': '/emblems/moments.png',
  '/career-room': '/emblems/career-room.png',
}

const ROOM_ACCENT: Record<string, string> = {
  Ask: '#990000',
  Meet: '#b8860b',
  Play: '#2d6a4f',
  Gather: '#0a1628',
}

export default function LaunchClient({ film }: { film: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  // All copy is editable from /internal/studio — defaults match content.ts.
  const heroEyebrow = useSiteContent('launch.hero-eyebrow', "Penn Men's Golf · Clubhouse")
  const heroSubtitle = useSiteContent('launch.hero-subtitle', HERO_SUBTITLE)
  const heroBody = useSiteContent('launch.hero-body', HERO_BODY)
  const tagline = useSiteContent('launch.tagline', TAGLINE)
  const founderNote = useSiteContent('launch.founder-note', FOUNDER_NOTE)
  const accessLine = useSiteContent('launch.access-line', ACCESS_LINE)
  const closingLine = useSiteContent('launch.closing-line', CLOSING_LINE)
  const askBlurb = useSiteContent('launch.ask-blurb', ROOM_CARDS[0].blurb)
  const meetBlurb = useSiteContent('launch.meet-blurb', ROOM_CARDS[1].blurb)
  const playBlurb = useSiteContent('launch.play-blurb', ROOM_CARDS[2].blurb)
  const gatherBlurb = useSiteContent('launch.gather-blurb', ROOM_CARDS[3].blurb)
  const roomBlurbBy: Record<string, string> = {
    Ask: askBlurb,
    Meet: meetBlurb,
    Play: playBlurb,
    Gather: gatherBlurb,
  }

  return (
    <div className="bg-[#fbf9f6] min-h-[calc(100dvh-60px)]">
      {/* Hero */}
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 pt-20 pb-44 sm:pt-28 sm:pb-56 relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto relative z-10">
          <motion.p
            className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70 mb-5"
            initial={{ opacity: 0, y: 8 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
          >
            {heroEyebrow}
          </motion.p>
          <motion.h1
            className="text-white text-5xl sm:text-6xl lg:text-[5.5rem] font-medium tracking-tight leading-[1.02] mb-5 max-w-3xl font-heading"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ delay: 0.25, duration: 0.85, ease }}
          >
            {HERO_TITLE}
          </motion.h1>
          <motion.p
            className="font-heading text-white/85 text-xl sm:text-2xl max-w-2xl leading-snug mb-5"
            style={{ fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: 0.45, duration: 0.7, ease }}
          >
            {heroSubtitle}
          </motion.p>
          <motion.p
            className="text-white/75 text-[14.5px] sm:text-base max-w-2xl leading-relaxed mb-9"
            initial={{ opacity: 0, y: 8 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: 0.6, duration: 0.7, ease }}
          >
            {heroBody}
          </motion.p>
          <ProofStrip className="mb-9 max-w-2xl" />

          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md sm:max-w-none"
            initial={{ opacity: 0, y: 8 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: 0.75, duration: 0.6, ease }}
          >
            <Link
              href="/player"
              className="inline-flex items-center justify-center bg-[#f5f0e8] text-[#0a1628] font-semibold text-sm px-7 py-3.5 rounded-lg hover:bg-white transition-colors tracking-wide"
            >
              Enter the Clubhouse
            </Link>
            <Link
              href="/account/setup"
              className="inline-flex items-center justify-center border border-white/40 text-white font-semibold text-sm px-7 py-3.5 rounded-lg hover:bg-white/10 hover:border-white/60 transition-colors tracking-wide"
            >
              Claim Your Member Card
            </Link>
          </motion.div>

          <motion.p
            // Sits over the artwork, so it carries its own tint rather than
            // relying on whatever happens to be behind it.
            className="mt-10 inline-flex items-center text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/80 px-3.5 py-2 border border-white/20 rounded-full bg-[#0a1628]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.05, duration: 0.7, ease }}
          >
            {tagline}
          </motion.p>
        </div>

        {/* Subtle radial in the corner, adds depth behind the artwork */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            right: '-10%',
            width: '60%',
            height: '120%',
            background: 'radial-gradient(ellipse at center, rgba(245,240,232,0.06) 0%, transparent 65%)',
          }}
        />

        {/* The Clubhouse lockup, sitting on the bottom edge as a horizon. It is
            navy line art on a near-navy ground, so it reads as depth behind the
            words rather than as a picture pasted on top of them. Masked off at
            the top so it dissolves into the hero instead of ending on a line. */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none" aria-hidden="true">
          <picture>
            <source srcSet="/brand/lockup-scene.webp" type="image/webp" media="(min-width: 768px)" />
            <source srcSet="/brand/lockup-scene-900.webp" type="image/webp" />
            <img
              src="/brand/lockup-scene.png"
              alt=""
              className="w-full h-auto opacity-[0.34]"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 22%, #000 62%, #000 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, transparent 22%, #000 62%, #000 100%)',
              }}
            />
          </picture>
        </div>
      </section>

      {/* The film, server-rendered by page.tsx so a slow or failed
          /api/site-content call can never silently delete it. */}
      {film}

      {/* Founder note */}
      <section className="px-5 sm:px-8 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-5">
            A note from the founder
          </p>
          <div
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-8 sm:px-10 sm:py-12"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.05)' }}
          >
            {founderNote.split('\n\n').map((para, i) => {
              const isSig = para.startsWith('. ')
              return (
                <p
                  key={i}
                  className={
                    isSig
                      ? 'text-[13px] text-ink-muted mt-6 italic'
                      : 'text-[15px] sm:text-base text-[#0a1628] leading-relaxed mb-4 last:mb-0'
                  }
                  style={isSig ? undefined : { fontFamily: 'var(--font-source-serif, var(--font-playfair))' }}
                >
                  {para}
                </p>
              )
            })}
          </div>
        </div>
      </section>

      {/* Four-room cards: Ask / Meet / Play / Gather */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-24">
        <div className="max-w-[1180px] mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-3">
              How the Clubhouse works
            </p>
            <h2
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading"
            >
              {tagline}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {ROOM_CARDS.map(room => {
              const accent = ROOM_ACCENT[room.title]
              return (
                <div
                  key={room.title}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6 flex flex-col"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 6px 16px rgba(10,22,40,0.05)' }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3"
                    style={{ color: accent }}
                  >
                    {room.title}
                  </p>
                  <h3
                    className="text-[#0a1628] text-2xl font-medium mb-2 font-heading"
                  >
                    {room.title}.
                  </h3>
                  <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-4">
                    {roomBlurbBy[room.title] ?? room.blurb}
                  </p>
                  <ul className="text-[12.5px] text-ink-muted space-y-1 mb-5">
                    {room.examples.map((ex, i) => (
                      <li key={i} className="italic">{ex}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4 border-t border-[rgba(180,168,150,0.35)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      Surfaces
                    </p>
                    <p className="text-[12.5px] text-[#0a1628] mt-1">
                      {room.surfaces.join(' · ')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature walkthrough */}
      <section className="bg-[#0a1628]/[0.03] border-y border-[rgba(180,168,150,0.4)] px-5 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1180px] mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-3">
              Inside the Clubhouse
            </p>
            <h2
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium font-heading"
            >
              What&rsquo;s inside.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {FEATURE_WALKTHROUGH.map(f => (
              <Link
                key={f.label}
                href={f.href}
                className="group bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 flex items-start justify-between gap-4 hover:border-[#0a1628]/50 transition-colors"
              >
                {/* The room's own emblem, so the list reads as places rather
                    than as another set of links. Rooms without a crest yet get
                    the pennant, which keeps every row's text on the same
                    indent instead of leaving ragged gaps down the column. */}
                <img
                  src={ROOM_EMBLEM[f.href] ?? '/brand/pennant.svg'}
                  alt=""
                  aria-hidden="true"
                  className="w-11 h-11 shrink-0 object-contain opacity-90 mt-0.5 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[#0a1628] font-medium text-[15px] mb-0.5 font-heading">
                    {f.label}
                  </p>
                  <p className="text-[12.5px] text-ink-muted leading-snug">
                    {f.blurb}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#990000] whitespace-nowrap mt-0.5 group-hover:translate-x-0.5 transition-transform">
                  Open &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How access works */}
      <section className="px-5 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-muted mb-3">
              How access works
            </p>
            <h2
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium mb-3 font-heading"
            >
              How you get in.
            </h2>
            <p className="text-[14.5px] sm:text-[15px] text-[#3d4a5c] leading-relaxed max-w-2xl">
              {accessLine}
            </p>
          </div>
          {/* Two doors, said plainly and first.
              Step one used to be "find your name in the Member Book", which is
              only true if you played. Parents, family and friends of the
              program are not in the book, so that instruction sent them
              hunting for a name that was never going to be there. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Link
              href="/member-book"
              className="group bg-[#0a1628] text-white rounded-2xl px-7 py-7 block hover:bg-[#112240] transition-colors"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#c8a84b] mb-3">
                If you played for Penn
              </p>
              <p className="text-xl font-medium mb-2 font-heading">
                Your name is already in the book.
              </p>
              <p className="text-[13.5px] text-white/70 leading-relaxed mb-4">
                Find yourself in the Member Book and hit claim. That is the whole
                thing. It takes about thirty seconds.
              </p>
              <span className="text-[12px] font-semibold text-[#c8a84b] group-hover:underline">
                Find your name &rarr;
              </span>
            </Link>

            <Link
              href="/parent-signup"
              className="group bg-white border border-[rgba(180,168,150,0.5)] rounded-2xl px-7 py-7 block hover:border-[#0a1628]/50 transition-colors"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
                If you are family or a friend of the program
              </p>
              <p className="text-[#0a1628] text-xl font-medium mb-2 font-heading">
                You will not be in the book, and that is fine.
              </p>
              <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-4">
                Parents, family, and longtime supporters have their own signup.
                Tell us who you are and how you are connected, and you get your
                own card.
              </p>
              <span className="text-[12px] font-semibold text-[#990000] group-hover:underline">
                Sign up as family &rarr;
              </span>
            </Link>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACCESS_STEPS.map(step => (
              <li
                key={step.step}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-6 py-7"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-3">
                  Step {step.step}
                </p>
                <p
                  className="text-[#0a1628] text-xl font-medium mb-2 font-heading"
                >
                  {step.label}
                </p>
                <p className="text-[13px] text-[#3d4a5c] leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 pt-20 pb-40 sm:pt-24 sm:pb-52 relative overflow-hidden">
        {/* Keeps the outlined buttons readable wherever the artwork happens to
            sit behind them. */}
        <div
          className="absolute inset-x-0 top-0 h-[62%] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 100% at 50% 40%, rgba(10,22,40,0.92) 0%, rgba(10,22,40,0.55) 60%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        <div className="max-w-[860px] mx-auto text-center relative z-10">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-white/70 mb-4">
            For the Penn Golf family
          </p>
          <h2
            className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-8 font-heading"
          >
            {closingLine}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none sm:justify-center">
            <Link
              href="/player"
              className="inline-flex items-center justify-center bg-[#f5f0e8] text-[#0a1628] font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-white transition-colors tracking-wide"
            >
              Enter the Clubhouse
            </Link>
            <Link
              href="/account/setup"
              className="inline-flex items-center justify-center border border-white/40 text-white font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-white/10 hover:border-white/60 transition-colors tracking-wide"
            >
              Claim Your Member Card
            </Link>
            <Link
              href="/member-book"
              className="inline-flex items-center justify-center text-white/75 hover:text-white font-medium text-sm px-8 py-3.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors tracking-wide"
            >
              Browse the Member Book
            </Link>
          </div>
          <p className="mt-10 eyebrow text-gold">
            {tagline}
          </p>
        </div>

        {/* Bookend: the same horizon the page opened on, so it closes where it
            started. Fainter here, because this section is the call to act and
            the buttons have to stay the brightest thing on it. */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none" aria-hidden="true">
          <picture>
            <source srcSet="/brand/lockup-scene.webp" type="image/webp" media="(min-width: 768px)" />
            <source srcSet="/brand/lockup-scene-900.webp" type="image/webp" />
            <img
              src="/brand/lockup-scene.png"
              alt=""
              className="w-full h-auto opacity-[0.20]"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 34%, #000 74%, #000 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, transparent 34%, #000 74%, #000 100%)',
              }}
            />
          </picture>
        </div>
      </section>
    </div>
  )
}
