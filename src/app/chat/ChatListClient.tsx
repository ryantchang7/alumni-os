'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, Users } from 'lucide-react'

interface ConversationCard {
  id: string
  type: 'direct' | 'group'
  title: string
  otherMemberNames: string[]
  lastMessageAt?: string
  lastMessagePreview?: string
  lastMessageFromName?: string
  unreadCount: number
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - Date.parse(iso)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

export default function ChatListClient() {
  const [items, setItems] = useState<ConversationCard[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchOnce() {
      try {
        const res = await fetch('/api/chat/conversations')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (!cancelled) {
          setItems(data.conversations ?? [])
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed')
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    fetchOnce()
    const iv = setInterval(fetchOnce, 10_000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [])

  if (!loaded) {
    return <p className="text-sm text-[#8a7f70] text-center py-8">Loading…</p>
  }

  return (
    <>
      <div className="flex items-center justify-end mb-5">
        <Link
          href="/chat/new"
          className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Start a chat
        </Link>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg text-[13px] text-[#990000]">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-2xl p-10 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
        >
          <MessageSquare className="w-7 h-7 text-[#c8a84b] mx-auto mb-3" />
          <p
            className="text-[#0a1628] text-lg font-medium mb-1"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            No conversations yet.
          </p>
          <p className="text-[13px] text-[#8a7f70] mb-5 max-w-sm mx-auto">
            Start a thread with an alum or a small group. Messages stay between members.
          </p>
          <Link
            href="/chat/new"
            className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[12px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Start a chat
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="block bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-5 py-4 hover:border-[#0a1628]/30 hover:shadow-[0_4px_16px_rgba(10,22,40,0.08)] transition-all"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#0a1628] ring-1 ring-[#c8a84b]/25 flex items-center justify-center flex-shrink-0 text-white shadow-[0_2px_6px_rgba(10,22,40,0.18)]">
                      {c.type === 'group' ? <Users className="w-5 h-5" /> : <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>{c.title.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[#0a1628] text-[15px] leading-snug truncate ${c.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {c.title}
                      </p>
                      {c.lastMessagePreview && (
                        <p className={`text-[12.5px] truncate mt-0.5 ${c.unreadCount > 0 ? 'text-[#0a1628]' : 'text-[#3d4a5c]'}`}>
                          {c.lastMessageFromName ? <span className="text-[#8a7f70]">{c.lastMessageFromName}: </span> : null}
                          {c.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-[#8a7f70]">{timeAgo(c.lastMessageAt)}</span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-[#990000] text-white text-[11px] font-semibold px-1.5">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
