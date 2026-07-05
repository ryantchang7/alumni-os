'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RotateCcw, Wand2 } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'

interface SlotRow {
  id: string
  label: string
  hint?: string
  kind: 'text' | 'longtext' | 'image'
  default: string
  current: string
  override: string | null
}

export default function StudioClient() {
  const [slots, setSlots] = useState<SlotRow[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/internal/site-content')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return
        setSlots(d.slots as SlotRow[])
        const next: Record<string, string> = {}
        for (const s of d.slots as SlotRow[]) next[s.id] = s.current
        setDrafts(next)
      })
      .catch(() => setError('Could not load slots.'))
  }, [])

  function setDraft(slotId: string, value: string) {
    setDrafts(d => ({ ...d, [slotId]: value }))
    setSavedId(null)
  }

  async function save(slot: SlotRow) {
    setSavingId(slot.id)
    setSavedId(null)
    setError(null)
    try {
      const res = await fetch('/api/internal/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, value: drafts[slot.id] ?? '' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Save failed (${res.status})`)
      }
      setSavedId(slot.id)
      // Refresh the slot row's `current` so "Reset" works correctly.
      setSlots(prev =>
        prev?.map(s =>
          s.id === slot.id
            ? { ...s, override: drafts[slot.id], current: drafts[slot.id] }
            : s,
        ) ?? prev,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  async function reset(slot: SlotRow) {
    setDraft(slot.id, slot.default)
    setSavingId(slot.id)
    setError(null)
    try {
      const res = await fetch('/api/internal/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, value: '' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Reset failed (${res.status})`)
      }
      setSavedId(slot.id)
      setSlots(prev =>
        prev?.map(s =>
          s.id === slot.id ? { ...s, override: null, current: s.default } : s,
        ) ?? prev,
      )
      setDrafts(d => ({ ...d, [slot.id]: slot.default }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[920px] mx-auto flex items-center justify-between">
          <Link
            href="/internal"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Internal</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
            Captain · Studio
          </p>
        </div>
      </div>

      <div className="max-w-[920px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-5 h-5 text-[#c8a84b]" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading"
            >
              Studio
            </h1>
          </div>
          <p className="text-[14px] text-[#3d4a5c] max-w-xl">
            Edit text and images across the Clubhouse. Changes save immediately and
            apply on next page load. Reset any slot to restore the default.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
            <p className="text-[13px] text-[#990000]">{error}</p>
          </div>
        )}

        {!slots && (
          <p className="text-[13px] text-ink-muted">Loading…</p>
        )}

        <div className="space-y-6">
          {slots?.map(slot => {
            const draft = drafts[slot.id] ?? ''
            const isDirty = draft !== slot.current
            const isOverride = !!slot.override
            const saving = savingId === slot.id
            const saved = savedId === slot.id
            return (
              <div
                key={slot.id}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-6 py-5"
                style={{
                  boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0a1628]">{slot.label}</p>
                    {slot.hint && (
                      <p className="text-[12px] text-ink-muted mt-0.5">{slot.hint}</p>
                    )}
                  </div>
                  {isOverride && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a6420] bg-[#c8a84b]/15 px-2 py-1 rounded-full">
                      Overridden
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {slot.kind === 'image' ? (
                    <PhotoUpload
                      value={draft}
                      onChange={url => setDraft(slot.id, url)}
                      label=""
                      shape="wide"
                      skipCropper
                    />
                  ) : slot.kind === 'longtext' ? (
                    <textarea
                      value={draft}
                      onChange={e => setDraft(slot.id, e.target.value)}
                      rows={4}
                      maxLength={8000}
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft}
                      onChange={e => setDraft(slot.id, e.target.value)}
                      maxLength={500}
                      className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => save(slot)}
                    disabled={!isDirty || saving}
                    className="inline-flex items-center gap-1.5 bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  {isOverride && (
                    <button
                      type="button"
                      onClick={() => reset(slot)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted hover:text-[#0a1628] px-3 py-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to default
                    </button>
                  )}
                  {saved && (
                    <span className="text-[12px] text-[#2d6a4f] font-medium">Saved.</span>
                  )}
                  <p className="text-[11px] text-ink-muted ml-auto font-mono">{slot.id}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
