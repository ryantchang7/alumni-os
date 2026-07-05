'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function SpotlightNominate() {
  const [open, setOpen] = useState(false)
  const [nomineeName, setNomineeName] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'rate-limited'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
    // Reset on close so re-open is fresh
    setTimeout(() => {
      setStatus('idle')
      setNomineeName('')
      setReason('')
      setErrorMsg('')
    }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nomineeName.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/spotlight-nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomineeName: nomineeName.trim(), reason: reason.trim() || undefined }),
      })
      if (res.status === 429) {
        setStatus('rate-limited')
        return
      }
      if (res.status === 401) {
        setStatus('error')
        setErrorMsg('Sign in to nominate someone.')
        return
      }
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
            aria-label="Nominate someone for Alumni Spotlight"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#fbf9f6] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-gold mb-1">
                    Penn Men&rsquo;s Golf
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug font-heading"
                  >
                    Nominate someone
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/75 hover:text-white transition-colors mt-0.5 flex-shrink-0"
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
                      Thanks &mdash; we&rsquo;ll take a look.
                    </p>
                    <p className="text-sm text-ink-muted">
                      Your nomination has been sent.
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-6 text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-white hover:bg-[#fbf9f6] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : status === 'rate-limited' ? (
                  <div className="text-center py-6">
                    <p className="text-sm font-semibold text-[#0a1628] mb-1">Slow down a bit</p>
                    <p className="text-sm text-ink-muted">You&rsquo;ve sent a few nominations recently. Try again later.</p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-6 text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-white hover:bg-[#fbf9f6] px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm text-[#3a4657] leading-relaxed">
                      Know someone from the Penn Golf family who deserves a spotlight? Let us know and we&rsquo;ll consider featuring them.
                    </p>

                    <div>
                      <label htmlFor="spotlight-nominee-name" className={labelClass}>
                        Their name <span className="text-[#990000]">*</span>
                      </label>
                      <input
                        id="spotlight-nominee-name"
                        type="text"
                        required
                        value={nomineeName}
                        onChange={e => setNomineeName(e.target.value)}
                        placeholder="e.g. John Smith C&apos;18"
                        className={inputClass}
                        disabled={status === 'loading'}
                      />
                    </div>

                    <div>
                      <label htmlFor="spotlight-reason" className={labelClass}>
                        Why them? <span className="text-[#b0a898] font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <textarea
                        id="spotlight-reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="What have they been up to? What makes them worth featuring?"
                        rows={3}
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
                        disabled={status === 'loading' || !nomineeName.trim()}
                        className="bg-[#0a1628] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#152238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'loading' ? 'Sending…' : 'Send nomination'}
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
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-white hover:bg-[#fbf9f6] hover:border-[#0a1628]/30 px-4 py-2.5 rounded-lg transition-colors"
      >
        Nominate someone
      </button>
      {modal}
    </>
  )
}
