'use client'

/**
 * AskTheTeam — "Ask the Team" trigger button + portal modal.
 * Mirrors SuggestTrigger's modal pattern: navy header in Playfair,
 * cream body, Escape-to-close, backdrop.
 *
 * Approved members only (the API returns 401/403 for everyone else).
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'

const QUESTION_MAX = 1000

interface Props {
  /** Variant for when this button appears inline on a page vs. compact elsewhere. */
  variant?: 'primary' | 'compact'
}

export default function AskTheTeam({ variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  // Escape-to-close + body scroll lock
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
    // Reset form if not in success state (let success state persist briefly)
    if (status !== 'success') {
      setQuestion('')
      setErrorMsg('')
      setStatus('idle')
    }
  }

  function handleOpen() {
    setOpen(true)
    setStatus('idle')
    setQuestion('')
    setErrorMsg('')
    setTurnstileToken(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')

    const payload: Record<string, string> = { question: question.trim() }
    if (turnstileToken) payload.turnstileToken = turnstileToken

    try {
      const res = await fetch('/api/team-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        const err = (data as { error?: string }).error
        if (res.status === 401) {
          setErrorMsg('Sign in to ask the team a question.')
        } else if (res.status === 403) {
          setErrorMsg(err ?? 'Your account needs to be approved before you can ask questions.')
        } else if (res.status === 429) {
          setErrorMsg('You’ve sent a few questions recently — give it a day and try again.')
        } else {
          setErrorMsg(err ?? 'Something went wrong. Try again.')
        }
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.')
      setStatus('error')
    }
  }

  const triggerBtn =
    variant === 'primary' ? (
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        Ask the Team
      </button>
    ) : (
      <button
        type="button"
        onClick={handleOpen}
        className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors px-3 py-2 rounded hover:bg-white/[0.06]"
      >
        Ask the Team
      </button>
    )

  const modal =
    open && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Ask the Team"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden animate-suggest-panel"
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
                    Ask the Team
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

              {/* Gold accent line */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

              {/* Body */}
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
                      className="text-2xl text-[#0a1628]"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Sent &mdash; one of the guys will get back to you
                    </p>
                    <p className="mt-3 text-sm text-[#8a7f70]">
                      Usually within a couple days. Thanks for asking.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm text-[#5a5347] leading-relaxed">
                      Got a question for the guys on the team? Ask away &mdash; current players answer when they can.
                    </p>

                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label
                          htmlFor="ask-question"
                          className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70]"
                        >
                          Your question
                        </label>
                        <span className={[
                          'text-xs tabular-nums transition-colors',
                          question.length >= QUESTION_MAX * 0.9 ? 'text-[#990000]' : 'text-[#b0a898]',
                        ].join(' ')}>
                          {question.length} / {QUESTION_MAX}
                        </span>
                      </div>
                      <textarea
                        id="ask-question"
                        value={question}
                        onChange={e => setQuestion(e.target.value.slice(0, QUESTION_MAX))}
                        required
                        rows={5}
                        maxLength={QUESTION_MAX}
                        placeholder="Ask the guys anything…"
                        className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-3 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
                      />
                    </div>

                    <TurnstileWidget onToken={handleTurnstile} />

                    {status === 'error' && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting' || !question.trim()}
                      className="w-full rounded-lg bg-[#0a1628] px-6 py-3 text-[13px] font-semibold tracking-wider uppercase text-white hover:bg-[#0f1f3d] disabled:opacity-50 transition-colors"
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send question'}
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
      {triggerBtn}
      {modal}
    </>
  )
}
