'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'

export function DeleteTravelStop({ stopId }: { stopId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      await fetch(`/api/team-travel?id=${stopId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={[
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40',
        confirming
          ? 'bg-[#990000] text-white border-[#990000] hover:bg-[#7a0000]'
          : 'text-ink-muted border-[rgba(180,168,150,0.55)] hover:text-[#990000] hover:border-[#990000]/40 bg-transparent',
      ].join(' ')}
    >
      <Trash2 size={12} />
      {confirming ? 'Confirm delete' : 'Delete stop'}
    </button>
  )
}

const labelClass = 'block text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1.5'
const inputClass =
  'w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b] transition-colors'

export default function AddTravelStop() {
  const [open, setOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [locationText, setLocationText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

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

  function reset() {
    setEventName('')
    setLocationText('')
    setStartDate('')
    setEndDate('')
    setNote('')
    setStatus('idle')
    setErrorMsg('')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/team-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          locationText: locationText.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })
      if (res.ok) {
        reset()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server.')
      setStatus('error')
    }
  }

  const modal =
    open && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Add a travel stop"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={reset}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden flex flex-col max-h-[90vh]"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
                <div>
                  <p className="eyebrow text-gold mb-1">
                    Penn Men&rsquo;s Golf &mdash; Founders only
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug font-heading"
                  >
                    Add a travel stop
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-white/50 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gold accent line */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b] flex-shrink-0" />

              {/* Body */}
              <div className="px-6 py-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Event name</label>
                      <input
                        type="text"
                        required
                        value={eventName}
                        onChange={e => setEventName(e.target.value.slice(0, 120))}
                        placeholder="e.g. Ivy Championship"
                        className={inputClass}
                        disabled={status === 'submitting'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        type="text"
                        required
                        value={locationText}
                        onChange={e => setLocationText(e.target.value.slice(0, 200))}
                        placeholder="e.g. Princeton, NJ"
                        className={inputClass}
                        disabled={status === 'submitting'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Start date</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={inputClass}
                        disabled={status === 'submitting'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        End date{' '}
                        <span className="normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className={inputClass}
                        disabled={status === 'submitting'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Note{' '}
                      <span className="normal-case font-normal tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value.slice(0, 400))}
                      rows={3}
                      placeholder="Any context for alumni near this stop..."
                      className={`${inputClass} resize-none`}
                      disabled={status === 'submitting'}
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
                      onClick={reset}
                      className="text-sm text-ink-muted hover:text-[#0a1628] transition-colors px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="bg-[#0a1628] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#152238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? 'Adding...' : 'Add stop'}
                    </button>
                  </div>
                </form>
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.6)] bg-white hover:bg-[#f8f5f0] px-4 py-2.5 rounded-lg transition-colors"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
      >
        <span aria-hidden="true">+</span> Add a travel stop
      </button>
      {modal}
    </>
  )
}
