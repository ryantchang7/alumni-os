'use client'

/**
 * Your own card, as other members see it.
 *
 * Eighteen members have claimed a card and four have put anything on one. The
 * Member Book is where that costs something: a member browses 404 people,
 * finds most of them are a name and a class year, and leaves with nothing.
 * The fix is to show them their own card is one of those, at the moment they
 * are looking at everyone else's.
 *
 * Deliberately not another checklist. It names the specific missing pieces,
 * disappears the moment the card is complete, and can be dismissed for good.
 *
 * It used to link into the editor, which is a thousand-line form on another
 * page, and almost nobody came back from it. The three fields it is asking
 * for now open in place.
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import QuickProfileForm from './QuickProfileForm'

const DISMISS_KEY = 'pgProfileNudgeDismissed'

interface Status {
  linked?: boolean
  personId?: string | null
  teamSlug?: string | null
  hasPhoto?: boolean
  hasRole?: boolean
  hasCity?: boolean
  hasBio?: boolean
}

export default function ProfileNudge() {
  const [status, setStatus] = useState<Status | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
    fetch('/api/account/onboarding-status', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setStatus(d ?? null))
      .catch(() => {})
  }, [])

  if (dismissed || !status?.linked || done) return null

  const missing = [
    { done: status.hasPhoto, label: 'a photo' },
    { done: status.hasRole, label: 'what you do now' },
    { done: status.hasCity, label: 'your city' },
    { done: status.hasBio, label: 'a line about yourself' },
  ].filter(x => !x.done)

  if (missing.length === 0) return null

  const labels = missing.map(m => m.label)
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`

  const close = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* a viewer with storage blocked just sees it again next time */
    }
  }

  return (
    <section
      className="mb-7 relative bg-white border border-[#c8a84b]/40 rounded-xl px-5 sm:px-6 py-5"
      style={{ boxShadow: '0 1px 3px rgba(200,168,75,0.14), 0 4px 12px rgba(10,22,40,0.04)' }}
      data-testid="profile-nudge"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-[#b0a898] hover:text-[#0a1628] transition-colors rounded p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8a84b] mb-2">
        Your card
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
        <p className="text-[14px] text-[#3d4a5c] leading-relaxed max-w-[62ch]">
          You are in the book, but your card is still missing {list}. It is what
          another member sees before they decide whether to reach out.
        </p>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap text-left"
          >
            Fill it in here &rarr;
          </button>
        )}
      </div>

      {open && status.personId && (
        <div className="mt-5 pt-5 border-t border-[#c8a84b]/25">
          <QuickProfileForm
            personId={status.personId}
            teamSlug={status.teamSlug ?? 'penn-mens-golf'}
            onDone={() => setTimeout(() => setDone(true), 1800)}
          />
        </div>
      )}
    </section>
  )
}
