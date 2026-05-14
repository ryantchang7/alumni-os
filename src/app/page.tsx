'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const modes = [
  {
    label: 'Player Clubhouse',
    tagline: 'For current players',
    description:
      'Browse alumni by name, class, and hometown. See who is open to helping, and reach out through the team.',
    href: '/player',
    cta: 'Enter Clubhouse',
    primary: true,
  },
  {
    label: 'Alumni',
    tagline: 'For former players',
    description:
      'Update your profile, choose how you can help, and control when and how current players can reach you.',
    href: '/alumni',
    cta: 'Alumni login',
    primary: false,
  },
]

export default function LandingPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-[#f8f5f0]">

      {/* ── Hero ──
          Mobile:  aspect-[3/4]  → tall portrait, image cropped from top (shows logo + building)
          Desktop: aspect-[1344/896] → natural image ratio, nothing cropped               */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[1344/896]">

        <Image
          src="/hero.png"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top sm:object-center"
          alt="Penn Golf Clubhouse"
        />

        {/* Curtain that lifts on load */}
        <motion.div
          className="absolute inset-0 bg-[#0a1628]"
          initial={{ opacity: 0.68 }}
          animate={ready ? { opacity: 0 } : { opacity: 0.68 }}
          transition={{ duration: 2.6, ease: 'easeOut' }}
        />

        {/* Bottom gradient so text is always readable */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

        {/* Overlay text — sits above gradient at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 pb-[8%] sm:pb-[6%] flex flex-col items-center text-center px-5">

          <motion.p
            className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/55 mb-2 sm:mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 1.1, duration: 0.7, ease: 'easeOut' }}
          >
            Penn Golf · Alumni OS
          </motion.p>

          <motion.h1
            className="text-white text-[1.6rem] leading-tight sm:text-4xl md:text-5xl font-semibold tracking-tight max-w-[280px] sm:max-w-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ delay: 1.35, duration: 0.75, ease: 'easeOut' }}
          >
            The network for<br />Penn Golf players.
          </motion.h1>

          <motion.div
            className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-5 sm:mt-7 w-full max-w-[260px] sm:max-w-none sm:w-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: 1.75, duration: 0.65, ease: 'easeOut' }}
          >
            <Link
              href="/player"
              className="text-sm font-semibold bg-white text-[#0a1628] px-7 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-center"
            >
              Enter Clubhouse
            </Link>
            <Link
              href="/alumni"
              className="text-sm font-semibold border border-white/40 text-white px-7 py-3 rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              I&apos;m an alumnus
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-[800px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-10 sm:py-12">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className={`bg-white rounded-xl p-6 border ${
                mode.primary
                  ? 'border-l-4 border-l-[#990000] border-[rgba(180,168,150,0.35)]'
                  : 'border-[rgba(180,168,150,0.35)]'
              }`}
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
                {mode.tagline}
              </p>
              <p className="font-semibold text-[#0a1628] text-base mb-2">{mode.label}</p>
              <p className="text-sm text-[#4a5568] leading-relaxed mb-5">{mode.description}</p>
              <Link
                href={mode.href}
                className={`text-sm font-semibold ${
                  mode.primary
                    ? 'text-white bg-[#990000] hover:bg-[#b30000] px-4 py-2 rounded-lg transition-colors'
                    : 'text-[#990000] hover:underline'
                }`}
              >
                {mode.cta} &rarr;
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}
