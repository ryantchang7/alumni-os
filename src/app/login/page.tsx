'use client'

import { Suspense } from 'react'
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
    'Sign in with Google to claim your Member Book card and keep your profile up to date.',
  )

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
