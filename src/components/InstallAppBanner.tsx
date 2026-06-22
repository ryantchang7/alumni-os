'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DISMISS_KEY = 'pgc-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Dismissible "Add to Home Screen" prompt. On Android/Chrome it uses the native
// install prompt; on iOS Safari (no native prompt) it shows the manual steps.
// Hidden when already installed or previously dismissed.
export default function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {
      /* private mode — show anyway */
    }

    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)

    // iOS Safari has no beforeinstallprompt — detect and show manual steps.
    const ua = window.navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
    if (isIOS && isSafari) {
      setIosHint(true)
      setShow(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    setDeferred(null)
    dismiss()
  }

  return (
    <div
      role="dialog"
      aria-label="Install Penn Golf Clubhouse"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#c8a84b]/30 bg-[#0a1628] px-4 py-3 shadow-[0_8px_30px_rgba(10,22,40,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-11 w-11 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] font-semibold leading-tight text-white"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Add to your home screen
          </p>
          {iosHint ? (
            <p className="mt-0.5 text-[12px] leading-snug text-white/70">
              Tap the Share button, then{' '}
              <span className="font-medium text-[#c8a84b]">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] leading-snug text-white/70">
              Open the Clubhouse like an app — one tap.
            </p>
          )}
        </div>
        {!iosHint && (
          <button
            onClick={install}
            className="flex-shrink-0 rounded-lg bg-[#c8a84b] px-3.5 py-2 text-[13px] font-semibold text-[#0a1628] transition-colors hover:bg-[#d4b85c]"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 text-white/50 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
