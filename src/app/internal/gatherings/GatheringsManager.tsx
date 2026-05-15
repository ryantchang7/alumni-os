'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GatheringStatusPill, type GatheringData } from '@/components/gatherings/GatheringCard'

const TYPE_OPTIONS = ['round', 'coffee', 'drinks', 'dinner', 'event'] as const
const AUDIENCE_OPTIONS = ['players', 'alumni', 'both'] as const
const VIBE_OPTIONS = ['casual', 'competitive', 'career', 'social', 'formal'] as const
const STATUS_OPTIONS = ['open', 'full', 'closed'] as const

interface GatheringWithRequests extends GatheringData {
  requestCount?: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function GatheringRow({ gathering }: { gathering: GatheringWithRequests }) {
  return (
    <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full capitalize">
              {gathering.type}
            </span>
            <GatheringStatusPill status={gathering.status} />
          </div>
          <p className="font-semibold text-[#0a1628] text-sm">{gathering.title}</p>
          <p className="text-xs text-[#8a7f70] mt-0.5">
            {gathering.dateText}
            {gathering.city ? ` · ${gathering.city}${gathering.state ? `, ${gathering.state}` : ''}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold text-[#0a1628]">{gathering.requestCount ?? 0}</p>
          <p className="text-[11px] text-[#8a7f70]">requests</p>
        </div>
      </div>
    </div>
  )
}

export default function GatheringsManager() {
  const [gatherings, setGatherings] = useState<GatheringWithRequests[]>([])
  const [loading, setLoading] = useState(true)

  // Create form state
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: 'event' as typeof TYPE_OPTIONS[number],
    title: '',
    description: '',
    hostName: 'Penn Golf Alumni',
    city: '',
    state: '',
    venue: '',
    dateText: '',
    timeText: '',
    capacity: '',
    audience: 'both' as typeof AUDIENCE_OPTIONS[number],
    vibe: 'social' as typeof VIBE_OPTIONS[number],
  })
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/gatherings?teamSlug=penn-mens-golf')
      .then(r => r.ok ? r.json() : { gatherings: [] })
      .then(d => { setGatherings(d.gatherings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [createSuccess])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.dateText.trim() || !form.hostName.trim()) return
    setSubmitting(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: 'penn-mens-golf',
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          hostName: form.hostName.trim(),
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          venue: form.venue.trim() || undefined,
          dateText: form.dateText.trim(),
          timeText: form.timeText.trim() || undefined,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
          audience: form.audience,
          vibe: form.vibe,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setCreateError(d.error ?? 'Something went wrong.')
        setSubmitting(false)
        return
      }
      setCreateSuccess(v => !v)
      setCreating(false)
      setForm({
        type: 'event', title: '', description: '', hostName: 'Penn Golf Alumni',
        city: '', state: '', venue: '', dateText: '', timeText: '', capacity: '',
        audience: 'both', vibe: 'social',
      })
    } catch {
      setCreateError('Could not connect.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors w-full'
  const selectCls = 'text-sm text-[#0a1628] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors w-full'
  const labelCls = 'block text-xs font-medium text-[#4a5568] mb-1'

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#0a1628]">Gatherings</h2>
          <p className="text-xs text-[#8a7f70] mt-0.5">{gatherings.length} active</p>
        </div>
        <button
          type="button"
          onClick={() => { setCreating(v => !v); setCreateError(null) }}
          className="text-sm font-semibold bg-[#0a1628] text-white px-4 py-2 rounded-lg hover:bg-[#0a1628]/85 transition-colors"
        >
          {creating ? 'Cancel' : '+ New gathering'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-6"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
          <p className="text-sm font-semibold text-[#0a1628] mb-5">New Gathering</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof TYPE_OPTIONS[number] }))} className={selectCls}>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Audience</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value as typeof AUDIENCE_OPTIONS[number] }))} className={selectCls}>
                  <option value="players">Players only</option>
                  <option value="alumni">Alumni only</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. NYC Alumni Drinks" className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief description" className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Host Name *</label>
                <input type="text" value={form.hostName} onChange={e => setForm(f => ({ ...f, hostName: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Vibe</label>
                <select value={form.vibe} onChange={e => setForm(f => ({ ...f, vibe: e.target.value as typeof VIBE_OPTIONS[number] }))} className={selectCls}>
                  {VIBE_OPTIONS.map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} maxLength={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} min={1} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Venue</label>
              <input type="text" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className={inputCls} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date *</label>
                <input type="text" value={form.dateText} onChange={e => setForm(f => ({ ...f, dateText: e.target.value }))} placeholder="e.g. Saturday, June 14, 2026" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="text" value={form.timeText} onChange={e => setForm(f => ({ ...f, timeText: e.target.value }))} placeholder="e.g. 7:00 PM" className={inputCls} />
              </div>
            </div>

            {createError && <p className="text-xs text-[#990000]">{createError}</p>}

            <button
              type="submit"
              disabled={submitting || !form.title.trim() || !form.dateText.trim()}
              className="text-sm font-semibold bg-[#0a1628] text-white px-5 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
            >
              {submitting ? 'Creating…' : 'Create gathering'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-[#8a7f70]">Loading…</p>
      ) : gatherings.length === 0 ? (
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
          <p className="text-sm text-[#8a7f70]">No gatherings yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gatherings.map(g => (
            <GatheringRow key={g.id} gathering={g} />
          ))}
        </div>
      )}

      {/* Links to pages */}
      <div className="mt-8 pt-6 border-t border-[rgba(180,168,150,0.25)] flex flex-wrap gap-4">
        <Link href="/the-course" className="text-xs text-[#990000] hover:underline font-medium">
          View The Course &rarr;
        </Link>
        <Link href="/19th-hole" className="text-xs text-[#990000] hover:underline font-medium">
          View 19th Hole &rarr;
        </Link>
        <Link href="/events" className="text-xs text-[#990000] hover:underline font-medium">
          View Events &rarr;
        </Link>
      </div>
    </div>
  )
}
