'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PhotoUpload from '@/components/PhotoUpload'
import MediaThumbStrip from '@/components/moments/MediaThumbStrip'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatGatheringDate } from '@/lib/gatherings/date'

type Media = { url: string; type: 'image' | 'video' }

const MAX_MEDIA = 12

/** The Saturday just gone — most team things happen on a weekend. */
function lastSaturday(): string {
  const d = new Date()
  // 6 = Saturday. Always step back at least one day, so on a Saturday this
  // means the previous one rather than today.
  const back = ((d.getDay() - 6 + 7) % 7) || 7
  d.setDate(d.getDate() - back)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local YYYY-MM-DD, offset by whole days. today() = '2026-08-26'. */
function today(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Kind = 'qualifying' | 'tournament' | 'stat' | 'note'

interface SeasonUpdate {
  id: string
  kind: Kind
  title: string
  dateText: string
  dateISO?: string
  media?: Media[]
  body?: string
  linkUrl?: string
  linkLabel?: string
  previewImageUrl?: string
  previewTitle?: string
  previewDescription?: string
  createdAt: string
  updatedAt: string
}

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'tournament', label: 'Tournament' },
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'stat', label: 'Stat' },
  { value: 'note', label: 'Note' },
]

const KIND_LABELS: Record<Kind, string> = {
  tournament: 'Tournament',
  qualifying: 'Qualifying',
  stat: 'Stat',
  note: 'Note',
}

const EMPTY_FORM = {
  kind: 'tournament' as Kind,
  title: '',
  // Pre-filled with today: posting something that happened today, which is
  // the common case, should take zero clicks on the date.
  dateISO: today(),
  // Only used when the date is a label rather than a day.
  dateLabel: '',
  useLabel: false,
  media: [] as Media[],
  body: '',
  linkUrl: '',
  linkLabel: '',
  previewImageUrl: '',
}

interface PersistenceStatus {
  backend: 'kv' | 'filesystem' | 'unknown'
  isVercel: boolean
  warning: string | null
}

