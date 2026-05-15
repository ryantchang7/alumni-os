'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const ease = [0.25, 0.1, 0.25, 1] as const

export default function LandingPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden">

      {/* Background image */}
      <Image
        src="/clubhouse-cover.jpg"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        alt="Penn Golf Clubhouse"
        data-testid="cover-image"
      />

      {/* Navy overlay — lets the image breathe but grounds the text */}
      <div className="absolute inset-0 bg-[#0a1628]/40 pointer-events-none" />

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#0a1628]/70 via-[#0a1628]/25 to-transparent pointer-events-none" />

      {/* Curtain that lifts on load */}
      <motion.div
        className="absolute inset-0 bg-[#0a1628] pointer-events-none"
        initial={{ opacity: 1 }}
        animate={ready ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />

      {/* Content — centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-[12dvh] sm:pb-[10dvh] px-6 text-center">

        {/* Eyebrow */}
        <motion.p
          className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50 mb-4 sm:mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ delay: 0.9, duration: 0.7, ease }}
        >
          Welcome to the
        </motion.p>

        {/* Title — serif */}
        <motion.h1
          className="text-white text-[2.1rem] sm:text-5xl md:text-6xl leading-[1.1] tracking-tight mb-8 sm:mb-10"
          style={{ fontFamily: 'var(--font-playfair)', fontWeight: 500 }}
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ delay: 1.1, duration: 0.8, ease }}
          data-testid="landing-title"
        >
          Penn Golf Clubhouse
        </motion.h1>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-none sm:w-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ delay: 1.55, duration: 0.65, ease }}
        >
          <Link
            href="/player"
            data-testid="enter-clubhouse"
            className="text-sm font-semibold bg-[#f5f0e8] text-[#0a1628] px-8 py-3.5 rounded-lg hover:bg-white transition-colors shadow-lg text-center tracking-wide"
          >
            Enter Clubhouse
          </Link>
          <Link
            href="/player/search?teamSlug=penn-mens-golf"
            data-testid="claim-alumni-profile"
            className="text-sm font-semibold border border-white/35 text-white px-8 py-3.5 rounded-lg hover:bg-white/10 hover:border-white/55 transition-colors text-center tracking-wide"
          >
            Claim Alumni Profile
          </Link>
        </motion.div>

        {/* Footer line */}
        <motion.p
          className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30 mt-8"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.1, duration: 0.8, ease }}
          data-testid="private-member-network"
        >
          Private Member Network
        </motion.p>
      </div>
    </div>
  )
}
