'use client'

/**
 * Where an emailed sign-in link lands.
 *
 * The token is redeemed by a POST from this page rather than by the GET that
 * opened it, so the link scanners that Gmail and Outlook run over inbound mail
 * cannot burn a link before the member clicks it.
 */

import { Suspense, useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type State = 'working' | 'failed'

function LinkInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>('working')
  const started = useRef(false)

  useEffect(() => {
    // React runs effects twice in dev; a second run would spend the token.
    if (started.current) return
    started.current = true

    const token = params.get('token')
    const nextParam = params.get('next')
    const next = nextParam?.startsWith('/') ? nextParam : '/account/setup'
    if (!token) {
      setState('failed')
      return
    }

    signIn('email-link', { token, redirect: false })
      .then(res => {
        if (res?.ok && !res.error) router.replace(next)
        else setState('failed')
      })
      .catch(() => setState('failed'))
  }, [params, router])

  return (
    <div className="min-h-[calc(100dvh-60px)] flex items-center justify-center px-6 py-16 bg-[#fbf9f6]">
      <div
        className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-3">
          Penn Men&rsquo;s Golf
        </p>
        {state === 'working' ? (
          <>
            <h1 className="text-[#0a1628] text-2xl font-medium mb-2 font-heading">
              Signing you in
            </h1>
            <p className="text-[13px] text-ink-muted leading-relaxed">One moment.</p>
          </>
        ) : (
          <>
            <h1 className="text-[#0a1628] text-2xl font-medium mb-2 font-heading">
              That link has expired
            </h1>
            <p className="text-[13px] text-ink-muted mb-7 leading-relaxed">
              Sign-in links work once and last 15 minutes. Ask for a fresh one and
              it will be in your inbox in a few seconds.
            </p>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center bg-[#0a1628] hover:bg-[#112240] text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors"
            >
              Send me a new link
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function EmailLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-60px)] flex items-center justify-center text-sm text-ink-muted">
          Loading...
        </div>
      }
    >
      <LinkInner />
    </Suspense>
  )
}
