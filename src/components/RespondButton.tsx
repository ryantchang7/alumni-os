'use client'

/**
 * Inline "Respond" button — opens (or finds) a 1-1 chat with a target
 * account and routes the viewer into the thread. Same machinery as
 * MessageMemberButton, but trimmed down to a small inline form factor
 * for use inside compact cards (e.g. OpenRequestStrip).
 *
 * `kickoff` is the message the viewer probably wants to send first. It is
 * handed to the thread through sessionStorage, keyed by the conversation id
 * that the POST below returns, and ChatThreadClient pulls it into the
 * composer on mount and clears the key.
 *
 * For most of this product's life it was stashed under the target's account
 * id and read by nobody, which made every "Say hello" and "Respond" button
 * a dead end: the card composed a specific, warm opening line, threw it
 * away, and dropped the member on a blank text box facing someone they had
 * not spoken to in twenty years. RSVPs, the one thing that takes a single
 * tap, were the only member action anyone was doing.
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
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberAccountIds: [targetAccountId] }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.conversation?.id) {
        throw new Error(j?.error ?? "Couldn't start chat")
      }
      const conversationId: string = j.conversation.id
      // Keyed by conversation, not by target: the thread is what reads it,
      // and it is the only id both sides of the hand-off agree on.
      if (kickoff && typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(`chat:kickoff:${conversationId}`, kickoff)
        } catch {
          // sessionStorage can throw in private browsing — best-effort only
        }
      }
      router.push(`/chat/${conversationId}`)
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
