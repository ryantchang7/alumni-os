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
import SectionEmblemHeader from '@/components/SectionEmblemHeader'
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
  // The two rooms with no framed emblem of their own. The Team Room takes the
  // Quaker; Guided Ask takes a question mark set in the same gold-on-dark
  // frame, so the column has a mark on every row rather than two blanks.
  '/team-room': '/emblems/team-room.png',
  '/ask': '/emblems/ask.png',
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
      {/* Hero.
          Built from the same SectionEmblemHeader every other room uses, so the
          public page reads as the same club rather than a different product.
          It runs 'generous' because it is the front door, but the parts, the
          eyebrow, the serif title, the gold rule and the art on the right, are
          identical to the Member Book and The Course. */}
      <SectionEmblemHeader
        eyebrow={heroEyebrow}
        title={HERO_TITLE}
        subtitle={heroSubtitle}
        emblemSrc="/brand/quaker-swing.png"
        emblemAlt="Penn Golf Quaker, mid follow-through"
        maxWidth="1180px"
        size="generous"
      >
        <p className="text-white/70 text-[14.5px] sm:text-base max-w-2xl leading-relaxed mb-7">
          {heroBody}
        </p>
        <ProofStrip variant="founded" className="mb-7" />
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md sm:max-w-none"
          initial={{ opacity: 0, y: 8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ delay: 0.3, duration: 0.6, ease }}
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
        <p className="mt-7 inline-flex items-center eyebrow text-gold">
          {tagline}
        </p>
      </SectionEmblemHeader>

      {/* The film, server-rendered by page.tsx so a slow or failed
          /api/site-content call can never silently delete it. */}
      {film}

      {/* Founder note */}
      <section className="px-5 sm:px-8 py-12 sm:py-16">
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
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
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
      <section className="bg-[#0a1628]/[0.03] border-y border-[rgba(180,168,150,0.4)] px-5 sm:px-8 py-12 sm:py-16">
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
      <section className="px-5 sm:px-8 py-12 sm:py-16">
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

      {/* Who built this. Deliberately small and near the end: the page argues
          for the Clubhouse first, and only then says who is behind it. A face
          and a hometown do more for trust here than another paragraph. */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-[720px] mx-auto">
          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/ryan-chang.jpg"
              alt="Ryan Chang"
              width={733}
              height={1100}
              loading="lazy"
              className="w-28 sm:w-32 flex-shrink-0 rounded-xl object-cover aspect-[3/4] border border-[rgba(180,168,150,0.45)]"
            />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#990000] mb-2">
                Who built this
              </p>
              <p className="text-[#0a1628] text-xl font-medium font-heading">
                Ryan Chang
              </p>
              <p className="text-[12.5px] text-ink-muted mb-3">
                Penn Men&rsquo;s Golf &rsquo;28 · Brookline, Massachusetts
              </p>
              <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed">
                I built the Clubhouse over the past year, on my own. There was no
                way for a Penn golfer from 1994 and one from 2026 to find each
                other, and that seemed like the wrong way for a program with this
                much history to work. If you carried the bag, this is yours too.
              </p>
              <a
                href="mailto:rtchang@upenn.edu"
                className="inline-block text-[12.5px] font-semibold text-[#990000] hover:underline mt-3"
              >
                rtchang@upenn.edu
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[#0a1628] text-white px-5 sm:px-8 pt-14 pb-28 sm:pt-16 sm:pb-36 relative overflow-hidden">
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
