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
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 relative overflow-hidden">
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
            className="mt-10 inline-flex items-center text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/70 px-3 py-1.5 border border-white/15 rounded-full"
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.05, duration: 0.7, ease }}
          >
            {tagline}
          </motion.p>
        </div>

        {/* Subtle radial in the corner, gives the hero some depth without an image */}
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
                <div className="min-w-0">
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
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 py-20 sm:py-24">
        <div className="max-w-[860px] mx-auto text-center">
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
      </section>
    </div>
  )
}
