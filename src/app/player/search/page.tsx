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

const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.8,
}

function eraLabel(start?: number): string {
  if (!start) return 'Unknown'
  const decade = Math.floor(start / 10) * 10
  return `${decade}s`
}

function MemberCard({ profile, index, teamSlug }: { profile: PlayerProfile; index: number; teamSlug: string }) {
  const isCurrentPlayer = profile.memberRole === 'current_player'
  const location = profile.career?.city
    ? [profile.career.city, profile.career.state].filter(Boolean).join(', ')
    : null

  const openTo = [
    profile.openToCoffee && 'Coffee',
    profile.openToMentorship && 'Mentorship',
    profile.openToWarmIntroductions && 'Introductions',
    profile.openToGolfRounds && 'Golf rounds',
  ].filter((v): v is string => Boolean(v))

  const yearsLabel = isCurrentPlayer
    ? (profile.classYearEstimate?.split(' / ')[0] ?? null)
    : profile.rosterYearsLabel !== '—'
      ? `Penn Golf ${profile.rosterYearsLabel}`
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ ...springTransition, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        href={`/player/alumni/${profile.personId}?teamSlug=${teamSlug}`}
        className="flex flex-col h-full bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 hover:shadow-md hover:border-[rgba(10,22,40,0.2)] transition-all group"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
      >
        {/* Top row: name + badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-[#0a1628] text-sm leading-snug truncate">
              {profile.canonicalName}
            </p>
            {yearsLabel && (
              <p className="text-xs text-[#8a7f70] mt-0.5">{yearsLabel}</p>
            )}
          </div>
          {isCurrentPlayer ? (
            <span className="flex-shrink-0 text-[10px] font-semibold text-[#2d6a4f] bg-[#2d6a4f]/10 border border-[#2d6a4f]/25 px-2 py-0.5 rounded-full whitespace-nowrap">
              Current Player
            </span>
          ) : (
            <span className="flex-shrink-0 text-[10px] font-medium text-[#8a7f70] bg-[#f5f2ee] border border-[rgba(180,168,150,0.5)] px-2 py-0.5 rounded-full whitespace-nowrap">
              Alumni
            </span>
          )}
        </div>

        {/* Career / location */}
        {(profile.career?.currentRole || profile.career?.currentCompany || location) && (
          <div className="mb-3 space-y-0.5">
            {(profile.career?.currentRole || profile.career?.currentCompany) && (
              <p className="text-xs text-[#4a5568] leading-snug">
                {[profile.career.currentRole, profile.career.currentCompany]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {location && (
              <p className="text-xs text-[#8a7f70]">{location}</p>
            )}
          </div>
        )}

        {/* Hometown (if no career city) */}
        {!location && profile.hometown && (
          <p className="text-xs text-[#8a7f70] mb-3">{profile.hometown}</p>
        )}

        {/* Help topics */}
        {profile.helpTopics && profile.helpTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.helpTopics.slice(0, 3).map(topic => (
              <span
                key={topic}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f2ee] border border-[rgba(180,168,150,0.5)] text-[#0a1628]"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Open-to pills (compact) */}
        {openTo.length > 0 && !profile.helpTopics?.length && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {openTo.slice(0, 2).map(label => (
              <span
                key={label}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0a1628]/5 border border-[#0a1628]/12 text-[#0a1628]"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2">
          <span className="text-xs font-medium text-[#990000] group-hover:underline">
            View profile &rarr;
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function PlayerSearchInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [eraFilter, setEraFilter] = useState('all')

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load members (${r.status})`)
        return r.json()
      })
      .then(data => {
        setProfiles(data.profiles ?? [])
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load members')
        setLoading(false)
      })
  }, [teamSlug])

  // Stats
  const stats = useMemo(() => {
    const alumni = profiles.filter(p => p.memberRole === 'alumni')
    const current = profiles.filter(p => p.memberRole === 'current_player')
    const cities = new Set(
      profiles
        .map(p => p.career?.city ?? p.hometown)
        .filter(Boolean),
    )
    return {
      total: profiles.length,
      alumni: alumni.length,
      current: current.length,
      cities: cities.size,
    }
  }, [profiles])

  // Era options derived from data
  const eras = useMemo(() => {
    const decades = new Set(
      profiles
        .filter(p => p.memberRole === 'alumni' && p.rosterStartYear)
        .map(p => Math.floor((p.rosterStartYear ?? 2000) / 10) * 10),
    )
    return Array.from(decades).sort((a, b) => b - a)
  }, [profiles])

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
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (roleFilter === 'current_player' && p.memberRole !== 'current_player') return false
      if (roleFilter === 'alumni' && p.memberRole !== 'alumni') return false
      if (eraFilter !== 'all') {
        const decade = Math.floor((p.rosterStartYear ?? 0) / 10) * 10
        if (String(decade) !== eraFilter) return false
      }
      return true
    })
  }, [profiles, query, roleFilter, eraFilter])

  const hasFilters = query !== '' || roleFilter !== 'all' || eraFilter !== 'all'

  function clearFilters() {
    setQuery('')
    setRoleFilter('all')
    setEraFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] px-8 pt-10 pb-14">
          <div className="max-w-[1320px] mx-auto">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Golf Clubhouse</p>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Member Book</h1>
          </div>
        </div>
        <div className="py-20 text-center">
          <p className="text-sm text-[#8a7f70]">Loading members...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
        <p className="text-base font-semibold text-[#990000] mb-2">Failed to load</p>
        <p className="text-sm text-[#8a7f70]">{fetchError}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Golf Clubhouse</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Member Book</h1>
          <p className="text-gray-400 text-sm mt-2">
            Verified Penn Golf players and alumni across years, cities, and generations.
          </p>

          {/* Stats bar */}
          {profiles.length > 0 && (
            <div className="flex items-center gap-8 mt-6">
              {[
                { label: 'Members', value: stats.total },
                { label: 'Alumni', value: stats.alumni },
                { label: 'Current Players', value: stats.current },
                { label: 'Cities', value: stats.cities },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8">
        <div className="-mt-5 relative z-10 pb-16">

          {profiles.length === 0 ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-12 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-base font-semibold text-[#0a1628] mb-2">No members published yet</p>
              <p className="text-sm text-[#8a7f70]">
                Profiles are approved by Penn Golf before appearing here.
              </p>
            </div>
          ) : (
            <>
              {/* Search + filter bar */}
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 mb-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="flex-1 relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-[#8a7f70]" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search by name, city, company, class..."
                      className="w-full bg-[#f8f5f0] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-2 pl-10 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/15 focus:border-[#0a1628]/30 transition-colors"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-2 flex items-center px-1 text-[#8a7f70] hover:text-[#0a1628]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-1.5">
                    {(['all', 'current_player', 'alumni'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                          roleFilter === r
                            ? 'bg-[#0a1628] text-white border-[#0a1628]'
                            : 'bg-white text-[#8a7f70] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/30 hover:text-[#0a1628]'
                        }`}
                      >
                        {r === 'all' ? 'All' : r === 'current_player' ? 'Current Players' : 'Alumni'}
                      </button>
                    ))}
                  </div>

                  {/* Era filter — only visible in alumni mode */}
                  {roleFilter !== 'current_player' && eras.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={eraFilter}
                        onChange={e => setEraFilter(e.target.value)}
                        className="bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 text-xs text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
                      >
                        <option value="all">All eras</option>
                        {eras.map(d => (
                          <option key={d} value={String(d)}>{d}s</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-3">
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <p className="text-xs text-[#8a7f70]">
                      <span className="font-semibold text-[#0a1628]">{filtered.length}</span>{' '}
                      {filtered.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-base font-semibold text-[#0a1628] mb-1">No members match</p>
                  <p className="text-sm text-[#8a7f70] mb-4">Try adjusting your search or filters.</p>
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-[#990000] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div
                    data-testid="network-alumni-grid"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {filtered.map((profile, index) => (
                      <MemberCard
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

export default function PlayerSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0]">
          <div className="bg-[#0a1628] px-8 pt-10 pb-14">
            <div className="max-w-[1320px] mx-auto">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Golf Clubhouse</p>
              <h1 className="text-white text-2xl font-semibold tracking-tight">Member Book</h1>
            </div>
          </div>
          <div className="py-16 text-center text-sm text-[#8a7f70]">Loading...</div>
        </div>
      }
    >
      <PlayerSearchInner />
    </Suspense>
  )
}
