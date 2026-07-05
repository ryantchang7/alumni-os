'use client'

import { useState, useMemo } from 'react'
import { Search, Check, Share2, Copy } from 'lucide-react'

export interface TeammateEntry {
  name: string
  joined: boolean
}

function getInviteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://www.penngolfclubhouse.com'
}

function buildInviteMessage(name: string, url: string): string {
  const firstName = name.split(' ')[0]
  return 'Hey ' + firstName + ' — claim your spot in the Penn Golf Clubhouse, takes 30 sec: ' + url
}

export default function InviteTeammates({ teammates }: { teammates: TeammateEntry[] }) {
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teammates
    return teammates.filter(t => t.name.toLowerCase().includes(q))
  }, [teammates, query])

  async function handleShareClubhouse() {
    const url = getInviteUrl()
    const title = 'Penn Golf Clubhouse'
    const text = 'Join the Penn Golf Clubhouse — every player & alum in one place.'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // user cancelled or error — silent
      }
      return
    }
    // Desktop fallback: copy link
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard')
    } catch {
      showToast('Copy: ' + url)
    }
  }

  async function handleInvite(name: string) {
    const url = getInviteUrl()
    const message = buildInviteMessage(name, url)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: message, url })
      } catch {
        // user cancelled — silent
      }
      return
    }
    // Desktop fallback: SMS deep-link + copy
    const smsHref = 'sms:?&body=' + encodeURIComponent(message)
    window.location.href = smsHref
    try {
      await navigator.clipboard.writeText(message)
      showToast('Message copied to clipboard')
    } catch {
      showToast('Message ready to send')
    }
  }

  const notJoined = filtered.filter(t => !t.joined)
  const joined = filtered.filter(t => t.joined)

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a1628] text-white text-[12.5px] font-medium px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      {/* Share primary CTA */}
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        <div>
          <p className="font-semibold text-[#0a1628] text-sm">Share the Clubhouse</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Sends a link via your phone&rsquo;s share sheet, or copies it on desktop.
          </p>
        </div>
        <button
          type="button"
          onClick={handleShareClubhouse}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.1)' }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#b0a898]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teammates by name..."
            className="w-full bg-white border border-[rgba(180,168,150,0.5)] text-[#0a1628] placeholder-[#b0a898] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b] transition-colors"
          />
        </div>
      </div>

      {/* Not-joined list */}
      {notJoined.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-3">
            Not on the Clubhouse yet
          </p>
          <div className="space-y-2">
            {notJoined.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between gap-3 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-4 py-3 hover:border-[rgba(180,168,150,0.6)] transition-colors"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
              >
                <span className="text-sm font-medium text-[#0a1628]">{t.name}</span>
                <button
                  type="button"
                  onClick={() => handleInvite(t.name)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0a1628] bg-[#c8a84b] hover:bg-[#b8973b] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joined list */}
      {joined.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-3">
            Already on the Clubhouse
          </p>
          <div className="space-y-2">
            {joined.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between gap-3 bg-[#fdfcf9] border border-[rgba(180,168,150,0.25)] rounded-xl px-4 py-3"
              >
                <span className="text-sm text-ink-muted">{t.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#2d6a4f] font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  On the Clubhouse
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-12 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
        >
          <p className="text-sm text-ink-muted">No teammates match that search.</p>
        </div>
      )}

      {/* Copy-link fallback for desktop */}
      <div className="mt-8 pt-6 border-t border-[rgba(180,168,150,0.35)]">
        <button
          type="button"
          onClick={async () => {
            const url = getInviteUrl()
            try {
              await navigator.clipboard.writeText(url)
              showToast('Link copied')
            } catch {
              showToast('Link: ' + url)
            }
          }}
          className="inline-flex items-center gap-2 text-xs text-ink-muted hover:text-[#0a1628] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy invite link
        </button>
      </div>
    </div>
  )
}
