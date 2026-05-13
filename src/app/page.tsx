'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const modes = [
  {
    label: 'Build',
    tagline: 'For team captains',
    description:
      'Import verified Penn Golf rosters going back to 2000. You approve, you publish. A live alumni network in minutes.',
    href: '/build',
    cta: 'Build the network',
    primary: true,
  },
  {
    label: 'Player Clubhouse',
    tagline: 'For current players',
    description:
      'Browse alumni by name, class, and hometown. See who is open to helping, and reach out through the team.',
    href: '/player',
    cta: 'Open Clubhouse',
    primary: false,
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
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 600], [0, 80])
  const imageScale = useTransform(scrollY, [0, 600], [1, 1.06])

  useEffect(() => {
    // Small delay so the animation fires after hydration
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-[#f8f5f0]">

      {/* ── Hero ── */}
      <div className="relative h-screen min-h-[600px] max-h-[1000px] overflow-hidden">

        {/* Parallax image */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ y: imageY, scale: imageScale }}
          initial={{ scale: 1.08 }}
          animate={ready ? { scale: 1.0 } : { scale: 1.08 }}
          transition={{ duration: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Image
            src="/hero.png"
            alt="Penn Golf Clubhouse"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>

        {/* Dark curtain that lifts */}
        <motion.div
          className="absolute inset-0 bg-[#0a1628]"
          initial={{ opacity: 0.72 }}
          animate={ready ? { opacity: 0.18 } : { opacity: 0.72 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />

        {/* Bottom gradient for card readability */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-20 px-6 text-center">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60 mb-4"
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: 1.2, duration: 0.7, ease: 'easeOut' }}
          >
            Penn Golf · Alumni OS
          </motion.p>

          <motion.h1
            className="text-white text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight max-w-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ delay: 1.45, duration: 0.75, ease: 'easeOut' }}
          >
            The private clubhouse<br />for Penn Golf.
          </motion.h1>

          <motion.p
            className="text-white/70 text-base sm:text-lg mt-4 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ delay: 1.7, duration: 0.7, ease: 'easeOut' }}
          >
            Verified alumni. Real connections. No cold outreach.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-8"
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ delay: 2.0, duration: 0.65, ease: 'easeOut' }}
          >
            <Link
              href="/player"
              className="text-sm font-semibold bg-white text-[#0a1628] px-7 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Enter Clubhouse
            </Link>
            <Link
              href="/alumni"
              className="text-sm font-semibold border border-white/40 text-white px-7 py-3 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              I&apos;m an alumnus
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.6, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Mode cards ── */}
      <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-14">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: 'easeOut' }}
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
