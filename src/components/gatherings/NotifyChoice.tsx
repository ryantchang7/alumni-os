'use client'

/**
 * Who hears about this round.
 *
 * Posting used to always mail everyone whose card put them in the same place,
 * which is right for an open tee time and wrong for four guys who already know
 * they are playing. Three choices, defaulting to the old behaviour so nothing
 * changes for a host who does not touch it.
 *
 * Shared by /the-course/host and /19th-hole/host.
 */

import { useMemo, useState } from 'react'

export type NotifyMode = 'nearby' | 'invite' | 'quiet'

export interface InviteOption {
  bookId: string
  name: string
}

interface Props {
  mode: NotifyMode
  onModeChange: (m: NotifyMode) => void
  invited: InviteOption[]
  onInvitedChange: (next: InviteOption[]) => void
  options: InviteOption[]
  /** "round" | "gathering" — only used in the copy. */
  noun?: string
  placeLabel?: string
}

const CHOICES: Array<{ id: NotifyMode; label: string; hint: (noun: string, place: string) => string }> = [
  {
    id: 'nearby',
    label: 'Everyone nearby',
    hint: (noun, place) => `Members whose card puts them ${place}. This is how a ${noun} finds people you have not met.`,
  },
  {
    id: 'invite',
    label: 'Only people I pick',
    hint: noun => `Just the members you choose below. Nobody else gets an email, and the ${noun} still shows on the board.`,
  },
  {
    id: 'quiet',
    label: 'Nobody, just post it',
    hint: noun => `Goes on the board with no email at all. Useful for a placeholder ${noun} you will fill in later.`,
  },
]

export default function NotifyChoice({
  mode,
  onModeChange,
  invited,
  onInvitedChange,
  options,
  noun = 'round',
  placeLabel = 'in that area',
}: Props) {
  const [query, setQuery] = useState('')

  const picked = useMemo(() => new Set(invited.map(i => i.bookId)), [invited])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return options
      .filter(o => !picked.has(o.bookId) && o.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, options, picked])

  return (
    <div>
      <p className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
        Who hears about it
      </p>
      <div className="space-y-2">
        {CHOICES.map(c => {
          const active = mode === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onModeChange(c.id)}
              aria-pressed={active}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                active
                  ? 'border-[#0a1628] bg-[#0a1628] text-white'
                  : 'border-[rgba(180,168,150,0.5)] bg-white hover:border-[#0a1628]/40'
              }`}
            >
              <span className={`block text-[13.5px] font-medium ${active ? 'text-white' : 'text-[#0a1628]'}`}>
                {c.label}
              </span>
              <span className={`block text-[12px] mt-0.5 leading-snug ${active ? 'text-white/70' : 'text-ink-muted'}`}>
                {c.hint(noun, placeLabel)}
              </span>
            </button>
          )
        })}
      </div>

      {mode === 'invite' && (
        <div className="mt-3 rounded-lg border border-[rgba(180,168,150,0.5)] bg-[#fdfcf9] px-4 py-3">
          {invited.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {invited.map(i => (
                <span
                  key={i.bookId}
                  className="inline-flex items-center gap-1.5 bg-[#0a1628] text-white text-[12px] rounded-full pl-3 pr-1.5 py-1"
                >
                  {i.name}
                  <button
                    type="button"
                    onClick={() => onInvitedChange(invited.filter(x => x.bookId !== i.bookId))}
                    aria-label={`Remove ${i.name}`}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/35 leading-none text-[11px]"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search the Member Book"
            className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[13.5px] text-[#0a1628] outline-none focus:border-[#0a1628]"
          />
          {matches.length > 0 && (
            <ul className="mt-2 max-h-44 overflow-auto rounded-lg border border-[rgba(180,168,150,0.4)] bg-white">
              {matches.map(m => (
                <li key={m.bookId}>
                  <button
                    type="button"
                    onClick={() => {
                      onInvitedChange([...invited, m])
                      setQuery('')
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#0a1628] hover:bg-[#fbf9f6]"
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {invited.length === 0 && !query && (
            <p className="text-[12px] text-ink-muted mt-2">
              Nobody picked yet, so nobody will be emailed.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
