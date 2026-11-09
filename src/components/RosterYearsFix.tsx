'use client'

/**
 * "I played 1999-2003, not 2000-2002."
 *
 * Peyton Wallace had to email Ryan to say that, and fixing it took a code
 * change. Nobody knows a member's playing years better than the member,
 * and the one place they will look for the mistake is their own card, so
 * the control lives there and nowhere else.
 *
 * It submits a request. It does not edit anything: a captain confirms,
 * and only then do the years change, on the card and in era matching
 * together.
 */

import { useState } from 'react'

export default function RosterYearsFix({
  currentStart,
  currentEnd,
}: {
  currentStart: number | null
  currentEnd: number | null
}) {
  const [open, setOpen] = useState(false)
  const [startYear, setStartYear] = useState(currentStart ? String(currentStart) : '')
  const [endYear, setEndYear] = useState(currentEnd ? String(currentEnd) : '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/player/roster-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear: Number(startYear),
          endYear: Number(endYear),
          note,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? `Could not send that (${res.status})`)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="text-[12.5px] text-[#2d6a4f] mt-3" data-testid="roster-fix-done">
        Thanks. Ryan will check it against the records and your card will update.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline"
        data-testid="roster-fix-open"
      >
        These years are wrong &rarr;
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 bg-[#fdfcf9] border border-[rgba(180,168,150,0.5)] rounded-xl px-4 py-4"
      data-testid="roster-fix-form"
    >
      <p className="text-[12.5px] text-[#3d4a5c] mb-3 leading-relaxed">
        Penn&rsquo;s published rosters do not go back as far as its letter
        records, so some spans here are short. Tell us the right years and
        Ryan will confirm them.
      </p>
      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1">
            First year
          </span>
          <input
            type="number"
            value={startYear}
            onChange={e => setStartYear(e.target.value)}
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            className="w-[104px] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1">
            Last year
          </span>
          <input
            type="number"
            value={endYear}
            onChange={e => setEndYear(e.target.value)}
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            className="w-[104px] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
          />
        </label>
      </div>
      <label className="block mt-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1 block">
          Anything that helps <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 500))}
          placeholder="Four seasons, captain my senior year"
          className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
        />
      </label>
      {error && <p className="text-[12.5px] text-[#990000] mt-2.5">{error}</p>}
      <div className="flex items-center gap-3 mt-3.5">
        <button
          type="submit"
          disabled={busy || !startYear || !endYear}
          className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send to Ryan'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11.5px] text-ink-muted hover:text-[#0a1628]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
