'use client'

/**
 * Two questions while the claim sits in the queue.
 *
 * The waiting page used to be a dead end at the exact moment someone is most
 * excited, and the site's whole value is member-entered data that nothing
 * ever asked for. Answers are stored on the claim and applied at approval,
 * so the Member Map and the open-to lists fill up as people join instead of
 * staying empty.
 */

import { useState } from 'react'
import { MapPin, Check } from 'lucide-react'

const OPEN_TO = [
  { key: 'golf', label: 'A round' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'mentorship', label: 'Mentoring' },
  { key: 'intros', label: 'Intros' },
] as const

export default function PendingSetup() {
  const [city, setCity] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [openTo, setOpenTo] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const toggle = (k: string) =>
    setOpenTo(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]))

  async function save() {
    if (!city.trim() && openTo.length === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/account/claim-setup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state: stateCode.trim(), openTo }),
      })
      if (res.ok) {
        setSaved(true)
        return
      }
      // Never fail silently — a swallowed error here reads as "saved" and the
      // answer is gone.
      const data = await res.json().catch(() => ({}))
      setError(
        (data as { error?: string }).error ||
          'That did not save. Try again, or just tell us when you are in.',
      )
    } catch {
      setError('That did not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mt-6 pt-6 border-t border-[rgba(180,168,150,0.3)]">
        <p className="flex items-center gap-2 text-[13px] text-[#2d6a4f] font-medium">
          <Check className="w-4 h-4" />
          Got it — that&rsquo;ll be on your card the moment you&rsquo;re in.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-[rgba(180,168,150,0.3)] text-left">
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1.5">
        <MapPin className="w-3.5 h-3.5 text-[#c8a84b]" />
        While you wait — 30 seconds
      </p>
      <p className="text-[13px] text-[#3d4a5c] mb-4 leading-relaxed">
        Two things that put you on the map and help members find you.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="What city are you in?"
          className="flex-1 min-w-0 border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[13.5px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
        />
        <input
          value={stateCode}
          onChange={e => setStateCode(e.target.value.slice(0, 20))}
          placeholder="State"
          className="w-24 flex-shrink-0 border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[13.5px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
        />
      </div>

      <p className="text-[12px] text-ink-muted mb-2">Open to…</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {OPEN_TO.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => toggle(o.key)}
            className={`text-[12.5px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
              openTo.includes(o.key)
                ? 'bg-[#0a1628] text-white border-[#0a1628]'
                : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={saving || (!city.trim() && openTo.length === 0)}
        onClick={save}
        className="text-[11.5px] font-semibold uppercase tracking-[0.14em] bg-[#0a1628] hover:bg-[#112240] text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save for when I\u2019m in'}
      </button>

      {error && (
        <p className="mt-2.5 text-[12.5px] text-[#b3261e]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
