'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { slugToIndustry, memberHasIndustry } from '@/lib/industries'
import { memberBookEntries } from '@/lib/member-book/data'
import MemberBadges from '@/components/MemberBadges'
import FoundersWall from '@/components/FoundersWall'
import type { FounderEntry, FamilySupporterEntry } from '@/lib/founders'
import type { BadgeId } from '@/lib/badges'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import SectionEmblemHeader from '@/components/SectionEmblemHeader'
import MemberAvatar from '@/components/MemberAvatar'
import {
  filterPublicMembers,
  DEFAULT_PUBLIC_FILTERS,
  type PublicMemberFilters,
} from '@/lib/member-book/filters'
import {
  getPublicMembers,
  getPublicMemberStats,
  getMemberPennGolfYears,
  getMemberHometownLabel,
  isActiveMember,
} from '@/lib/member-book/helpers'
import type {
  MemberBookEntry,
  EraFilter,
  SortMode,
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
]

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'most_recent', label: 'Most Recent' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'first_letter_year', label: 'Earliest Year' },
]

function HeroPlaque({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <p
        className="text-5xl sm:text-6xl font-light text-white leading-none font-heading"
      >
        {value}
      </p>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/50">
        {label}
      </p>
    </div>
  )
}

function RegistryEntry({
  member,
  index,
  badges,
  photoUrl,
}: {
  member: MemberBookEntry
  index: number
  badges?: BadgeId[]
  photoUrl?: string | null
}) {
  const years = getMemberPennGolfYears(member)
  const hometown = getMemberHometownLabel(member)
  const isCurrent = isActiveMember(member)
  const classYear = member.profile.classYearEstimate
    ? `Class of ${member.profile.classYearEstimate}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.01, 0.18) }}
      data-testid="member-entry"
    >
      <Link
        href={`/member-book/${encodeURIComponent(member.id)}`}
        className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-5 transition-all hover:border-[#0a1628]/30 hover:-translate-y-0.5"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04), 0 2px 8px rgba(10,22,40,0.03)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <MemberAvatar photoUrl={photoUrl} name={member.displayName} size={48} tone="navy" />
            <div className="min-w-0 flex-1">
              <p
                className="text-[#0a1628] text-[17px] font-medium leading-snug font-heading"
              >
                {member.displayName}
              </p>
              {badges && badges.length > 0 && (
                <div className="mt-1.5">
                  <MemberBadges badges={badges} size="sm" />
                </div>
              )}
              {years && (
                <p className="text-[13px] text-[#3d4a5c] mt-1.5">{years}</p>
              )}
              <div className="text-[12.5px] text-ink-muted mt-0.5 leading-relaxed">
                {classYear && <p>{classYear}</p>}
                {hometown && <p>{hometown}</p>}
              </div>
            </div>
          </div>
          {member.role === 'coach' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full text-[#c8a84b] bg-[#0a1628] border border-[#c8a84b]/55 whitespace-nowrap mt-1">
              Coach
            </span>
          ) : isCurrent ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/20 whitespace-nowrap mt-1">
              Current Player
            </span>
          ) : null}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#990000] mt-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          View Member &rarr;
        </p>
      </Link>
    </motion.div>
  )
}

function FamilyRegistryEntry({
  entry,
  index,
}: {
  entry: ParentEntry
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.01, 0.18) }}
      data-testid="family-entry"
    >
      <Link
        href={`/player/alumni/${encodeURIComponent(entry.personId)}`}
        className="group block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-5 transition-all hover:border-[#990000]/35 hover:-translate-y-0.5"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04), 0 2px 8px rgba(10,22,40,0.03)' }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <MemberAvatar photoUrl={entry.photoUrl} name={entry.canonicalName} size={48} tone="red" />
          <div className="min-w-0 flex-1">
            <p
              className="text-[#0a1628] text-[17px] font-medium leading-snug font-heading"
            >
              {entry.canonicalName}
            </p>
            {entry.badges && entry.badges.length > 0 && (
              <div className="mt-1.5">
                <MemberBadges badges={entry.badges} size="sm" />
              </div>
            )}
            {entry.parentRelationship && (
              <p className="text-[13px] text-[#3d4a5c] mt-1.5 leading-snug">
                {entry.parentRelationship}
              </p>
            )}
          </div>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#990000] mt-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          View profile &rarr;
        </p>
      </Link>
    </motion.div>
  )
}

function BookHeader({
  members,
  earliestYear,
  latestYear,
}: {
  members: number
  earliestYear: number | null
  latestYear: number | null
}) {
  const subtitle = useSiteContent(
    'member-book.subtitle',
    'A registry of Penn Men’s Golf members, across generations.',
  )
  const scopeNote = useSiteContent(
    'member-book.scope-note',
    "Penn Women's Golf coming as we bring the data in.",
  )
  const rangeLabel =
    earliestYear && latestYear ? `${earliestYear} — ${latestYear}` : null
  return (
    <SectionEmblemHeader
      eyebrow="Penn Men's Golf"
      title="The Member Book"
      subtitle={subtitle}
      emblemSrc="/emblems/member-book.png"
      emblemAlt="Penn Golf member book emblem"
      maxWidth="1280px"
      titleTestId="member-book-title"
    >
      {scopeNote && (
        <p className="text-white/40 text-[12.5px] sm:text-[13px] max-w-xl italic -mt-1">
          {scopeNote}
        </p>
      )}
      <div className="mt-4" data-testid="member-book-stats">
        <HeroPlaque value={members} label="Members" />
        {rangeLabel && (
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/40 mt-2">
            {rangeLabel}
          </p>
        )}
      </div>
    </SectionEmblemHeader>
  )
}

interface ParentEntry {
  personId: string
  canonicalName: string
  parentRelationship?: string
  photoUrl?: string
  badges?: BadgeId[]
}

type RegistryView = 'all' | 'family'

function MemberBookPageInner() {
  const searchParams = useSearchParams()
  // ?industry=finance → "Finance" (canonical label). Null when no
  // filter is active; an empty string when the slug doesn't resolve to
  // a known industry.
  const industrySlug = searchParams.get('industry')
  const activeIndustry = industrySlug ? slugToIndustry(industrySlug) : null

  const [filters, setFilters] = useState<PublicMemberFilters>(
    DEFAULT_PUBLIC_FILTERS,
  )
  const [view, setView] = useState<RegistryView>('all')
  const [badgesByBookId, setBadgesByBookId] = useState<Record<string, BadgeId[]>>({})
  const [photosByBookId, setPhotosByBookId] = useState<Record<string, string>>({})
  const [industryByPersonId, setIndustryByPersonId] = useState<Record<string, string>>({})
  const [bookIdToPersonId, setBookIdToPersonId] = useState<Record<string, string>>({})
  const [parents, setParents] = useState<ParentEntry[]>([])
  const [founders, setFounders] = useState<FounderEntry[]>([])
  const [familySupporters, setFamilySupporters] = useState<FamilySupporterEntry[]>([])

  useEffect(() => {
    fetch('/api/player/profiles?teamSlug=penn-mens-golf')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d?.profiles) return
        const nextBadges: Record<string, BadgeId[]> = {}
        const nextPhotos: Record<string, string> = {}
        const nextIndustry: Record<string, string> = {}
        const nextBookIdToPerson: Record<string, string> = {}
        const nextParents: ParentEntry[] = []
        for (const p of d.profiles as Array<{
          personId: string
          canonicalName: string
          memberRole?: string
          parentRelationship?: string
          bookId?: string | null
          photoUrl?: string | null
          industry?: string | null
          badges?: BadgeId[]
        }>) {
          if (p.bookId && p.badges && p.badges.length > 0) {
            nextBadges[p.bookId] = p.badges
          }
          if (p.bookId && p.photoUrl) {
            nextPhotos[p.bookId] = p.photoUrl
          }
          if (p.bookId) {
            nextBookIdToPerson[p.bookId] = p.personId
          }
          if (p.industry) {
            nextIndustry[p.personId] = p.industry
          }
          if (p.memberRole === 'parent') {
            nextParents.push({
              personId: p.personId,
              canonicalName: p.canonicalName,
              parentRelationship: p.parentRelationship,
              photoUrl: p.photoUrl ?? undefined,
              badges: p.badges,
            })
          }
        }
        setBadgesByBookId(nextBadges)
        setPhotosByBookId(nextPhotos)
        setIndustryByPersonId(nextIndustry)
        setBookIdToPersonId(nextBookIdToPerson)
        setParents(nextParents)
      })
      .catch(() => {})

    fetch('/api/founders')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.founders) setFounders(d.founders as FounderEntry[])
        if (d?.familySupporters)
          setFamilySupporters(d.familySupporters as FamilySupporterEntry[])
      })
      .catch(() => {})
  }, [])

  const publicMembers = useMemo(() => getPublicMembers(memberBookEntries), [])
  const stats = useMemo(() => getPublicMemberStats(publicMembers), [publicMembers])

  const filtered = useMemo(() => {
    let rows = filterPublicMembers(publicMembers, filters)
    // Industry filter (?industry=finance) — keep only members whose
    // stored industry tags include the active label. Member Book rows
    // are matched via bookId → personId → industry.
    if (activeIndustry) {
      rows = rows.filter(m => {
        const pid = bookIdToPersonId[m.id]
        if (!pid) return false
        return memberHasIndustry(industryByPersonId[pid], activeIndustry)
      })
    }
    return rows
  }, [publicMembers, filters, activeIndustry, bookIdToPersonId, industryByPersonId])

  // Parents filter by the search term and (when active) the industry tag.
  const filteredParents = useMemo(() => {
    let rows = parents
    const q = filters.search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(p =>
        [p.canonicalName, p.parentRelationship ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    if (activeIndustry) {
      rows = rows.filter(p =>
        memberHasIndustry(industryByPersonId[p.personId], activeIndustry),
      )
    }
    return rows
  }, [parents, filters.search, activeIndustry, industryByPersonId])

  const update = <K extends keyof PublicMemberFilters>(
    key: K,
    value: PublicMemberFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }))

  const clearAll = () => setFilters(DEFAULT_PUBLIC_FILTERS)
  const hasActiveFilters =
    filters.search !== '' || filters.era !== 'all'

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <BookHeader
        members={stats.members + parents.length}
        earliestYear={stats.earliestYear}
        latestYear={stats.latestYear}
      />

      {/* Active industry filter banner — appears when navigated to
          /member-book?industry=<slug>. Click X to clear and see all. */}
      {activeIndustry && (
        <div className="bg-[#990000] text-white">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[12.5px] sm:text-[13px]">
              <span className="opacity-70 uppercase tracking-[0.16em] text-[10.5px] mr-2">
                Filtering by Industry
              </span>
              <span
                className="font-medium font-heading"
              >
                {activeIndustry}
              </span>
            </p>
            <Link
              href="/member-book"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Link>
          </div>
        </div>
      )}

      {/* Subtab pill bar — sits on a navy strip immediately under the
          hero, matching the /moments All-vs-Locker treatment. The Family
          pill uses Penn red since that's the tier's accent everywhere
          else in the app. */}
      <div className="bg-[#0a1628] border-t border-[rgba(255,255,255,0.06)] border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('all')}
            aria-pressed={view === 'all'}
            className={`inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.18em] px-5 py-2.5 rounded-lg transition-all ${
              view === 'all'
                ? 'bg-white text-[#0a1628] shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                : 'text-white/55 hover:text-white border border-transparent'
            }`}
          >
            All Members
            <span
              className={`text-[10.5px] tabular-nums px-1.5 py-0.5 rounded-full ${
                view === 'all'
                  ? 'bg-[#0a1628]/10 text-[#0a1628]'
                  : 'bg-white/10 text-white/65'
              }`}
            >
              {stats.members + parents.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setView('family')}
            aria-pressed={view === 'family'}
            className={`inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.18em] px-5 py-2.5 rounded-lg transition-all ${
              view === 'family'
                ? 'bg-[#990000] text-white shadow-[0_2px_18px_rgba(153,0,0,0.45)]'
                : 'text-[#f4ecdb]/75 hover:text-white border border-[#990000]/45 hover:bg-[#990000]/15'
            }`}
          >
            Family &amp; Affiliate
            <span
              className={`text-[10.5px] tabular-nums px-1.5 py-0.5 rounded-full ${
                view === 'family'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#990000]/15 text-[#f4ecdb]/85'
              }`}
            >
              {parents.length}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="-mt-6 relative z-10 pb-20">
          {/* Toolbar */}
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden mb-7"
            style={{
              boxShadow: '0 2px 8px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)',
            }}
          >
            <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-[rgba(180,168,150,0.25)]">
              <div className="flex-1 relative min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-[#b0a898]" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => update('search', e.target.value)}
                  aria-label="Search the Member Book"
                  placeholder="Search by name, year, or hometown..."
                  className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-2.5 pl-10 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
                />
                {filters.search && (
                  <button
                    onClick={() => update('search', '')}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-2 flex items-center px-1 text-[#b0a898] hover:text-[#0a1628]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-xs text-ink-muted ml-auto">
                <span
                  className="font-semibold text-[#0a1628]"
                  data-testid="member-results-count"
                >
                  {view === 'family' ? filteredParents.length : filtered.length}
                </span>{' '}
                {(view === 'family' ? filteredParents.length : filtered.length) === 1
                  ? 'member'
                  : 'members'}
              </span>
            </div>

            {/* Era chips + sort — players-only metadata, so hide on
                the Family & Affiliate tab. */}
            {view === 'all' && (
              <div className="px-5 py-3.5 flex items-center gap-2 flex-wrap">
                <div className="flex flex-wrap gap-1.5" data-testid="era-filter">
                  {ERA_OPTIONS.map((o) => {
                    const active = o.value === filters.era
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => update('era', o.value)}
                        aria-pressed={active}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                          active
                            ? 'bg-[#0a1628] text-white border-[#0a1628]'
                            : 'bg-[#faf7f2] text-[#3d4a5c] border-[rgba(180,168,150,0.45)] hover:border-[#0a1628]/40'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[11px] text-ink-muted">
                    <span className="font-semibold uppercase tracking-wider">Sort</span>
                    <select
                      value={filters.sort}
                      onChange={(e) => update('sort', e.target.value as SortMode)}
                      aria-label="Sort the Member Book"
                      className="bg-[#faf7f2] border border-[rgba(180,168,150,0.45)] rounded-md px-2 py-1 text-[11px] text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]/20 transition-colors"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-ink-muted hover:text-[#0a1628] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Founders Wall — only on the All Members view. */}
          {view === 'all' && founders.length > 0 && (
            <div className="mb-7">
              <FoundersWall founders={founders} familySupporters={familySupporters} />
            </div>
          )}

          {view === 'all' ? (
            <>
              {/* Player + coach grid */}
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p
                    className="text-lg text-[#0a1628] mb-2 font-heading"
                  >
                    No members found.
                  </p>
                  <p className="text-sm text-ink-muted mb-5">
                    Try a different name, year, or era.
                  </p>
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold uppercase tracking-wider text-[#990000] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div
                    data-testid="member-book-grid"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {filtered.map((m, i) => (
                      <RegistryEntry
                        key={m.id}
                        member={m}
                        index={i}
                        badges={badgesByBookId[m.id]}
                        photoUrl={photosByBookId[m.id]}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}

              {/* Family & Affiliate group — appended below the main
                  registry on the All Members tab. Subhead doubles as a
                  recruiting CTA when zero or more parents exist. */}
              {filteredParents.length > 0 && (
                <div className="mt-10 pt-8 border-t border-[rgba(180,168,150,0.4)]">
                  <div className="flex items-baseline justify-between gap-4 mb-5 flex-wrap">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-1">
                        Family &amp; Affiliate
                      </p>
                      <p
                        className="text-[#0a1628] text-2xl font-heading"
                      >
                        Family and longtime supporters of Penn Men&rsquo;s Golf.
                      </p>
                    </div>
                    <Link
                      href="/parent-signup"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#990000] hover:underline whitespace-nowrap"
                    >
                      Join as family &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredParents.map((p, i) => (
                      <FamilyRegistryEntry key={p.personId} entry={p} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Family & Affiliate dedicated view */
            <>
              {filteredParents.length === 0 ? (
                <div
                  className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-10 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
                >
                  <p
                    className="text-[#0a1628] text-lg font-medium mb-2 font-heading"
                  >
                    {parents.length === 0 ? 'No family members yet.' : 'No matches.'}
                  </p>
                  <p className="text-[13px] text-ink-muted max-w-md mx-auto mb-6">
                    {parents.length === 0
                      ? 'Parents, family, and longtime supporters of Penn Men’s Golf can join the Clubhouse too.'
                      : 'Try a different name.'}
                  </p>
                  <Link
                    href="/parent-signup"
                    className="inline-block bg-[#990000] hover:bg-[#7a0000] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Join as family
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredParents.map((p, i) => (
                    <FamilyRegistryEntry key={p.personId} entry={p} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Suspense wrapper — useSearchParams() requires the component that reads
// it to live inside a <Suspense> boundary in Next 16.
function MemberBookSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] animate-pulse">
      {/* Header */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-16">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-10 w-1/2 bg-white/15 rounded" />
        </div>
      </div>
      {/* Cards */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 mt-8 space-y-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl h-20" />
        ))}
      </div>
    </div>
  )
}

export default function MemberBookPage() {
  return (
    <Suspense fallback={<MemberBookSkeleton />}>
      <MemberBookPageInner />
    </Suspense>
  )
}
