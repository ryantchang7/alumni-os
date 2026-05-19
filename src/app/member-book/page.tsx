'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import {
  memberBookEntries,
  memberBookCounts,
} from '@/lib/member-book/data'
import { filterMembers, DEFAULT_FILTERS } from '@/lib/member-book/filters'
import {
  getMemberBookStats,
  getMemberBadges,
  getMemberYearRange,
  getMemberDisplaySeasons,
  formatLetterYears,
  formatSeasons,
  getAllLetterYears,
  LETTER_YEAR_NOTE,
  hasRosterSeasons,
} from '@/lib/member-book/helpers'
import type {
  MemberBookEntry,
  MemberBookFilters,
  EraFilter,
  RoleFilter,
  LetterFilter,
  SortMode,
  MemberBadge,
} from '@/lib/member-book/types'

const ERA_OPTIONS: { value: EraFilter; label: string }[] = [
  { value: 'all', label: 'All Eras' },
  { value: '2020s', label: '2020s' },
  { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' },
  { value: '1990s', label: '1990s' },
  { value: '1980s', label: '1980s' },
  { value: '1970s', label: '1970s' },
  { value: '1960s', label: '1960s' },
  { value: '1950s', label: '1950s' },
  { value: '1940s', label: '1940s' },
  { value: '1930s', label: '1930s' },
]

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'most_recent', label: 'Most recent first' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'first_letter_year', label: 'Earliest letter year' },
  { value: 'last_letter_year', label: 'Latest letter year' },
]

const toneStyles: Record<MemberBadge['tone'], string> = {
  navy: 'text-[#0a1628] bg-[#0a1628]/8 border-[#0a1628]/15',
  red: 'text-[#990000] bg-[#990000]/8 border-[#990000]/20',
  green: 'text-[#2d6a4f] bg-[#2d6a4f]/8 border-[#2d6a4f]/20',
  tan: 'text-[#8a7f70] bg-[#f5f2ee] border-[rgba(180,168,150,0.5)]',
  neutral: 'text-[#8a7f70] bg-[#f8f5f0] border-[rgba(180,168,150,0.35)]',
}

function Plaque({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p
        className="text-3xl sm:text-4xl font-light text-white leading-none"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mt-1.5">
        {label}
      </p>
    </div>
  )
}

function BadgePill({ badge }: { badge: MemberBadge }) {
  return (
    <span
      className={`inline-flex text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${toneStyles[badge.tone]}`}
    >
      {badge.label}
    </span>
  )
}

function MemberDetailPanel({ member }: { member: MemberBookEntry }) {
  const seasons = getMemberDisplaySeasons(member)
  const isInferred = !hasRosterSeasons(member) && seasons.length > 0
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden border-t border-[rgba(180,168,150,0.3)] bg-[#fbf8f3]"
    >
      <div className="px-5 py-4 space-y-3.5 text-xs text-[#3d4a5c]">
        {member.letterWinner.isLetterWinner && member.letterWinner.years.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70] mb-1">
              Letter History
            </p>
            <p className="leading-relaxed">
              {member.letterWinner.years.length} letter
              {member.letterWinner.years.length === 1 ? '' : 's'}
              {' · '}
              {member.letterWinner.years.join(', ')}
            </p>
            <p className="text-[10px] text-[#b0a898] mt-1 italic">
              Letter years are listed as ending years (e.g. 2004 = 2003–04 season).
            </p>
          </div>
        )}
        {seasons.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70] mb-1">
              {isInferred ? 'Inferred Seasons' : 'Roster Seasons'}
            </p>
            <p className="leading-relaxed">{seasons.join(' · ')}</p>
            {isInferred && (
              <p className="text-[10px] text-[#b0a898] mt-1 italic">
                Inferred from letter-winner years; not yet independently verified against the roster archive.
              </p>
            )}
          </div>
        )}
        {(member.profile.hometown || member.profile.highSchool || member.profile.classYearEstimate) && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70] mb-1">
              Penn Golf Profile
            </p>
            <div className="space-y-0.5">
              {member.profile.classYearEstimate && (
                <p>Class of {member.profile.classYearEstimate}</p>
              )}
              {member.profile.hometown && <p>{member.profile.hometown}</p>}
              {member.profile.highSchool && (
                <p className="text-[#8a7f70]">{member.profile.highSchool}</p>
              )}
            </div>
          </div>
        )}
        {member.review.needsRosterCheck && (
          <div className="rounded-md border border-[rgba(180,168,150,0.5)] bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70] mb-0.5">
              Data Note
            </p>
            <p className="text-[#3d4a5c] leading-relaxed">
              Member appears in the Penn Men&apos;s Golf all-time letter-winner record. Roster-season detail
              is still being independently verified.
            </p>
          </div>
        )}
        <div className="pt-1 flex items-center gap-3 text-[10px] text-[#b0a898]">
          <span>Member ID: {member.id}</span>
        </div>
      </div>
    </motion.div>
  )
}

