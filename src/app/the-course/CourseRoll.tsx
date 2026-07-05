'use client'

/**
 * Course Roll — bunched, searchable list of every course mentioned by
 * a Penn Golf member (home or favorite). Click a course to expand and
 * see exactly who's at it; home-course members rise to the top of each
 * expanded list.
 *
 * Replaces the old read-only "Pine Valley · 3 members" line so a Penn
 * Golf member can answer the question that actually matters: "who do I
 * know at Pine Valley?"
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import MemberAvatar from '@/components/MemberAvatar'

export interface CourseRollMember {
  personId: string
  name: string
  isHome: boolean
  photoUrl?: string | null
}

export interface CourseRollEntry {
  course: string
  members: CourseRollMember[]
  isHomeForAnyone: boolean
}

interface Props {
  entries: CourseRollEntry[]
}

export default function CourseRoll({ entries }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => e.course.toLowerCase().includes(q))
  }, [entries, query])

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      {/* Search input — sticky-feeling header so the user always has
          somewhere to type as they scroll the list. */}
      <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.25)] flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#b0a898]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search courses…"
            aria-label="Search the Course Roll"
            className="w-full bg-[#fdfcf9] border border-[rgba(180,168,150,0.45)] rounded-md pl-8 pr-7 py-1.5 text-[12.5px] text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-1.5 flex items-center px-1 text-[#b0a898] hover:text-[#0a1628]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-[11px] text-ink-muted whitespace-nowrap">
          {filtered.length} {filtered.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-6 text-[12.5px] text-ink-muted italic">
          No courses match.
        </p>
      ) : (
        <ul>
          {filtered.map(entry => {
            const isOpen = open === entry.course
            // Home members rise to the top of the expanded list.
            const sortedMembers = [...entry.members].sort((a, b) => {
              if (a.isHome !== b.isHome) return a.isHome ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            return (
              <li
                key={entry.course}
                className="border-b border-[rgba(180,168,150,0.22)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : entry.course)}
                  className="w-full text-left px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#fdfcf9] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                    )}
                    <span
                      className="text-[14px] text-[#0a1628] leading-snug truncate font-heading"
                    >
                      {entry.course}
                    </span>
                    {entry.isHomeForAnyone && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Home course
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-ink-muted whitespace-nowrap">
                    {entry.members.length}{' '}
                    {entry.members.length === 1 ? 'member' : 'members'}
                  </span>
                </button>
                {isOpen && (
                  <ul className="bg-[#fdfcf9] border-t border-[rgba(180,168,150,0.22)]">
                    {sortedMembers.map(m => (
                      <li
                        key={`${entry.course}:${m.personId}`}
                        className="border-b border-[rgba(180,168,150,0.18)] last:border-b-0"
                      >
                        <Link
                          href={`/player/alumni/${encodeURIComponent(m.personId)}?teamSlug=penn-mens-golf`}
                          className="block px-5 py-2.5 text-[13px] text-[#0a1628] hover:bg-white transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <MemberAvatar photoUrl={m.photoUrl} name={m.name} size={28} tone="navy" />
                            <span className="truncate">{m.name}</span>
                          </span>
                          {m.isHome && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2d6a4f] whitespace-nowrap">
                              Home
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
