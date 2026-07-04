'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search } from 'lucide-react'

interface MemberOption {
  id: string
  name: string
}

interface Props {
  members: MemberOption[]
}

export default function FeatureAlumComposer({ members }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberOption | null>(null)
  const [headline, setHeadline] = useState('')
  const [blurb, setBlurb] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const filtered = query.trim()
    ? members.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setStatus('idle')
      setQuery('')
      setSelected(null)
      setHeadline('')
      setBlurb('')
      setErrorMsg('')
    }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !blurb.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/spotlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selected.id,
          headline: headline.trim() || undefined,
          blurb: blurb.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg((d as { error?: string }).error ?? 'Something went wrong — try again.')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Network error — check your connection and try again.')
    }
  }

  const labelClass = 'block text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1.5'
  const inputClass =
    'w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b] transition-colors'

  const modal =
    open && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Feature an alum"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-gold mb-1">
                    Penn Men&rsquo;s Golf &mdash; Captains only
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug font-heading"
                  >
                    Feature an alum
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/50 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gold accent */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

              {/* Body */}
              <div className="px-6 py-6">
                {status === 'success' ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-[#c8a84b]/15 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-[#c8a84b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p
                      className="text-[#0a1628] text-lg font-medium mb-2 font-heading"
                    >
                      Spotlight published.
                    </p>
                    <p className="text-sm text-ink-muted mb-6">
                      {selected?.name} is now the featured alum. Refresh the page to see it.
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-white hover:bg-[#f8f5f0] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Member picker */}
                    <div>
                      <label htmlFor="feature-alum-search" className={labelClass}>
                        Who to feature <span className="text-[#990000]">*</span>
                      </label>
                      {selected ? (
                        <div className="flex items-center justify-between gap-3 bg-white border border-[#c8a84b]/50 rounded-lg px-4 py-2.5">
                          <span className="text-sm font-semibold text-[#0a1628]">{selected.name}</span>
                          <button
                            type="button"
                            onClick={() => { setSelected(null); setQuery('') }}
                            className="text-ink-muted hover:text-[#0a1628] transition-colors flex-shrink-0"
                            aria-label="Remove selection"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a898] pointer-events-none" />
                          <input
                            id="feature-alum-search"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by name…"
                            className={`${inputClass} pl-9`}
                            disabled={status === 'loading'}
                            autoComplete="off"
                          />
                          {filtered.length > 0 && (
                            <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-[#d9c8a8] rounded-lg shadow-lg divide-y divide-[rgba(180,168,150,0.2)]">
                              {filtered.slice(0, 12).map(m => (
                                <li key={m.id}>
                                  <button
                                    type="button"
                                    onClick={() => { setSelected(m); setQuery('') }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-[#0a1628] hover:bg-[#faf7f2] transition-colors"
                                  >
                                    {m.name}
                                  </button>
                                </li>
                              ))}
                              {filtered.length > 12 && (
                                <li className="px-4 py-2 text-xs text-ink-muted">
                                  {filtered.length - 12} more &mdash; keep typing to narrow
                                </li>
                              )}
                            </ul>
                          )}
                          {query.trim() && filtered.length === 0 && (
                            <p className="mt-1.5 text-xs text-ink-muted">No match for &ldquo;{query}&rdquo;</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Headline */}
                    <div>
                      <label htmlFor="feature-alum-headline" className={labelClass}>
                        Headline <span className="text-[#b0a898] font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <input
                        id="feature-alum-headline"
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder="e.g. Partner at Goldman Sachs, C&apos;12"
                        className={inputClass}
                        disabled={status === 'loading'}
                      />
                    </div>

                    {/* Blurb */}
                    <div>
                      <label htmlFor="feature-alum-blurb" className={labelClass}>
                        Blurb <span className="text-[#990000]">*</span>
                      </label>
                      <textarea
                        id="feature-alum-blurb"
                        required
                        value={blurb}
                        onChange={e => setBlurb(e.target.value)}
                        placeholder="What&apos;s their story? What have they been up to since Penn?"
                        rows={4}
                        className={`${inputClass} resize-none`}
                        disabled={status === 'loading'}
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-xs text-[#990000] bg-[#990000]/8 border border-[#990000]/20 rounded-lg px-4 py-2.5">
                        {errorMsg}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="text-sm text-ink-muted hover:text-[#0a1628] transition-colors px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={status === 'loading' || !selected || !blurb.trim()}
                        className="bg-[#0a1628] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#152238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'loading' ? 'Publishing…' : 'Publish spotlight'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#c8a84b] hover:bg-[#d4b75a] px-4 py-2.5 rounded-lg transition-colors"
      >
        Feature an alum
      </button>
      {modal}
    </>
  )
}
