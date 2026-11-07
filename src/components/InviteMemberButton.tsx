'use client'

/**
 * "Invite them" on an unclaimed card, for a member who is already in.
 *
 * Both the Member Book grid and a card's own page asked "Is this you?" on
 * every unclaimed card, to everybody. To a signed-in member that is the wrong
 * question twice over: they already know who they are, and they are the one
 * person on the page who can actually do something about the card being
 * empty. 370 of 404 cards are unclaimed, so for a member the book is mostly a
 * list of people to pull in.
 *
 * Sends through the same share path as Your Era, so the message names the
 * sender and points at the card rather than the front door.
 */

import { useState } from 'react'
import { UserPlus, Check } from 'lucide-react'
import { shareInvite } from '@/lib/invite/share'

export default function InviteMemberButton({
  name,
  bookId,
  viewerName,
  variant = 'inline',
}: {
  name: string
  bookId?: string | null
  viewerName?: string | null
  /** 'inline' sits inside a card in the grid; 'block' is the card footer. */
  variant?: 'inline' | 'block'
}) {
  const [state, setState] = useState<'idle' | 'sent'>('idle')
  const [note, setNote] = useState<string | null>(null)

  async function go(e: React.MouseEvent) {
    // Grid entries are wrapped in a Link to the card, so this must not
    // navigate out from under the share sheet.
    e.preventDefault()
    e.stopPropagation()
    const result = await shareInvite({ name, bookId }, viewerName)
    if (result !== 'manual') setState('sent')
    setNote(
      result === 'shared'
        ? null
        : result === 'copied'
          ? 'Message copied'
          : 'Could not open your share sheet',
    )
    if (result !== 'shared') setTimeout(() => setNote(null), 2600)
  }

  const label = state === 'sent' ? 'Invite sent' : `Invite ${name.split(' ')[0]}`

  if (variant === 'block') {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={go}
          className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#d4b75a] text-[#0a1628] text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
        >
          {state === 'sent' ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {label}
        </button>
        {note && <span className="text-[11.5px] text-ink-muted">{note}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={go}
      className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#990000] hover:text-[#0a1628] transition-colors"
    >
      {state === 'sent' ? (
        <Check className="w-3 h-3" aria-hidden />
      ) : (
        <UserPlus className="w-3 h-3" aria-hidden />
      )}
      {note ?? (state === 'sent' ? 'Invite sent' : 'Invite them')}
    </button>
  )
}
