'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, X } from 'lucide-react'

interface MemberOption {
  accountId: string
  personId?: string
  name: string
  classLabel?: string
}

export default function NewChatPage() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberOption[]>([])
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/chat/members')
      .then(r => (r.ok ? r.json() : { members: [] }))
      .then(d => {
        setMembers(d.members ?? [])
        setLoaded(true)
      })
      .catch(() => {
        setError('Failed to load members')
        setLoaded(true)
      })
  }, [])

  const selectedIds = new Set(selected.map(s => s.accountId))
  const filtered = query.trim()
    ? members.filter(
        m =>
          !selectedIds.has(m.accountId) &&
          m.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : members.filter(m => !selectedIds.has(m.accountId)).slice(0, 24)

  function add(m: MemberOption) {
    setSelected(prev => [...prev, m])
    setQuery('')
  }
  function remove(accountId: string) {
    setSelected(prev => prev.filter(m => m.accountId !== accountId))
  }

  async function handleSubmit() {
    if (selected.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberAccountIds: selected.map(s => s.accountId),
          name: selected.length >= 2 ? name.trim() || undefined : undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Failed to start chat')
      }
      const j = await res.json()
      router.push(`/chat/${j.conversation.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="px-5 sm:px-8 py-5 border-b border-[rgba(180,168,150,0.35)]">
        <div className="max-w-[680px] mx-auto flex items-center justify-between">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#3d4a5c] hover:text-[#0a1628] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Chat
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]">
            New Chat
          </p>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-10">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <div className="px-7 py-6 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
            <h1
              className="text-[#0a1628] text-2xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Start a chat
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-2">
              Pick one alum for a direct message, or a few for a group chat.
            </p>
          </div>

          <div className="px-7 py-6 space-y-4">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map(s => (
                  <span
                    key={s.accountId}
                    className="inline-flex items-center gap-1.5 bg-[#0a1628] text-white text-[12px] px-3 py-1.5 rounded-full"
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={() => remove(s.accountId)}
                      aria-label={`Remove ${s.name}`}
                      className="hover:text-[#c8a84b] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7f70]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search members…"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>

            {!loaded && (
              <p className="text-[13px] text-[#8a7f70] text-center py-4">Loading members…</p>
            )}

            {loaded && filtered.length === 0 && (
              <p className="text-[13px] text-[#8a7f70] text-center py-4">
                {members.length === 0
                  ? 'No other approved members yet.'
                  : 'No matches.'}
              </p>
            )}

            {filtered.length > 0 && (
              <ul className="max-h-80 overflow-y-auto divide-y divide-[rgba(180,168,150,0.25)] -mx-7 px-7">
                {filtered.map(m => (
                  <li key={m.accountId}>
                    <button
                      type="button"
                      onClick={() => add(m)}
                      className="w-full text-left py-3 flex items-center gap-3 hover:bg-[#faf7f2] -mx-7 px-7 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-[11px] font-semibold">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#0a1628] truncate">{m.name}</p>
                        {m.classLabel && (
                          <p className="text-[11px] text-[#8a7f70]">{m.classLabel}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selected.length >= 2 && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                  Group name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Friday Foursome"
                  maxLength={80}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
            )}

            {error && (
              <p className="text-[13px] text-[#990000]">{error}</p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selected.length === 0}
                className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Start chat'}
              </button>
              <Link href="/chat" className="text-[12px] text-[#8a7f70] hover:text-[#0a1628]">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
