'use client'

/**
 * SuggestIdeaForm — client form for /suggest.
 *
 * When signed in, name and email are read-only (prefilled from props).
 * When signed out, both are editable; email is optional.
 */

import { useState, useCallback } from 'react'
import TurnstileWidget from '@/components/TurnstileWidget'

const MESSAGE_MAX = 1500
const NAME_MAX = 120

interface Props {
  /** Passed by the server page when the session is available. */
  prefillName?: string
  prefillEmail?: string
  isSignedIn?: boolean
}

export default function SuggestIdeaForm({ prefillName, prefillEmail, isSignedIn }: Props) {
  const [name, setName] = useState(prefillName ?? '')
  const [email, setEmail] = useState(prefillEmail ?? '')
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

    const payload: Record<string, string> = { message }
    if (!isSignedIn) {
      payload.name = name
      if (email.trim()) payload.email = email.trim()
    }
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
      <div className="rounded-xl border border-[#d9c8a8] bg-[#faf7f2] px-8 py-10 text-center">
        <p
          className="font-serif text-2xl text-[#0a1628]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Thanks &mdash; Ryan will see this.
        </p>
        <p className="mt-3 text-sm text-[#8a7f70]">
          We read every idea. Appreciate you taking the time.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="suggest-name"
          className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5"
        >
          Name
        </label>
        {isSignedIn ? (
          <p className="text-sm text-[#0a1628] py-2">{name}</p>
        ) : (
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
        )}
      </div>

      {/* Email — optional for signed-out, read-only for signed-in */}
      <div>
        <label
          htmlFor="suggest-email"
          className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70] mb-1.5"
        >
          Email <span className="normal-case font-normal tracking-normal">(optional)</span>
        </label>
        {isSignedIn ? (
          <p className="text-sm text-[#8a7f70] py-2">{email || '—'}</p>
        ) : (
          <input
            id="suggest-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={254}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-2.5 text-sm text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
          />
        )}
      </div>

      {/* Message */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label
            htmlFor="suggest-message"
            className="block text-xs font-semibold tracking-widest uppercase text-[#8a7f70]"
          >
            Your idea
          </label>
          <span className="text-xs text-[#b0a898]">
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

      {/* Turnstile — self-hides when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset */}
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
