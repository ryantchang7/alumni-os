'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useSiteContent } from '@/lib/site-content/use-site-content'

const ease = [0.25, 0.1, 0.25, 1] as const

export default function LandingPage() {
  const [ready, setReady] = useState(false)
  const coverImage = useSiteContent('landing.cover-image', '/clubhouse-cover.jpg')
  const headline = useSiteContent('landing.headline', 'Penn Golf Clubhouse')
  const subtitle = useSiteContent('landing.subtitle', '')

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-full h-[calc(100dvh-60px)] flex flex-col overflow-hidden bg-[#0a1628]">

      {/* Background image — full-bleed, clubhouse stays centered.
          Captain can swap via /internal/studio → "Landing cover image". */}
      <Image
        src={coverImage}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        alt="Penn Golf Clubhouse"
        data-testid="cover-image"
        unoptimized={!coverImage.startsWith('/')}
      />

      {/* Very light navy tint — preserves image brightness */}
      <div className="absolute inset-0 bg-[#0a1628]/18 pointer-events-none" />

      {/* Soft radial shadow behind text for legibility without darkening the image */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '640px',
          height: '340px',
          background: 'radial-gradient(ellipse at center, rgba(10,22,40,0.28) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Curtain that lifts on load */}
      <motion.div
        className="absolute inset-0 bg-[#0a1628] pointer-events-none"
        initial={{ opacity: 1 }}
        animate={ready ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />

      {/* Content — centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

        {/* Eyebrow */}
        <motion.p
          className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.35em] text-white/75 mb-5 sm:mb-6"
          style={{ textShadow: '0 1px 10px rgba(10,22,40,0.55)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ delay: 0.9, duration: 0.7, ease }}
        >
          Welcome to the
        </motion.p>

        {/* Title */}
        <motion.h1
          className="text-white text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] leading-[1.05] tracking-tight mb-6 sm:mb-8"
          style={{
            fontFamily: 'var(--font-playfair)',
            fontWeight: 500,
            textShadow: '0 2px 24px rgba(10,22,40,0.5), 0 1px 6px rgba(10,22,40,0.4)',
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ delay: 1.1, duration: 0.8, ease }}
          data-testid="landing-title"
        >
          {headline}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="text-white/85 text-sm sm:text-base max-w-md mb-10 sm:mb-12"
            style={{ textShadow: '0 1px 12px rgba(10,22,40,0.55)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: 1.3, duration: 0.7, ease }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Buttons — private-club stationery feel */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ delay: 1.55, duration: 0.65, ease }}
        >
          <Link
            href="/player"
            data-testid="enter-clubhouse"
            className="text-sm font-semibold bg-[#f5f0e8] text-[#0a1628] border border-[rgba(245,240,232,0.9)] px-10 py-3.5 rounded-lg hover:bg-white transition-colors shadow-lg text-center tracking-wide"
          >
            Enter Clubhouse
          </Link>
          <Link
            href="/login?next=/account/setup"
            data-testid="claim-alumni-profile"
            className="text-sm font-semibold border border-white/40 text-white/90 px-10 py-3.5 rounded-lg hover:bg-white/10 hover:border-white/60 transition-colors text-center tracking-wide"
          >
            Claim Alumni Profile
          </Link>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.8, duration: 0.7, ease }}
        >
          <Link
            href="/parent-signup"
            className="text-[12px] text-white/65 hover:text-white/95 transition-colors underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
          >
            Family or affiliate? Join here.
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
