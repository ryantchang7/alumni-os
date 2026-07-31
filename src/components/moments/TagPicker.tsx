'use client'

/**
 * TagPicker — chips + search + dropdown for tagging Member Book members
 * in a Moment. Shared by the composer (/moments/new) and MomentEditForm.
 *
 * Chips carry either a bookId (Member Book tag, claimed or not) or a bare
 * personId (legacy tags from before book-wide tagging) so edits round-trip
 * losslessly. `key` is unique across both kinds.
 */

import { useState } from 'react'

export interface TagChip {
  key: string
  name: string
  bookId: string | null
  personId?: string
}

interface Props {
  options: { bookId: string; name: string }[]
  tagged: TagChip[]
  onChange: (next: TagChip[]) => void
  label?: string
}

export default function TagPicker({ options, tagged, onChange, label = 'Tag who’s in it' }: Props) {
  const [query, setQuery] = useState('')

  return (
    <div>
      {label && (
        <label className="block text-[13px] font-semibold text-[#0a1628] mb-1.5">
          {label} <span className="font-normal text-ink-muted">(optional)</span>
        </label>
      )}
      {tagged.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tagged.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(tagged.filter(x => x.key !== t.key))}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-[#0a1628] text-white px-2.5 py-1 rounded-full hover:bg-[#990000] transition-colors"
              title="Remove tag"
            >
              {t.name}
              <span aria-hidden>&times;</span>
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search members to tag..."
        className="w-full bg-[#fdfcf9] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25"
      />
      {query.trim() && (
        <div className="mt-1.5 border border-[rgba(180,168,150,0.4)] rounded-lg bg-white divide-y divide-[rgba(180,168,150,0.2)] overflow-hidden">
          {options
            .filter(
              m =>
                !tagged.some(t => t.bookId === m.bookId) &&
                m.name.toLowerCase().includes(query.trim().toLowerCase()),
            )
            .slice(0, 6)
            .map(m => (
              <button
                key={m.bookId}
                type="button"
                onClick={() => {
                  onChange([...tagged, { key: m.bookId, name: m.name, bookId: m.bookId }])
                  setQuery('')
                }}
                className="block w-full text-left px-4 py-2 text-sm text-[#0a1628] hover:bg-[#fbf9f6]"
              >
                {m.name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
