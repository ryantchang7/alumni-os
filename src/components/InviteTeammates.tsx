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

      {/* Share button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={handleShareClubhouse}
          className="inline-flex items-center gap-2.5 bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          Share the Clubhouse
        </button>
        <p className="text-xs text-white/45 mt-2.5">
          Sends a link via your phone&rsquo;s share sheet, or copies it on desktop.
        </p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/30" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teammates by name..."
            className="w-full bg-white/10 border border-white/15 text-white placeholder-white/35 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/50 focus:border-[#c8a84b]/50 transition-colors"
          />
        </div>
      </div>

      {/* Not-joined list */}
      {notJoined.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Not on the Clubhouse yet
          </p>
          <div className="space-y-2">
            {notJoined.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-3"
              >
                <span className="text-sm font-medium text-white">{t.name}</span>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Already on the Clubhouse
          </p>
          <div className="space-y-2">
            {joined.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3 opacity-70"
              >
                <span className="text-sm text-white/75">{t.name}</span>
                <span className="flex items-center gap-1 text-[11px] text-[#c8a84b] font-medium">
                  <Check className="w-3.5 h-3.5" />
                  On the Clubhouse
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm text-white/45 text-center py-8">No teammates match that search.</p>
      )}

      {/* Copy-link fallback for desktop */}
      <div className="mt-8 pt-6 border-t border-white/10">
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
          className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white/70 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy invite link
        </button>
      </div>
    </div>
  )
}
