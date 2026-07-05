'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Bell, Check } from 'lucide-react'

// ── Types mirror the /api/notifications payload ────────────────────────────────
interface AppNotification {
  id: string
  type: 'request' | 'approved' | 'new_member' | 'new_moment'
  title: string
  body: string
  href?: string
  createdAt: string
  readAt?: string
}

interface NotificationsResponse {
  notifications: AppNotification[]
  unreadCount: number
  mutedCommunity: boolean
  pushConfigured: boolean
}

const POLL_MS = 60_000

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// VAPID public keys are URL-safe base64; the browser's pushManager wants an
// application server key as a BufferSource. We return a fresh ArrayBuffer
// (not a Uint8Array view) so the type is unambiguously ArrayBuffer-backed —
// TS rejects Uint8Array here because its buffer could be a SharedArrayBuffer.
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buffer
}

export default function NotificationBell() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const approved = status === 'authenticated' && !!session?.linkedPersonId

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [mutedCommunity, setMutedCommunity] = useState(false)
  const [pushConfigured, setPushConfigured] = useState(false)
  // 'unsupported' | 'default' | 'granted' | 'denied'
  const [permission, setPermission] = useState<string>('default')
  const [pushBusy, setPushBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as NotificationsResponse
      setItems(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
      setMutedCommunity(data.mutedCommunity === true)
      setPushConfigured(data.pushConfigured === true)
    } catch {
      /* network blip — keep last state */
    }
  }, [])

  // Detect Notification permission support on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  // Poll while approved: on mount, every 60s, and when the tab becomes
  // visible again. visibilitychange alone covers refocus — listening to
  // 'focus' too double-fired the fetch on every tab switch.
  useEffect(() => {
    if (!approved) return
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [approved, refresh])

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markAllRead = useCallback(async () => {
    setUnread(0)
    setItems(prev => prev.map(n => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch {
      /* optimistic — next poll reconciles */
    }
  }, [])

  const onItemClick = useCallback(
    async (n: AppNotification) => {
      setOpen(false)
      if (!n.readAt) {
        setUnread(u => Math.max(0, u - 1))
        setItems(prev => prev.map(x => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)))
        try {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id }),
          })
        } catch {
          /* optimistic */
        }
      }
      if (n.href) router.push(n.href)
    },
    [router],
  )

  const enablePush = useCallback(async () => {
    setPushBusy(true)
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const keyRes = await fetch('/api/push/public-key', { cache: 'no-store' })
      if (!keyRes.ok) return
      const { key } = (await keyRes.json()) as { key: string | null }
      if (!key) return

      const reg = await navigator.serviceWorker.ready
      // Reuse an existing subscription if the browser already has one.
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(key),
        })
      }
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
    } catch {
      /* permission denied or push unsupported — in-app still works */
    } finally {
      setPushBusy(false)
    }
  }, [])

  const toggleMute = useCallback(async () => {
    const next = !mutedCommunity
    setMutedCommunity(next)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutedCommunity: next }),
      })
    } catch {
      setMutedCommunity(!next) // revert on failure
    }
  }, [mutedCommunity])

  // Only approved members get a bell.
  if (!approved) return null

  const showEnablePush =
    pushConfigured && permission !== 'granted' && permission !== 'unsupported'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex items-center justify-center h-9 w-9 rounded-full text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-[#c8a84b]/50 focus:outline-none"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#c8a84b] text-[#0a1628] text-[10px] font-bold leading-[16px] text-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] bg-white border border-[rgba(180,168,150,0.4)] rounded-xl shadow-[0_8px_30px_rgba(10,22,40,0.25)] overflow-hidden text-[#0a1628] z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(180,168,150,0.25)] bg-[#fdfcf9]">
            <span
              className="text-[14px] font-semibold font-heading"
            >
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[12px] text-[#990000] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-gray-500">
                You&rsquo;re all caught up.
              </p>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[rgba(180,168,150,0.18)] last:border-0 hover:bg-[#fdfcf9] transition-colors ${
                    n.readAt ? '' : 'bg-[#fcfaf6]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#c8a84b]" />
                    )}
                    <div className={`min-w-0 flex-1 ${n.readAt ? 'pl-4' : ''}`}>
                      <p className="text-[13px] font-semibold leading-snug truncate">{n.title}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-gray-600 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer: enable-push + community mute */}
          <div className="border-t border-[rgba(180,168,150,0.25)] bg-[#fdfcf9] px-4 py-3 space-y-2.5">
            {showEnablePush && (
              <button
                type="button"
                onClick={enablePush}
                disabled={pushBusy}
                className="w-full rounded-lg bg-[#0a1628] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#13233f] transition-colors disabled:opacity-60"
              >
                {pushBusy ? 'Turning on…' : 'Turn on notifications'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              className="flex w-full items-center justify-between text-[12px] text-gray-600 hover:text-[#0a1628]"
            >
              <span>Community updates</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  mutedCommunity
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-[#c8a84b]/20 text-[#8a6d1f]'
                }`}
              >
                {!mutedCommunity && <Check className="h-3 w-3" />}
                {mutedCommunity ? 'Muted' : 'On'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
