'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSiteContent } from '@/lib/site-content/use-site-content'

function LoginInner() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/account/setup'
  const error = params.get('error')
  const body = useSiteContent(
    'login.body',
    'Sign in to claim your Member Book card and keep your profile up to date.',
  )

  // Plenty of alumni do not have a Google account, so the same door opens with
  // an emailed link.
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function requestLink(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setEmailError(null)
    try {
      const res = await fetch('/api/sign-in-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
      })
      if (res.ok) setSent(true)
      else {
        const data = await res.json().catch(() => null)
        setEmailError(data?.error ?? 'Something went wrong. Try again.')
      }
    } catch {
      setEmailError('Something went wrong. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-60px)] flex items-center justify-center px-6 py-16 bg-[#fbf9f6]">
      <div
        className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
        style={{
          boxShadow:
            '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-3">
          Penn Men&rsquo;s Golf
        </p>
        <h1
          className="text-[#0a1628] text-3xl font-medium mb-2 font-heading"
        >
          Sign in to the Clubhouse
        </h1>
        <p className="text-[13px] text-ink-muted mb-8 leading-relaxed">
          {body}
        </p>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: next })}
          className="w-full inline-flex items-center justify-center gap-3 bg-[#0a1628] hover:bg-[#112240] text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors"
        >
          <span
            aria-hidden
            className="inline-block w-4 h-4 rounded-sm bg-white text-[#0a1628] text-[10px] font-bold leading-4"
          >
            G
          </span>
          Continue with Google
        </button>

        {sent ? (
          <div className="mt-6 rounded-lg border border-[rgba(180,168,150,0.5)] bg-[#fbf9f6] px-5 py-4">
            <p className="text-[13px] text-[#0a1628] font-medium mb-1">Check your email</p>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              If {email} is a working address, a sign-in link is on its way. It
              works once and lasts 15 minutes.
            </p>
          </div>
        ) : showEmail ? (
          <form onSubmit={requestLink} className="mt-6 text-left">
            <label
              htmlFor="signin-email"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-2"
            >
              Email address
            </label>
            <input
              id="signin-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[rgba(180,168,150,0.6)] bg-white px-4 py-3 text-sm text-[#0a1628] outline-none focus:border-[#0a1628]"
            />
            <button
              type="submit"
              disabled={sending}
              className="mt-3 w-full inline-flex items-center justify-center rounded-lg border border-[#0a1628] px-6 py-3 text-sm font-medium text-[#0a1628] transition-colors hover:bg-[#0a1628] hover:text-white disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Email me a sign-in link'}
            </button>
            {emailError && <p className="mt-3 text-[12px] text-[#990000]">{emailError}</p>}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="mt-4 w-full inline-flex items-center justify-center rounded-lg border border-[rgba(180,168,150,0.7)] px-6 py-3 text-sm font-medium text-[#0a1628] transition-colors hover:bg-[#fbf9f6]"
          >
            Use my email instead
          </button>
        )}

        {error && (
          <p className="text-[12px] text-[#990000] mt-5">
            Sign-in failed. Please try again.
          </p>
        )}

        <p className="text-[11px] text-ink-muted mt-8">
          New here? After signing in you&rsquo;ll find your name in the Member Book and claim your card.
        </p>
        <Link
          href="/member-book"
          className="inline-block mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
        >
          Browse the Member Book first &rarr;
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-60px)] flex items-center justify-center text-sm text-ink-muted">
          Loading...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}
