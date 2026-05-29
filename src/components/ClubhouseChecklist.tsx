'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

interface Step {
  done: boolean
  label: string
  helper: string
  cta: { href: string; label: string }
}

interface Props {
  hasCity: boolean
  hasAvailability: boolean
  hasFirstPost: boolean
}

const DISMISS_KEY = 'pgChecklistDismissed'

/**
 * First-week locker checklist that nudges newly claimed alumni to
 * complete three high-leverage profile actions. Auto-hides at 3/3 and
 * respects a localStorage dismissal so a user who actively closes it
 * doesn't see it again.
 *
 * Server caller is responsible for computing the three booleans and
 * gating mount on (signed in + linked person).
 */
export default function ClubhouseChecklist({
  hasCity,
  hasAvailability,
  hasFirstPost,
}: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (dismissed === null) return null

  const steps: Step[] = [
    {
      done: hasCity,
      label: 'Drop your city on your locker',
      helper: 'So alumni traveling through can find you.',
      cta: { href: '/account/profile', label: 'Set city' },
    },
    {
      done: hasAvailability,
      label: 'Mark one availability',
      helper: 'Coffee, a round, mentorship, or a warm intro.',
      cta: { href: '/account/profile', label: 'Set availability' },
    },
    {
      done: hasFirstPost,
      label: 'Drop one thing on the boards',
      helper: 'A Moment, a tee time, or an ask on the Career Room floor.',
      cta: { href: '/moments', label: 'Drop a Moment' },
    },
  ]
  const completed = steps.filter(s => s.done).length

  if (dismissed || completed === steps.length) return null

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  return (
    <div
      className="bg-white border border-[#c8a84b]/40 rounded-2xl px-6 py-6 sm:px-8 sm:py-7 relative"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 8px 20px rgba(200,168,75,0.10)' }}
      data-testid="clubhouse-checklist"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss checklist"
        className="absolute top-4 right-4 text-[#8a7f70] hover:text-[#0a1628] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
          Set up your locker
        </p>
        <p className="text-[11.5px] text-[#8a7f70] font-medium">
          {completed}/{steps.length}
        </p>
      </div>
      <p
        className="text-[#0a1628] text-lg sm:text-xl font-medium mb-5"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Three quick things and the Penn Golf family can find you.
      </p>
      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-center gap-4 py-2 border-b border-[rgba(180,168,150,0.22)] last:border-b-0"
          >
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                step.done
                  ? 'bg-[#2d6a4f] text-white'
                  : 'bg-[#f8f5f0] border border-[rgba(180,168,150,0.45)] text-[#8a7f70]'
              }`}
              aria-hidden
            >
              {step.done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[11px] font-semibold">{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[14px] leading-snug ${
                  step.done ? 'text-[#8a7f70] line-through' : 'text-[#0a1628] font-medium'
                }`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-[12px] text-[#8a7f70] mt-0.5">{step.helper}</p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.cta.href}
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                {step.cta.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
