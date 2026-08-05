'use client'

/**
 * SuggestIdeaForm — client form for /suggest.
 *
 * Name and email are always editable inputs — prefilled with the signed-in
 * user's values as defaults, but the user can freely change them.
 * Email is optional; name is required.
 *
 * Topic chips ("What's this about?") are optional single-select. The chosen
 * topic is prepended to the message text (e.g. "[Event] ...") so no API
 * or store changes are needed.
 *
 * Character counter is live under the message textarea.
 * Success state shows a warm confirmation.
 * Modal entrance animation is handled by the parent (SuggestTrigger).
 */

import { useState, useCallback } from 'react'
import TurnstileWidget from '@/components/TurnstileWidget'

const MESSAGE_MAX = 1500
const NAME_MAX = 120

const TOPICS = ['Idea', 'Event', 'Fix', 'Other'] as const
type Topic = typeof TOPICS[number]

interface Props {
  /** Passed by the parent when the session is available. */
  prefillName?: string
  prefillEmail?: string
  isSignedIn?: boolean
}

export default function SuggestIdeaForm({ prefillName, prefillEmail, isSignedIn }: Props) {
  const [name, setName] = useState(prefillName ?? '')
  const [email, setEmail] = useState(prefillEmail ?? '')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')

    // Prefix topic into message if selected
    const finalMessage = topic ? `[${topic}] ${message}` : message

    const payload: Record<string, string> = { message: finalMessage }
    // Always send name + email from the form (user may have edited them)
    if (name.trim()) payload.name = name.trim()
    if (email.trim()) payload.email = email.trim()
    if (turnstileToken) payload.turnstileToken = turnstileToken

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-[#d9c8a8] bg-[#fdfcf9] px-8 py-10 text-center">
        {/* Checkmark */}
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
          className="font-serif text-2xl text-[#0a1628]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Thanks, Ryan will see this.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          We read every idea. Appreciate you taking the time.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name, always editable; prefilled for signed-in users */}
      <div>
        <label
          htmlFor="suggest-name"
          className="block text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1.5"
        >
          Name
        </label>
        <input
          id="suggest-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, NAME_MAX))}
          required
          maxLength={NAME_MAX}
          placeholder="Your name"
          className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
        />
      </div>

      {/* Email, always editable; prefilled for signed-in users; optional */}
      <div>
        <label
          htmlFor="suggest-email"
          className="block text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1.5"
        >
          Email <span className="normal-case font-normal tracking-normal">(optional)</span>
        </label>
        <input
          id="suggest-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          maxLength={254}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
        />
      </div>

      {/* Topic chips, optional single-select */}
      <div>
        <p className="block text-xs font-semibold tracking-widest uppercase text-ink-muted mb-2">
          What&apos;s this about? <span className="normal-case font-normal tracking-normal">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => {
            const active = topic === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(active ? null : t)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  active
                    ? 'bg-[#0a1628] border-[#0a1628] text-white'
                    : 'bg-white border-[#d9c8a8] text-[#5a5347] hover:border-[#c8a84b] hover:text-[#0a1628]',
                ].join(' ')}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label
            htmlFor="suggest-message"
            className="block text-xs font-semibold tracking-widest uppercase text-ink-muted"
          >
            Your idea
          </label>
          <span className={[
            'text-xs tabular-nums transition-colors',
            message.length >= MESSAGE_MAX * 0.9 ? 'text-[#990000]' : 'text-[#b0a898]',
          ].join(' ')}>
            {message.length} / {MESSAGE_MAX}
          </span>
        </div>
        <textarea
          id="suggest-message"
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder="What would make the Clubhouse more useful for you?"
          className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-3 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
        />
      </div>

      {/* Turnstile, self-hides when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset */}
      <TurnstileWidget onToken={handleTurnstile} />

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
        {status === 'submitting' ? 'Sending…' : 'Send idea'}
      </button>
    </form>
  )
}
