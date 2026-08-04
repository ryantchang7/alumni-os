'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const DISMISS_KEY = 'pgc-install-dismissed'

// Never compete with the pages where someone is trying to get in. /launch is
// the URL in the alumni email, and the banner is bottom-fixed: on an iPhone it
// landed straight on top of "Claim Your Member Card".
const SUPPRESSED = ['/launch', '/login', '/account/setup', '/account/pending', '/parent-signup']

// Wait for a sign of interest before asking for anything. Either is enough.
const DWELL_MS = 15000
const SCROLL_PX = 500

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
  const [engaged, setEngaged] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const suppressed = SUPPRESSED.some(r => pathname === r || pathname.startsWith(r + '/'))

  // Only ask once someone has stuck around or scrolled — never on first paint.
  useEffect(() => {
    if (suppressed) return
    const arm = () => setEngaged(true)
    const onScroll = () => {
      if (window.scrollY > SCROLL_PX) arm()
    }
    const t = setTimeout(arm, DWELL_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [suppressed])

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

  const visible = show && engaged && !suppressed

  // While it's up it covers the foot of the page, so make room rather than
  // sitting on whatever the last element happens to be.
  useEffect(() => {
    if (!visible) return
    const h = boxRef.current?.offsetHeight ?? 76
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = `${h + 24}px`
    return () => {
      document.body.style.paddingBottom = prev
    }
  }, [visible])

  if (!visible) return null

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
      ref={boxRef}
      role="dialog"
      aria-label="Install Penn Golf Clubhouse"
      className="fixed inset-x-3 z-[60] mx-auto max-w-md"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#c8a84b]/30 bg-[#0a1628] px-4 py-3 shadow-[0_8px_30px_rgba(10,22,40,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-11 w-11 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] font-semibold leading-tight text-white font-heading"
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
              Add it to your home screen — a full app is coming as the family grows.
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
          className="flex-shrink-0 p-1 text-white/75 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