export default function SeasonManagerClient({ isFounder = false }: { isFounder?: boolean }) {
  const [updates, setUpdates] = useState<SeasonUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [persistence, setPersistence] = useState<PersistenceStatus | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/internal/season?teamSlug=penn-mens-golf')
      .then(r => (r.ok ? r.json() : { updates: [] }))
      .then(d => {
        setUpdates(d.updates ?? [])
        setPersistence(d.persistence ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [refreshKey])

  function resetForm() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  function startEdit(u: SeasonUpdate) {
    setEditingId(u.id)
    setForm({
      kind: u.kind,
      title: u.title,
      dateISO: u.dateISO ?? '',
      dateLabel: u.dateISO ? '' : u.dateText,
      useLabel: !u.dateISO,
      media: u.media ?? [],
      body: u.body ?? '',
      linkUrl: u.linkUrl ?? '',
      linkLabel: u.linkLabel ?? '',
      previewImageUrl: u.previewImageUrl ?? '',
    })
    setShowForm(true)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const resolvedDateText = form.useLabel
      ? form.dateLabel.trim()
      : form.dateISO
        ? formatGatheringDate(form.dateISO)
        : ''
    if (!form.title.trim() || !resolvedDateText) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        teamSlug: 'penn-mens-golf',
        kind: form.kind,
        title: form.title.trim(),
        dateText: resolvedDateText,
        dateISO: form.useLabel ? '' : form.dateISO,
        media: form.media,
        body: form.body.trim(),
        linkUrl: form.linkUrl.trim(),
        linkLabel: form.linkLabel.trim(),
        previewImageUrl: form.previewImageUrl.trim(),
        ...(editingId ? { id: editingId } : {}),
      }
      const res = await fetch('/api/internal/season', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Something went wrong.')
        setSubmitting(false)
        return
      }
      resetForm()
      setRefreshKey(k => k + 1)
    } catch {
      setError('Could not connect.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/internal/season?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      if (editingId === id) resetForm()
      setRefreshKey(k => k + 1)
    }
  }

  const inputCls =
    'text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#fbf9f6] border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0a1628] transition-colors w-full'
  const labelCls = 'block text-xs font-medium text-[#3a4657] mb-1'

  return (
    <div>
      {/* Persistence warning, writes won't survive a cold start until KV is
          connected on Vercel. Loud on purpose. */}
      {persistence?.warning && (
        <div className="mb-6 rounded-xl border border-[#990000]/30 bg-[#990000]/5 px-4 py-3">
          <p className="text-xs font-semibold text-[#990000]">Updates won&apos;t save yet</p>
          <p className="text-xs text-[#7a1212] mt-1 leading-relaxed">
            {persistence.warning} Connect Upstash KV in Vercel → Storage, then redeploy. Until then,
            anything you post here disappears on the next cold start.
          </p>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#0a1628]">Season updates</h2>
          <p className="text-xs text-ink-muted mt-0.5">{updates.length} posted</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm()
            else {
              setForm({ ...EMPTY_FORM })
              setEditingId(null)
              setShowForm(true)
            }
          }}
          className="text-sm font-semibold bg-[#0a1628] text-white px-4 py-2 rounded-lg hover:bg-[#0a1628]/85 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New update'}
        </button>
      </div>

      {/* Create / edit form */}
      {showForm && (
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-6"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <p className="text-sm font-semibold text-[#0a1628] mb-5">
            {editingId ? 'Edit update' : 'New update'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kind</label>
                <select
                  value={form.kind}
                  onChange={e => setForm(f => ({ ...f, kind: e.target.value as Kind }))}
                  className={inputCls}
                >
                  {KIND_OPTIONS.map(k => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <label className={labelCls}>Date *</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, useLabel: !f.useLabel }))}
                    className="text-[11px] text-ink-muted hover:text-[#0a1628] underline underline-offset-2"
                  >
                    {form.useLabel ? 'Pick a day' : 'Use a label'}
                  </button>
                </div>
                {form.useLabel ? (
                  <input
                    type="text"
                    value={form.dateLabel}
                    onChange={e => setForm(f => ({ ...f, dateLabel: e.target.value }))}
                    placeholder="e.g. Championship Weekend"
                    className={inputCls}
                    required
                  />
                ) : (
                  <>
                    <input
                      type="date"
                      value={form.dateISO}
                      onChange={e => setForm(f => ({ ...f, dateISO: e.target.value }))}
                      className={inputCls}
                      required
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[
                        { label: 'Today', iso: today() },
                        { label: 'Yesterday', iso: today(-1) },
                        { label: 'Last Sat', iso: lastSaturday() },
                      ].map(q => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, dateISO: q.iso }))}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                            form.dateISO === q.iso
                              ? 'bg-[#0a1628] text-white border-[#0a1628]'
                              : 'bg-white text-ink-muted border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Ivy League Championship"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Details</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={3}
                placeholder="Results, finishes, who's in contention, low rounds…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>
                Photos {form.media.length > 0 ? `(${form.media.length}/${MAX_MEDIA})` : '(optional)'}
              </label>
              <p className="text-[11px] text-ink-muted mb-2 -mt-0.5">
                Gear haul, travel day, the range. Drag to reorder — the first one leads the post.
              </p>
              {form.media.length > 0 && (
                <div className="mb-3">
                  <MediaThumbStrip
                    items={form.media}
                    onChange={next => setForm(f => ({ ...f, media: next }))}
                  />
                </div>
              )}
              {form.media.length < MAX_MEDIA && (
                <PhotoUpload
                  value=""
                  onChange={url => {
                    if (!url) return
                    const type: 'image' | 'video' = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? 'video' : 'image'
                    setForm(f =>
                      f.media.length >= MAX_MEDIA || f.media.some(m => m.url === url)
                        ? f
                        : { ...f, media: [...f.media, { url, type }] },
                    )
                  }}
                  label=""
                  shape="wide"
                  allowVideo
                  multiple
                  maxFiles={MAX_MEDIA - form.media.length}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Link (optional)</label>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="Paste results / coverage URL"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Link label (optional)</label>
                <input
                  type="text"
                  value={form.linkLabel}
                  onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))}
                  placeholder="e.g. Full results on GolfStat"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Preview image (optional)</label>
              <p className="text-[11px] text-ink-muted mb-2 -mt-0.5">
                Leave blank to auto-pull the picture from the link. Upload one to override it.
              </p>
              <PhotoUpload
                value={form.previewImageUrl}
                onChange={url => setForm(f => ({ ...f, previewImageUrl: url }))}
                label=""
                shape="wide"
              />
            </div>

            {error && <p className="text-xs text-[#990000]">{error}</p>}

            <button
              type="submit"
              disabled={
                submitting ||
                !form.title.trim() ||
                (form.useLabel ? !form.dateLabel.trim() : !form.dateISO)
              }
              className="text-sm font-semibold bg-[#0a1628] text-white px-5 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
            >
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Post update'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : updates.length === 0 ? (
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
        >
          <p className="text-sm text-ink-muted">No updates yet. Post one above and it shows in the Team Room.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map(u => (
            <div
              key={u.id}
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {u.previewImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.previewImageUrl}
                      alt=""
                      className="w-full max-w-[180px] h-20 object-cover rounded-md mb-2 border border-[rgba(180,168,150,0.4)]"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-semibold text-[#0a1628] bg-[#0a1628]/8 px-2 py-0.5 rounded-full">
                      {KIND_LABELS[u.kind]}
                    </span>
                    <span className="text-[11px] text-ink-muted">{u.dateText}</span>
                  </div>
                  <p className="font-semibold text-[#0a1628] text-sm">{u.title}</p>
                  {u.body && <p className="text-xs text-ink-muted mt-1 whitespace-pre-line">{u.body}</p>}
                  {u.linkUrl && (
                    <a
                      href={u.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#990000] hover:underline font-medium mt-1.5 inline-block"
                    >
                      {u.linkLabel || u.linkUrl} &rarr;
                    </a>
                  )}
                </div>
                {isFounder && (
                <div className="flex flex-shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(u)}
                    className="text-xs font-medium text-[#0a1628] border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] px-2.5 py-1 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(u.id)}
                    className="text-xs font-medium text-[#990000] border border-[rgba(180,168,150,0.5)] hover:border-[#990000] px-2.5 py-1 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to live page */}
      <div className="mt-8 pt-6 border-t border-[rgba(180,168,150,0.25)] flex flex-wrap gap-4">
        <Link href="/team-room" className="text-xs text-[#990000] hover:underline font-medium">
          View the Team Room &rarr;
        </Link>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this update?"
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId)
          setConfirmDeleteId(null)
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
