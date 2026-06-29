'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  stopId: string
  eventName: string
  signedIn: boolean
}

export default function TravelHostOfferButton({ stopId, eventName, signedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [byLocation, setByLocation] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleOpen = () => {
    if (!signedIn) {
      router.push('/login?next=/team/travel')
      return
    }
    setOpen(true)
  }

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/team-travel/${stopId}/host-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          byLocation: byLocation.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.')
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
            aria-label="Offer to host the team"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-1">
                    Penn Men&rsquo;s Golf
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Offer to host the team
                  </h2>
                  <p className="text-white/50 text-xs mt-1">{eventName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/50 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gold accent line */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

              {/* Form body */}
              <div className="px-6 py-6">
                {status === 'success' ? (
                  <div className="rounded-xl border border-[#d9c8a8] bg-[#faf7f2] px-8 py-10 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <span
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#c8a84b]/12 border border-[#c8a84b]/30"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-5 h-5 text-[#c8a84b]"
                          fill="none"
                          viewBox="0 0 20 20"
                          stroke="currentColor"
                          strokeWidth={2.2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l4 4 7-8" />
                        </svg>
                      </span>
                    </div>
                    <p
                      className="text-xl font-medium text-[#0a1628]"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Thanks &mdash; we&rsquo;ll pass it along.
                    </p>
                    <p className="mt-3 text-sm text-[#8a7f70]">
                      The coach and team will see this. We appreciate you looking out for the guys.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="host-location"
                        className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5"
                      >
                        Your city <span className="normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        id="host-location"
                        type="text"
                        value={byLocation}
                        onChange={e => setByLocation(e.target.value.slice(0, 100))}
                        placeholder="e.g. Philadelphia, PA"
                        className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="host-message"
                        className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5"
                      >
                        What you&rsquo;d like to offer <span className="normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <textarea
                        id="host-message"
                        value={message}
                        onChange={e => setMessage(e.target.value.slice(0, 600))}
                        rows={4}
                        maxLength={600}
                        placeholder="Anything you'd want to offer — dinner, a round, a place to stay?"
                        className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-3 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full rounded-lg bg-[#0a1628] px-6 py-3 text-[13px] font-semibold tracking-wider uppercase text-white hover:bg-[#0f1f3d] disabled:opacity-50 transition-colors"
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send offer'}
                    </button>
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
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#c8a84b] hover:bg-[#b8973b] px-3 py-2 rounded-lg transition-colors"
      >
        Offer to host
      </button>
      {modal}
    </>
  )
}
