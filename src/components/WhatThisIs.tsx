'use client'

/**
 * What the Clubhouse actually is, for someone who has never heard of it.
 *
 * An alum now arrives here from a text message sent by an old teammate, and
 * what met them was their own roster line and a button saying "Is this you?
 * Sign in to claim your card." That is the whole explanation they got: it
 * never said what the thing was, what claiming meant, or why they would
 * bother. The invite loop leaked at the last step.
 *
 * Four steps, in the order they happen, in the shortest words that still
 * say the thing. An earlier draft explained at length that this "is the part
 * a group chat and an alumni directory both fail at" and claimed most people
 * find three or four teammates they had lost track of, which nobody had
 * measured. Both are gone. An alum deciding whether to bother reads two
 * lines, not an essay.
 *
 * The animation is there to make the order legible one step at a time rather
 * than to decorate: the gold rail draws down as the steps arrive, and the
 * whole thing holds still for anyone who asked their system not to animate.
 */

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { PlayCircle } from 'lucide-react'

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Your card is already here',
    body: 'We built it from Penn\u2019s own records, going back to 1930. Nothing to fill out. You just say it\u2019s you.',
  },
  {
    title: 'Claiming takes a minute',
    body: 'Sign in, pick your card. Ryan Chang reviews it by hand, usually the same day.',
  },
  {
    title: 'See who you played with',
    body: 'We match your roster years against everyone else\u2019s, so you get the list of your teammates who are already in.',
  },
  {
    title: 'Ask them for something',
    body: 'An intro. Advice on a job. A round when you\u2019re in their city.',
  },
]

export default function WhatThisIs({
  /** Tightens the padding for use inside an existing card. */
  inset = false,
}: {
  inset?: boolean
}) {
  const still = useReducedMotion()

  return (
    <section
      className={
        inset
          ? 'px-7 sm:px-10 py-9 bg-[#0a1628] text-white'
          : 'bg-[#0a1628] text-white rounded-2xl px-7 sm:px-10 py-9'
      }
      data-testid="what-this-is"
    >
      <p className="eyebrow text-[#c8a84b] mb-3">What this is</p>
      <h2 className="text-white text-2xl sm:text-[28px] font-medium font-heading leading-tight max-w-[24ch]">
        Every Penn golfer, one place.
      </h2>
      <p className="text-white/60 text-[13.5px] leading-relaxed mt-3 max-w-[58ch]">
        Not a directory. The people you actually played with.
      </p>

      <div className="relative mt-8 pl-7">
        {/* The rail, drawn top to bottom as the steps land. */}
        <motion.span
          aria-hidden
          className="absolute left-[7px] top-1 bottom-1 w-[2px] origin-top bg-gradient-to-b from-[#c8a84b] via-[#c8a84b]/60 to-transparent"
          initial={still ? { scaleY: 1 } : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={still ? { duration: 0 } : { duration: 1.1, ease: 'easeOut' }}
        />

        <ol className="space-y-6">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              className="relative"
              initial={still ? { opacity: 1 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={
                still ? { duration: 0 } : { duration: 0.45, delay: 0.18 + i * 0.16 }
              }
            >
              <span
                aria-hidden
                className="absolute -left-7 top-[5px] w-[15px] h-[15px] rounded-full bg-[#0a1628] border-2 border-[#c8a84b] flex items-center justify-center"
              />
              <p className="text-white text-[15px] font-medium font-heading leading-snug">
                {step.title}
              </p>
              <p className="text-white/60 text-[13px] leading-relaxed mt-1 max-w-[62ch]">
                {step.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c8a84b] hover:text-white transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Rather watch? See the film
        </Link>
        <Link
          href="/member-book"
          className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/50 hover:text-white transition-colors"
        >
          Browse the Member Book &rarr;
        </Link>
      </div>
    </section>
  )
}