function RegistryEntry({
  member,
  index,
  expanded,
  onToggle,
}: {
  member: MemberBookEntry
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const badges = getMemberBadges(member)
  const yearRange = getMemberYearRange(member)
  const lwYears = member.letterWinner.years
  const seasons = getMemberDisplaySeasons(member)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.012, 0.2) }}
      data-testid="member-entry"
      className="bg-white border border-[rgba(180,168,150,0.3)] rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04), 0 2px 8px rgba(10,22,40,0.03)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left px-5 py-4 hover:bg-[#fbf8f3] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#0a1628] text-sm leading-snug">
              {member.displayName}
            </p>
            <p className="text-xs text-[#8a7f70] mt-0.5">
              {yearRange ? `Penn Golf ${yearRange}` : 'Penn Men’s Golf'}
              {lwYears.length > 0 && (
                <>
                  {' · '}
                  <span className="text-[#3d4a5c]">
                    {lwYears.length} letter{lwYears.length === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </p>
            {seasons.length > 0 && (
              <p className="text-[11px] text-[#3d4a5c] mt-1 leading-snug truncate">
                {formatSeasons(seasons)}
              </p>
            )}
            {lwYears.length > 0 && (
              <p className="text-[11px] text-[#8a7f70] mt-0.5 truncate">
                Letter years · {formatLetterYears(lwYears)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
              {badges.slice(0, 3).map((b) => (
                <BadgePill key={b.kind} badge={b} />
              ))}
            </div>
            <span className="text-[#b0a898]">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && <MemberDetailPanel member={member} />}
      </AnimatePresence>
    </motion.div>
  )
}

function BookHeader({
  total,
  letterWinners,
  totalLetterYears,
  managers,
}: {
  total: number
  letterWinners: number
  totalLetterYears: number
  managers: number
}) {
  return (
    <div className="bg-[#0a1628] px-5 sm:px-8 pt-10 pb-16">
      <div className="max-w-[1320px] mx-auto">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
          Penn Men’s Golf · Member Book
        </p>
        <h1
          className="text-white text-3xl sm:text-4xl font-medium leading-tight tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
          data-testid="member-book-title"
        >
          Penn Men&rsquo;s Golf Member Book
        </h1>
        <p className="text-white/55 text-sm max-w-2xl">
          A private registry of Penn Men&rsquo;s Golf letter winners, managers, and modern roster
          records across generations.
        </p>
        <p className="text-white/35 text-[11px] mt-2 max-w-2xl">{LETTER_YEAR_NOTE}</p>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div
            className="grid grid-cols-2 sm:flex sm:items-start sm:divide-x sm:divide-white/10 gap-y-5"
            data-testid="member-book-stats"
          >
            <div className="sm:pr-8">
              <Plaque value={total} label="Members" />
            </div>
            <div className="sm:px-8">
              <Plaque value={letterWinners} label="Letter Winners" />
            </div>
            <div className="sm:px-8">
              <Plaque value={totalLetterYears} label="Letter Years" />
            </div>
            <div className="sm:px-8">
              <Plaque value={managers} label="Managers" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataNotes() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-10 bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#fbf8f3] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#990000]" />
          <span className="text-sm font-semibold text-[#0a1628]">About this Member Book</span>
        </div>
        <span className="text-[#b0a898]">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[rgba(180,168,150,0.3)]"
          >
            <div className="px-5 py-4 text-xs text-[#3d4a5c] space-y-2 leading-relaxed">
              <p>
                Letter years are <strong>ending years</strong>. For example, a letter year of{' '}
                <strong>2004</strong> refers to the <strong>2003–04 season</strong>.
              </p>
              <p>
                Some historical roster seasons are still being independently verified. Members
                flagged as <em>Needs Roster Check</em> appear in the official all-time letter-winner
                record; their precise roster seasons are being reconciled with archival sources.
              </p>
              <p>
                Managers are included because they appear in the official Penn Men&rsquo;s Golf
                letter-winner record. Modern roster records (2000–2026) without a corresponding
                letter-winner entry are also included when present in the archive.
              </p>
              <p className="text-[#8a7f70]">
                Primary source: Penn Men&rsquo;s Golf All-Time Letter Winners record. Roster
                verification: pennathletics.com 2000–2026 roster archive.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MemberBookPage() {
  const [filters, setFilters] = useState<MemberBookFilters>(DEFAULT_FILTERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = useMemo(() => getMemberBookStats(memberBookEntries), [])
  const allLetterYears = useMemo(() => getAllLetterYears(memberBookEntries), [])

  const filtered = useMemo(
    () => filterMembers(memberBookEntries, filters),
    [filters],
  )

  const hasActiveFilters =
    filters.search !== '' ||
    filters.role !== 'all' ||
    filters.letter !== 'all' ||
    filters.era !== 'all' ||
    filters.year !== null

  const update = <K extends keyof MemberBookFilters>(key: K, value: MemberBookFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const clearAll = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <BookHeader
        total={memberBookCounts.membersTotal}
        letterWinners={stats.letterWinners}
        totalLetterYears={stats.totalLetterYears}
        managers={stats.managers}
      />

      <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
        <div className="-mt-6 relative z-10 pb-16">
          {/* Toolbar */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden mb-5"
            style={{
              boxShadow: '0 2px 8px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)',
            }}
          >
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b border-[rgba(180,168,150,0.25)]">
              <div className="flex-1 relative min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-[#b0a898]" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => update('search', e.target.value)}
                  aria-label="Search members"
                  placeholder="Search by name, hometown, school..."
                  className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-2 pl-9 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
                />
                {filters.search && (
                  <button
                    onClick={() => update('search', '')}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-2 flex items-center px-1 text-[#b0a898] hover:text-[#0a1628]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-[#8a7f70] ml-auto">
                <span
                  className="font-semibold text-[#0a1628]"
                  data-testid="member-results-count"
                >
                  {filtered.length}
                </span>{' '}
                {filtered.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {/* Filter row */}
            <div className="px-5 py-3 flex items-center gap-2 flex-wrap text-xs">
              <FilterGroup
                label="Role"
                value={filters.role}
                onChange={(v) => update('role', v as RoleFilter)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'player', label: 'Players' },
                  { value: 'manager', label: 'Managers' },
                ]}
              />
              <FilterGroup
                label="Status"
                value={filters.letter}
                onChange={(v) => update('letter', v as LetterFilter)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'letter_winner', label: 'Letter Winners' },
                  { value: 'roster_only', label: 'Roster-only' },
                ]}
              />
              <SelectControl
                label="Era"
                value={filters.era}
                onChange={(v) => update('era', v as EraFilter)}
                options={ERA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <SelectControl
                label="Letter year"
                value={filters.year == null ? '' : String(filters.year)}
                onChange={(v) =>
                  update('year', v === '' ? null : Number.parseInt(v, 10))
                }
                options={[
                  { value: '', label: 'Any year' },
                  ...allLetterYears.map((y) => ({ value: String(y), label: String(y) })),
                ]}
              />
              <SelectControl
                label="Sort"
                value={filters.sort}
                onChange={(v) => update('sort', v as SortMode)}
                options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="ml-auto text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="px-5 pb-3">
              <p className="text-[10px] text-[#b0a898]">{LETTER_YEAR_NOTE}</p>
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-[#0a1628] mb-1">No members match.</p>
              <p className="text-xs text-[#8a7f70] mb-4">
                Try adjusting the search or filters.
              </p>
              <button
                onClick={clearAll}
                className="text-xs font-medium text-[#990000] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div
                data-testid="member-book-grid"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                {filtered.map((m, i) => (
                  <RegistryEntry
                    key={m.id}
                    member={m}
                    index={i}
                    expanded={expandedId === m.id}
                    onToggle={() => setExpandedId((e) => (e === m.id ? null : m.id))}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          <DataNotes />
        </div>
      </div>
    </div>
  )
}

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70]">
        {label}
      </span>
      <div className="flex items-center border border-[rgba(180,168,150,0.45)] rounded-md overflow-hidden bg-[#f8f5f0]">
        {options.map((o, i) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`px-2.5 py-1 text-[11px] transition-colors ${
                i > 0 ? 'border-l border-[rgba(180,168,150,0.4)]' : ''
              } ${
                active
                  ? 'bg-[#0a1628] text-white'
                  : 'text-[#3d4a5c] hover:bg-white'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7f70]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-md px-2 py-1 text-[11px] text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]/20 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
