'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, AlertCircle, Trash2 } from 'lucide-react'

interface ChatMessage {
  id: string
  conversationId: string
  fromAccountId: string
  fromName: string
  body: string
  createdAt: string
  editedAt?: string
  deletedAt?: string
  // Client-only flags for optimistic state
  pending?: boolean
  failed?: boolean
}

interface Props {
  conversationId: string
  title: string
  subtitle: string
  currentAccountId: string
  initialMessages: ChatMessage[]
}

const BASE_INTERVAL_MS = 4000
const MAX_INTERVAL_MS = 30000

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function fmtDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function shouldShowDaySeparator(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev) return true
  return new Date(prev.createdAt).toDateString() !== new Date(curr.createdAt).toDateString()
}

export default function ChatThreadClient({
  conversationId,
  title,
  subtitle,
  currentAccountId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [msgBusy, setMsgBusy] = useState(false)

  async function saveEdit(id: string) {
    const body = editDraft.trim()
    if (!body) return
    setMsgBusy(true)
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, body, editedAt: new Date().toISOString() } : m)))
        setEditingId(null)
      }
    } finally {
      setMsgBusy(false)
    }
  }

  async function removeMessage(id: string) {
    setMsgBusy(true)
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, body: '', deletedAt: new Date().toISOString() } : m)))
      }
    } finally {
      setMsgBusy(false)
    }
  }
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = useCallback(async () => {
    const sure = window.confirm(
      'Delete this conversation for everyone in it? This cannot be undone.',
    )
    if (!sure) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      router.push('/chat')
      router.refresh()
    } catch {
      setDeleting(false)
      window.alert('Could not delete the conversation, try again.')
    }
  }, [conversationId, router])

  const lastSeenAt = useRef<string | null>(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].createdAt
      : null,
  )
  const failureCount = useRef(0)
  const pollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  const markRead = useCallback(() => {
    fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {})
  }, [conversationId])

  // Initial read mark.
  useEffect(() => {
    markRead()
  }, [markRead])

  const poll = useCallback(async () => {
    try {
      const url = lastSeenAt.current
        ? `/api/chat/conversations/${conversationId}/messages?since=${encodeURIComponent(lastSeenAt.current)}`
        : `/api/chat/conversations/${conversationId}/messages`
      const res = await fetch(url)
      if (!res.ok) throw new Error('poll failed')
      const data = await res.json()
      const incoming: ChatMessage[] = data.messages ?? []
      if (incoming.length > 0) {
        const newest = incoming[incoming.length - 1].createdAt
        lastSeenAt.current = newest
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id))
          const additions = incoming.filter(m => !existing.has(m.id))
          if (additions.length === 0) return prev
          return [...prev, ...additions]
        })
        scrollToBottom()
        markRead()
      }
      failureCount.current = 0
      setReconnecting(false)
    } catch {
      failureCount.current += 1
      if (failureCount.current >= 2) setReconnecting(true)
    }
  }, [conversationId, scrollToBottom, markRead])

  // Polling loop with visibility-pause + exponential backoff.
  useEffect(() => {
    let cancelled = false

    function delay(): number {
      if (failureCount.current === 0) return BASE_INTERVAL_MS
      const exp = BASE_INTERVAL_MS * 2 ** (failureCount.current - 1)
      return Math.min(exp, MAX_INTERVAL_MS)
    }

    async function step() {
      if (cancelled) return
      if (document.visibilityState === 'visible') {
        await poll()
      }
      if (cancelled) return
      pollTimeout.current = setTimeout(step, delay())
    }

    pollTimeout.current = setTimeout(step, BASE_INTERVAL_MS)

    function onVis() {
      if (document.visibilityState === 'visible') {
        // Fast catch-up when refocusing.
        if (pollTimeout.current) clearTimeout(pollTimeout.current)
        step()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelled = true
      if (pollTimeout.current) clearTimeout(pollTimeout.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [poll])

  async function sendMessage(retryFromTempId?: string) {
    let bodyText = draft.trim()
    let tempId: string
    if (retryFromTempId) {
      const m = messages.find(x => x.id === retryFromTempId)
      if (!m) return
      bodyText = m.body
      tempId = retryFromTempId
      setMessages(prev =>
        prev.map(x => (x.id === tempId ? { ...x, pending: true, failed: false } : x)),
      )
    } else {
      if (!bodyText) return
      tempId = `temp-${crypto.randomUUID()}`
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        fromAccountId: currentAccountId,
        fromName: 'You',
        body: bodyText,
        createdAt: new Date().toISOString(),
        pending: true,
      }
      setMessages(prev => [...prev, optimistic])
      setDraft('')
      scrollToBottom()
    }

    setSending(true)
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: bodyText }),
      })
      if (!res.ok) throw new Error('send failed')
      const data = await res.json()
      const real: ChatMessage = { ...data.message, pending: false }
      setMessages(prev => prev.map(m => (m.id === tempId ? real : m)))
      lastSeenAt.current = real.createdAt
    } catch {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[#fbf9f6] flex flex-col" style={{ height: 'calc(100dvh - 60px)' }}>
      {/* Header */}
      <div className="bg-[#0a1628] px-5 sm:px-8 py-4 sticky top-[60px] z-10">
        <div className="max-w-[820px] mx-auto flex items-center justify-between gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Chats
          </Link>
          <div className="text-center flex-1 min-w-0">
            <p
              className="text-white text-[15px] font-medium leading-tight truncate font-heading"
            >
              {title}
            </p>
            <p className="text-[10px] text-white/75 uppercase tracking-[0.16em]">{subtitle}</p>
          </div>
          <div className="w-12 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete this conversation"
              title="Delete this conversation"
              className="text-white/60 hover:text-[#ff6b6b] transition-colors disabled:opacity-40 p-1.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {reconnecting && (
        <div className="bg-[#990000]/10 border-b border-[#990000]/25 px-5 py-1.5 text-center text-[11.5px] text-[#990000]">
          Reconnecting…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5">
        <div className="max-w-[680px] mx-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-[13px] text-ink-muted italic py-12">
              Say hi. This is just between you and the other members.
            </p>
          )}
          {messages.map((m, i) => {
            const mine = m.fromAccountId === currentAccountId
            const showDay = shouldShowDaySeparator(messages[i - 1], m)
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[rgba(180,168,150,0.3)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted bg-[#fdfcf9] border border-[rgba(180,168,150,0.4)] px-2.5 py-0.5 rounded-full">
                      {fmtDay(m.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-[rgba(180,168,150,0.3)]" />
                  </div>
                )}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!mine && (
                      <p className="text-[11px] font-medium text-ink-muted mb-1 ml-3.5 tracking-wide">{m.fromName}</p>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                        mine
                          ? 'bg-[#0a1628] text-white rounded-br-md shadow-[0_2px_10px_rgba(10,22,40,0.16)]'
                          : 'bg-white text-[#0a1628] border border-[rgba(180,168,150,0.45)] rounded-bl-md shadow-[0_1px_2px_rgba(10,22,40,0.05)]'
                      }`}
                    >
                      {m.deletedAt ? (
                        <span className="italic opacity-60">Message deleted</span>
                      ) : editingId === m.id ? (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <textarea
                            value={editDraft}
                            onChange={e => setEditDraft(e.target.value)}
                            rows={2}
                            maxLength={4000}
                            className={`w-full rounded-lg px-2.5 py-1.5 text-[14px] resize-none focus:outline-none ${
                              mine ? 'bg-white/10 text-white placeholder-white/40' : 'bg-[#fdfcf9] text-[#0a1628] border border-[rgba(180,168,150,0.5)]'
                            }`}
                          />
                          <div className="flex gap-3 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={`text-[11px] ${mine ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-[#0a1628]'}`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={msgBusy || !editDraft.trim()}
                              onClick={() => saveEdit(m.id)}
                              className={`text-[11px] font-semibold disabled:opacity-40 ${mine ? 'text-[#c8a84b]' : 'text-[#990000]'}`}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        m.body
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 ${mine ? 'mr-3' : 'ml-3'}`}>
                      <span className="text-[10.5px] text-ink-muted">
                        {m.pending ? 'Sending…' : fmtTime(m.createdAt)}
                      </span>
                      {m.editedAt && !m.deletedAt && (
                        <span className="text-[10.5px] text-ink-muted italic">edited</span>
                      )}
                      {mine && !m.pending && !m.failed && !m.deletedAt && editingId !== m.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setEditDraft(m.body); setEditingId(m.id) }}
                            className="text-[10.5px] text-ink-muted hover:text-[#0a1628] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={msgBusy}
                            onClick={() => removeMessage(m.id)}
                            className="text-[10.5px] text-ink-muted hover:text-[#990000] transition-colors disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {m.failed && (
                        <button
                          type="button"
                          onClick={() => sendMessage(m.id)}
                          className="inline-flex items-center gap-1 text-[10.5px] text-[#990000] hover:underline"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Failed, retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-[rgba(180,168,150,0.35)] bg-white px-5 sm:px-8 py-4 shadow-[0_-2px_12px_rgba(10,22,40,0.05)]">
        <div className="max-w-[680px] mx-auto flex items-end gap-2.5">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Type a message…"
            className="flex-1 bg-[#fdfcf9] border border-[rgba(180,168,150,0.5)] rounded-2xl px-4 py-3 text-[14px] text-[#0a1628] placeholder-[#b5ad9e] resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30 transition-colors"
            style={{ maxHeight: 160 }}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={sending || !draft.trim()}
            aria-label="Send"
            className="bg-[#0a1628] hover:bg-[#112240] disabled:opacity-40 text-white p-3 rounded-full transition-colors flex-shrink-0 shadow-[0_2px_8px_rgba(10,22,40,0.2)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
