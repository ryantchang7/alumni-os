'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

interface PlayerProfile {
  personId: string
  canonicalName: string
  firstName?: string
  lastName?: string
  memberRole?: 'current_player' | 'alumni'
  memberStatus?: 'imported' | 'verified' | 'active'
  classLabel?: string
  classYearEstimate?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
    state?: string
  }
  helpTopics?: string[]
  openToGolfRounds?: boolean
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
}

type RoleTab = 'all' | 'current_player' | 'alumni' | 'helping'

const spring = { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.9 }

function isOpenToHelping(p: PlayerProfile) {
  return !!(
    (p.helpTopics && p.helpTopics.length > 0) ||
    p.openToCoffee ||
    p.openToMentorship ||
    p.openToWarmIntroductions ||
    p.openToGolfRounds
  )
}

function hasRichProfile(p: PlayerProfile) {
  return !!(p.career?.currentRole || p.career?.currentCompany || p.career?.city)
}

// ─── Member Registry Entry ────────────────────────────────────────────────
function RegistryEntry({ profile, index, teamSlug }: {
  profile: PlayerProfile
  index: number
  teamSlug: string
}) {
  const isCurrentPlayer = profile.memberRole === 'current_player'
  const rich = hasRichProfile(profile)
  const location = profile.career?.city
    ? [profile.career.city, profile.career.state].filter(Boolean).join(', ')
    : profile.hometown ?? null

  const displayYears = isCurrentPlayer
    ? (profile.classYearEstimate?.split(' / ')[0] ?? profile.classLabel ?? null)
    : profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : null

  const careerLine =
    profile.career?.currentRole && profile.career?.currentCompany
      ? `${profile.career.currentRole}, ${profile.career.currentCompany}`
      : profile.career?.currentRole ?? profile.career?.currentCompany ?? null

  const helpItems = [
    ...(profile.helpTopics ?? []),
    profile.openToCoffee && !profile.helpTopics?.includes('Coffee') ? 'Coffee chat' : null,
    profile.openToMentorship && !profile.helpTopics?.includes('Mentorship') ? 'Mentorship' : null,
    profile.openToWarmIntroductions ? 'Introductions' : null,
    profile.openToGolfRounds ? 'Golf round' : null,
  ].filter((v): v is string => Boolean(v))

  const accentColor = rich
    ? 'border-l-[#990000]'
    : isCurrentPlayer
      ? 'border-l-[#2d6a4f]'
      : 'border-l-[rgba(180,168,150,0.5)]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ ...spring, delay: Math.min(index * 0.025, 0.25) }}
    >
      <Link
        href={`/player/alumni/${profile.personId}?teamSlug=${teamSlug}`}
        className={`flex flex-col h-full bg-white border border-[rgba(180,168,150,0.3)] border-l-2 ${accentColor} rounded-r-xl rounded-l-none hover:shadow-md hover:border-[rgba(180,168,150,0.55)] transition-all group`}
        style={{ boxShadow: '0 1px 4px rgba(10,22,40,0.05), 0 2px 8px rgba(10,22,40,0.03)' }}
        data-testid="member-entry"
      >
        <div className="px-5 py-4">
          {/* Name row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="font-semibold text-[#0a1628] text-sm leading-snug">
                {profile.canonicalName}
              </p>
              {displayYears && (
                <p className="text-xs text-[#8a7f70] mt-0.5">{displayYears}</p>
              )}
            </div>
            <span className={`flex-shrink-0 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap mt-0.5 ${
              isCurrentPlayer
                ? 'text-[#2d6a4f] bg-[#2d6a4f]/8 border-[#2d6a4f]/20'
                : 'text-[#8a7f70] bg-[#f5f2ee] border-[rgba(180,168,150,0.45)]'
            }`}>
              {isCurrentPlayer ? 'Current Player' : 'Alumni'}
            </span>
          </div>

          {/* Career / location */}
          {(careerLine || location) && (
            <div className="mb-2.5 space-y-0.5">
              {careerLine && (
                <p className="text-xs text-[#3d4a5c] leading-snug">{careerLine}</p>
              )}
              {location && (
                <p className="text-xs text-[#8a7f70]">{location}</p>
              )}
            </div>
          )}

          {/* Help topics */}
          {helpItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {helpItems.slice(0, 3).map(t => (
                <span
                  key={t}
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] text-[#0a1628] tracking-wide"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Minimal profile note */}
          {!careerLine && !location && !helpItems.length && !isCurrentPlayer && (
            <p className="text-xs text-[#b0a898] italic mb-2">Profile details coming soon.</p>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between mt-auto pt-1 border-t border-[rgba(180,168,150,0.2)]">
            <span className="text-[10px] font-semibold text-[#990000] uppercase tracking-wide group-hover:underline">
              View Member
            </span>
            {rich && (
              <span className="text-[9px] font-medium text-[#8a7f70] uppercase tracking-wider">
                Request Introduction
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Plaque stat ────────────────────────────────────────────────────────────
function Plaque({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start px-6 sm:px-0 first:pl-0">
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

// ─── Tab button ─────────────────────────────────────────────────────────────
function Tab({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3.5 py-1.5 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-[#990000] text-[#0a1628] font-semibold'
          : 'border-transparent text-[#8a7f70] hover:text-[#0a1628] hover:border-[rgba(180,168,150,0.6)]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Main inner ─────────────────────────────────────────────────────────────
function MemberBookInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleTab, setRoleTab] = useState<RoleTab>('all')
  const [eraFilter, setEraFilter] = useState('all')

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(d => { setProfiles(d.profiles ?? []); setLoading(false) })
      .catch(err => { setFetchError(err.message); setLoading(false) })
  }, [teamSlug])

  const stats = useMemo(() => {
    const alumni = profiles.filter(p => p.memberRole === 'alumni')
    const current = profiles.filter(p => p.memberRole === 'current_player')
    const cities = new Set(profiles.map(p => p.career?.city ?? p.hometown).filter(Boolean))
    return { total: profiles.length, alumni: alumni.length, current: current.length, cities: cities.size }
  }, [profiles])

  const eras = useMemo(() => {
    const decades = new Set(
      profiles.filter(p => p.memberRole === 'alumni' && p.rosterStartYear)
        .map(p => Math.floor((p.rosterStartYear ?? 2000) / 10) * 10),
    )
    return Array.from(decades).sort((a, b) => b - a)
  }, [profiles])

  const helpingCount = useMemo(() => profiles.filter(isOpenToHelping).length, [profiles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles.filter(p => {
      if (q) {
        const searchable = [
          p.canonicalName,
          p.hometown,
          p.career?.currentRole,
          p.career?.currentCompany,
          p.career?.city,
          p.career?.state,
          p.helpTopics?.join(' '),
          p.rosterYearsLabel,
          p.classYearEstimate,
          p.classLabel,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (roleTab === 'current_player' && p.memberRole !== 'current_player') return false
      if (roleTab === 'alumni' && p.memberRole !== 'alumni') return false
      if (roleTab === 'helping' && !isOpenToHelping(p)) return false
      if (eraFilter !== 'all' && roleTab !== 'current_player') {
        const decade = Math.floor((p.rosterStartYear ?? 0) / 10) * 10
        if (String(decade) !== eraFilter) return false
      }
      return true
    })
  }, [profiles, query, roleTab, eraFilter])

  const hasFilters = query !== '' || roleTab !== 'all' || eraFilter !== 'all'

  if (loading) return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <BookHeader loading />
      <div className="py-20 text-center"><p className="text-sm text-[#8a7f70]">Loading...</p></div>
    </div>
  )

  if (fetchError) return (
    <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
      <p className="text-sm text-[#990000]">Could not load the Member Book.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <BookHeader stats={stats} />

      <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
        <div className="-mt-6 relative z-10 pb-16">

          {profiles.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-12 text-center"
              style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-medium text-[#0a1628] mb-1">The registry is not yet open.</p>
              <p className="text-xs text-[#8a7f70]">Member profiles are reviewed by Penn Golf before appearing here.</p>
            </div>
          ) : (
            <>
              {/* Registry control panel */}
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden mb-5"
                style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)' }}
              >
                {/* Tab rail */}
                <div className="flex items-center gap-0 px-5 border-b border-[rgba(180,168,150,0.3)] overflow-x-auto">
                  <Tab active={roleTab === 'all'} onClick={() => { setRoleTab('all'); setEraFilter('all') }}>
                    All Members
                  </Tab>
                  <Tab active={roleTab === 'current_player'} onClick={() => { setRoleTab('current_player'); setEraFilter('all') }}>
                    Current Players
                  </Tab>
                  <Tab active={roleTab === 'alumni'} onClick={() => setRoleTab('alumni')}>
                    Alumni
                  </Tab>
                  {helpingCount > 0 && (
                    <Tab active={roleTab === 'helping'} onClick={() => { setRoleTab('helping'); setEraFilter('all') }}>
                      Open to Helping
                    </Tab>
                  )}
                  <div className="ml-auto pl-4 py-2 flex-shrink-0">
                    <span className="text-xs text-[#8a7f70]">
                      <span className="font-semibold text-[#0a1628]">{filtered.length}</span>
                      {' '}{filtered.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                {/* Search row */}
                <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 relative min-w-[180px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-[#b0a898]" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      aria-label="Search members"
                      placeholder="Search by name, city, company, class year..."
                      className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-2 pl-9 text-sm text-[#0a1628] placeholder-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628]/25 transition-colors"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="absolute inset-y-0 right-2 flex items-center px-1 text-[#b0a898] hover:text-[#0a1628]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Era filter — Alumni mode only */}
                  {(roleTab === 'alumni' || roleTab === 'all') && eras.length > 0 && (
                    <select
                      value={eraFilter}
                      onChange={e => setEraFilter(e.target.value)}
                      aria-label="Filter by era"
                      className="bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-3 py-2 text-xs text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]/20 transition-colors"
                    >
                      <option value="all">All seasons</option>
                      {eras.map(d => (
                        <option key={d} value={String(d)}>{d}s</option>
                      ))}
                    </select>
                  )}

                  {hasFilters && (
                    <button
                      onClick={() => { setQuery(''); setRoleTab('all'); setEraFilter('all') }}
                      className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Claim note — subtle */}
                <div className="px-5 pb-3">
                  <p className="text-[10px] text-[#b0a898]">
                    Imported profiles can be claimed and updated by verified members.{' '}
                    <Link href="/player/alumni" className="underline hover:text-[#8a7f70]">Learn more</Link>
                  </p>
                </div>
              </div>

              {/* Registry grid */}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm font-medium text-[#0a1628] mb-1">No entries match</p>
                  <p className="text-xs text-[#8a7f70] mb-4">Try adjusting the search or filter.</p>
                  <button
                    onClick={() => { setQuery(''); setRoleTab('all'); setEraFilter('all') }}
                    className="text-xs font-medium text-[#990000] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div
                    data-testid="network-alumni-grid"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
                  >
                    {filtered.map((profile, index) => (
                      <RegistryEntry
                        key={profile.personId}
                        profile={profile}
                        index={index}
                        teamSlug={teamSlug}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Book header ────────────────────────────────────────────────────────────
function BookHeader({
  loading,
  stats,
}: {
  loading?: boolean
  stats?: { total: number; alumni: number; current: number; cities: number }
}) {
  return (
    <div className="bg-[#0a1628] px-5 sm:px-8 pt-10 pb-16">
      <div className="max-w-[1320px] mx-auto">
        {/* Eyebrow */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
          Penn Golf Clubhouse
        </p>

        {/* Title */}
        <h1
          className="text-white text-3xl sm:text-4xl font-medium leading-tight tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
          data-testid="member-book-title"
        >
          Member Book
        </h1>
        <p className="text-white/45 text-sm">
          Penn Golf players and alumni across seasons, cities, and generations.
        </p>

        {/* Plaque stats */}
        {stats && !loading && (
          <div className="mt-8 flex items-start gap-0 border-t border-white/10 pt-6">
            <div className="flex items-start divide-x divide-white/10">
              <div className="pr-8">
                <Plaque value={stats.total} label="Seasons" />
              </div>
              <div className="px-8">
                <Plaque value={stats.alumni} label="Alumni" />
              </div>
              <div className="px-8">
                <Plaque value={stats.current} label="Current Players" />
              </div>
              {stats.cities > 0 && (
                <div className="pl-8">
                  <Plaque value={stats.cities} label="Cities" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MemberBookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0]">
          <BookHeader loading />
          <div className="py-16 text-center text-sm text-[#8a7f70]">Loading...</div>
        </div>
      }
    >
      <MemberBookInner />
    </Suspense>
  )
}
