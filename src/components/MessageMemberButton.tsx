'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MessageSquare } from 'lucide-react'

interface Props {
  /** Account id of the member being viewed. Required — without it we can't
   * find or create a direct chat. */
  targetAccountId: string
  /** Display name for nicer button copy. */
  targetFirstName?: string
}

/**
 * Renders a "Message" button on a member's profile. When clicked:
 *  - if the viewer isn't signed in / approved, routes them to sign-in
 *  - otherwise POSTs to /api/chat/conversations with the target as the only
 *    other member; the endpoint is idempotent and returns the existing
 *    direct chat if one is already open
 *  - redirects the viewer to /chat/[id]
 */
export default function MessageMemberButton({ targetAccountId, targetFirstName }: Props) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const approved =
    sessionStatus === 'authenticated' && !!session?.linkedPersonId
  const isSelf =
    sessionStatus === 'authenticated' && session?.accountId === targetAccountId

  if (isSelf) return null

  if (sessionStatus === 'loading') {
    return (
      <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted px-4 py-2.5">
        Loading…
      </span>
    )
  }

  if (!approved) {
    return (
      <Link
        href={sessionStatus === 'authenticated' ? '/account/setup' : '/login?next=/member-book'}
        className="inline-flex items-center gap-2 bg-[#f8f5f0] border border-[rgba(180,168,150,0.55)] text-[#3d4a5c] hover:bg-white hover:border-[#0a1628]/30 text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Sign in to message
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
        throw new Error(j?.error ?? `Couldn't start chat (${res.status})`)
      }
      router.push(`/chat/${j.conversation.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat')
      setBusy(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={openChat}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {busy ? 'Opening…' : targetFirstName ? `Message ${targetFirstName}` : 'Send a message'}
      </button>
      {error && <p className="text-[11px] text-[#990000]">{error}</p>}
    </div>
  )
}
