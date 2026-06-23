'use client'

/**
 * Cloudflare Turnstile widget. Renders ONLY when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is set — until then this component renders nothing and the surrounding form
 * is visually + behaviorally unchanged. The server verifier (src/lib/turnstile.ts)
 * is likewise a no-op until TURNSTILE_SECRET_KEY is set, so with no keys the
 * whole feature is inert.
 *
 * Reports the solved token (or null on expiry/error) via onToken so the parent
 * can include it as `turnstileToken` in its POST body.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      theme?: 'light' | 'dark' | 'auto'
      size?: 'normal' | 'compact' | 'flexible'
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export default function TurnstileWidget({
  onToken,
  className,
}: {
  onToken: (token: string | null) => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  const render = useCallback(() => {
    if (!SITE_KEY) return
    if (!window.turnstile || !containerRef.current) return
    if (widgetIdRef.current) return // already rendered
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: 'light',
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    })
  }, [onToken])

  useEffect(() => {
    if (scriptReady) render()
    const widgetId = widgetIdRef.current
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId)
        } catch {
          // widget may already be gone — ignore
        }
        widgetIdRef.current = null
      }
    }
  }, [scriptReady, render])

  // No key configured → render nothing so the form is unchanged.
  if (!SITE_KEY) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className={className} />
    </>
  )
}
