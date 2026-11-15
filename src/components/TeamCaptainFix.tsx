'use client'

/**
 * "She captained in 2004 and 2005."
 *
 * Melissa Maurer sent five captaincies in one email and there was nowhere
 * to put them, so they became prose in a source note that no page renders.
 * This is the place to put them.
 *
 * Two modes, and the difference matters. A founder sets a captaincy and it
 * is true immediately. A member asks, and a human agrees before the card
 * says it: a card reading "Team Captain" because its owner typed it would
 * be worth nothing to the people reading it. But a member is frequently the
 * only source there will ever be, so the ask has to exist. Penn printed no
 * captain for the men's 1983-91 club seasons at all.
 *
 * Years are season-END years, the convention everywhere in the Member Book:
 * 2005 is the 2004-05 season. The field takes a list, not a span, because
 * two captaincies in a row is a fact about two seasons.
 */

import { useState } from 'react'
import { formatCaptainSeasons, captainSentence } from '@/lib/member-book/team-captains'

export default function TeamCaptainFix({
  memberId,
  currentYears,
  currentShared,
  currentNote,
  /** Founder mode: applies straight away, on any card. */
  admin = false,
}: {
  memberId: string
  currentYears: readonly number[]
  currentShared?: boolean
  currentNote?: string
  admin?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [years, setYears] = useState(currentYears.join(', '))
  const [shared, setShared] = useState(!!currentShared)
  const [note, setNote] = useState(currentNote ?? '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hadOne = currentYears.length > 0 || !!currentNote

  // "2004, 2005" or "2004 2005" or "2004,2005" — all the same thing.
  const parsed = years
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number)
  const preview = formatCaptainSeasons(parsed)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/player/team-captain', {
        method: admin ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          years: parsed,
          shared,
          note,
          ...(admin ? { memberId } : {}),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? `Could not save that (${res.status})`)
      if (!admin) {
        setDone('Thanks. Ryan will check it against the records and your card will update.')
        return
      }
      setDone(typeof j?.warning === 'string' ? j.warning : 'Saved. Reloading the card…')
      // Server-rendered card: without the reload the captaincy is saved and
      // invisible, which reads exactly like a failure.
      setTimeout(() => window.location.reload(), j?.warning ? 2600 : 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="text-[12.5px] text-[#2d6a4f] mt-3" data-testid="captain-fix-done">
        {done}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
        data-testid="captain-fix-open"
      >
        {hadOne ? 'Edit team captaincy →' : 'Record a team captaincy →'}
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 bg-[#fdfcf9] border border-[rgba(180,168,150,0.5)] rounded-xl px-4 py-4"
      data-testid="captain-fix-form"
    >
      <p className="text-[12.5px] text-[#3d4a5c] mb-3 leading-relaxed">
        {admin ? (
          <>
            Captain of the team, not of the Clubhouse. This records a season and
            grants nobody any access. Years are the season each captaincy
            <em> ended</em>, so 2005 is the 2004-05 season.
          </>
        ) : (
          <>
            Which season did you captain? Give the spring it finished, so 2005
            means the 2004-05 season. Ryan checks it against Penn&rsquo;s records
            before it shows on your card, and for the seasons Penn never
            published you may be the only person who knows.
          </>
        )}
      </p>
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1 block">
          Seasons captained
        </span>
        <input
          type="text"
          value={years}
          onChange={e => setYears(e.target.value)}
          placeholder="2004, 2005"
          inputMode="numeric"
          className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
        />
      </label>
      <label className="flex items-start gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={shared}
          onChange={e => setShared(e.target.checked)}
          className="mt-[3px] accent-[#990000]"
        />
        <span className="text-[12.5px] text-[#3d4a5c] leading-relaxed">
          Co-captain, one of two or more that season. Penn has used
          co-captains for most of its history.
        </span>
      </label>
      <p className="text-[12px] text-ink-muted mt-2">
        {parsed.length > 0 || shared
          ? `Reads as: ${captainSentence(parsed, shared)}`
          : 'Leave the years empty if somebody remembers the captaincy but not the year, and say so below.'}
      </p>
      <label className="block mt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1 block">
          Who said so, and what is uncertain
        </span>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 500))}
          placeholder="Melissa Maurer, women's captain 2004 and 2005"
          className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
        />
      </label>
      {error && <p className="text-[12.5px] text-[#990000] mt-2.5">{error}</p>}
      <div className="flex items-center gap-3 mt-3.5">
        <button
          type="submit"
          // Empty + empty is a withdrawal, which is only meaningful when
          // there is something to withdraw.
          disabled={busy || (parsed.length === 0 && !note.trim() && !hadOne)}
          className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy ? 'Saving…' : admin ? 'Save captaincy' : 'Send to Ryan'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11.5px] text-ink-muted hover:text-[#0a1628]"
        >
          Cancel
        </button>
      </div>
      {hadOne && admin && (
        <p className="text-[11.5px] text-ink-muted mt-3 leading-relaxed">
          Clearing both fields removes the captaincy from the card, including
          one matched from Penn&rsquo;s published list.
        </p>
      )}
    </form>
  )
}
