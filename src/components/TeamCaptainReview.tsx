'use client'

/**
 * A member said they captained. Someone has to agree.
 *
 * Sits on the card itself rather than in a queue, because the card is where
 * the evidence is: the years, the letter seasons, the program, and whatever
 * Penn's published list already says. A reviewer looking at a list of names
 * has none of that.
 */

import { useState } from 'react'
import { formatCaptainSeasons, captainSentence } from '@/lib/member-book/team-captains'

export default function TeamCaptainReview({
  captaincyId,
  requestedByName,
  years,
  shared,
  note,
}: {
  captaincyId: string
  requestedByName: string
  years: readonly number[]
  shared?: boolean
  note?: string
}) {
  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function review(approve: boolean) {
    setBusy(approve ? 'approve' : 'decline')
    setError(null)
    try {
      const res = await fetch('/api/player/team-captain', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captaincyId, approve }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? `Could not do that (${res.status})`)
      setDone(approve ? 'Approved. Reloading the card…' : 'Declined.')
      if (approve) setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not do that')
    } finally {
      setBusy(null)
    }
  }

  if (done) {
    return (
      <p className="text-[12.5px] text-[#2d6a4f] mt-3" data-testid="captain-review-done">
        {done}
      </p>
    )
  }

  return (
    <div
      className="mt-4 bg-[#fdfcf9] border border-[#c8a84b]/50 rounded-xl px-4 py-4"
      data-testid="captain-review"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#990000] mb-2">
        Needs your yes
      </p>
      <p className="text-[13.5px] text-[#0a1628] leading-relaxed">
        {requestedByName} says they captained the team
        {formatCaptainSeasons(years) ? ` in ${formatCaptainSeasons(years)}` : ''}.
      </p>
      {note && (
        <p className="text-[12.5px] text-[#3d4a5c] leading-relaxed mt-1.5 italic">
          &ldquo;{note}&rdquo;
        </p>
      )}
      <p className="text-[12px] text-ink-muted mt-2">
        Approving puts {captainSentence(years, shared).replace(/\.$/, '')} on this
        card, above the Penn record if there is one.
      </p>
      {error && <p className="text-[12.5px] text-[#990000] mt-2.5">{error}</p>}
      <div className="flex items-center gap-3 mt-3.5">
        <button
          type="button"
          onClick={() => review(true)}
          disabled={busy !== null}
          className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => review(false)}
          disabled={busy !== null}
          className="text-[11.5px] text-ink-muted hover:text-[#990000] disabled:opacity-50"
        >
          {busy === 'decline' ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </div>
  )
}
