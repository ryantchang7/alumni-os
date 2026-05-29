'use client'

/**
 * Inline "Respond" button — opens (or finds) a 1-1 chat with a target
 * account and routes the viewer into the thread. Same machinery as
 * MessageMemberButton, but trimmed down to a small inline form factor
 * for use inside compact cards (e.g. OpenRequestStrip).
 *
 * `kickoff` is the message the viewer probably wants to send first.
 * We don't currently inject it into the chat thread input (would
 * require thread-page changes); we stash it in sessionStorage so a
 * future iteration can pick it up.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  targetAccountId: string
  /** Label shown on the button. */
  label?: string
  /** Optional pre-composed first line. */
  kickoff?: string
  /** Background color. */
  bgColor?: string
  /** Hover color (defaults to bgColor). */
  hoverColor?: string
  /** Extra class names applied alongside the inline-flex + size styles. */
  className?: string
}

export default function RespondButton({
  targetAccountId,
  label = 'Respond',
  kickoff,
  bgColor = '#0a1628',
  hoverColor,
  className = '',
}: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signedIn = status === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId
  const isSelf = signedIn && session?.accountId === targetAccountId

  if (isSelf) return null

  if (!approved) {
    return (
      <Link
        href={signedIn ? '/account/setup' : '/login?next=/the-course'}
        className={`inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white px-3.5 py-2 rounded-lg transition-colors ${className}`}
        style={{ backgroundColor: bgColor }}
      >
        Sign in to {label.toLowerCase()}
      </Link>
    )
  }

  async function openChat() {
    setBusy(true)
    setError(null)
    try {
      if (kickoff && typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(
            `chat:kickoff:${targetAccountId}`,
            kickoff,
          )
        } catch {
          // sessionStorage can throw in private browsing — best-effort only
        }
      }
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberAccountIds: [targetAccountId] }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.conversation?.id) {
        throw new Error(j?.error ?? "Couldn't start chat")
      }
      router.push(`/chat/${j.conversation.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat')
      setBusy(false)
    }
  }

  return (
    <div className={`inline-flex flex-col items-stretch gap-1 ${className}`}>
      <button
        type="button"
        onClick={openChat}
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white px-3.5 py-2 rounded-lg transition-colors disabled:opacity-60"
        style={{ backgroundColor: bgColor }}
        onMouseEnter={e => {
          if (hoverColor) e.currentTarget.style.backgroundColor = hoverColor
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = bgColor
        }}
      >
        {busy ? 'Opening…' : label}
      </button>
      {error && <p className="text-[10.5px] text-[#990000]">{error}</p>}
    </div>
  )
}
