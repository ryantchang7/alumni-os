'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface PlayerProfile {
  personId: string
  canonicalName: string
  firstName?: string
  lastName?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
  }
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.8,
}

function PlayerSearchInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'

  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load alumni (${r.status})`)
        return r.json()
      })
      .then(data => {
        setProfiles(data.profiles ?? [])
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load alumni')
        setLoading(false)
      })
  }, [teamSlug])

  const classLabels = useMemo(() => {
    return Array.from(
      new Set(profiles.map(p => p.classLabel).filter((l): l is string => Boolean(l))),
    ).sort()
  }, [profiles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles.filter(p => {
      if (q) {
        const searchable = [
          p.canonicalName,
          p.hometown,
          p.highSchool,
          p.classLabel,
          p.rosterYearsLabel,
          p.career?.currentRole,
          p.career?.currentCompany,
          p.career?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (classFilter !== 'all' && p.classLabel !== classFilter) return false
      return true
    })
  }, [profiles, query, classFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
        <p className="text-sm text-[#8a7f70]">Loading alumni...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 text-center">
        <p className="text-base font-semibold text-[#990000] mb-2">Failed to load alumni</p>
        <p className="text-sm text-[#8a7f70]">{fetchError}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Penn Golf Clubhouse</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Find Penn Golf alumni.
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Search by name, class, hometown, or high school.
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-20" data-testid="network-empty-state">
            <p className="text-base font-semibold text-[#0a1628] mb-2">No alumni published yet</p>
            <p className="text-sm text-[#8a7f70]">
              Profiles are approved by Penn Golf captains before appearing here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 relative max-w-xl min-w-48">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#8a7f70]" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name, hometown, high school, class..."
                    className="w-full bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 pl-10 text-sm text-[#0a1628] placeholder-[#8a7f70] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 focus:border-[#0a1628]/40 transition-colors"
                  />
                </div>

                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2.5 text-sm text-[#0a1628] focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
                >
                  <option value="all">All Classes</option>
                  {classLabels.map(l => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-[#8a7f70] ml-auto">
                  <span className="font-semibold text-[#0a1628]">{filtered.length}</span> alumni
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-5 h-5 text-[#8a7f70] mx-auto mb-4" />
                <p className="text-base font-semibold text-[#0a1628] mb-1">
                  No alumni match your search
                </p>
                <button
                  onClick={() => {
                    setQuery('')
                    setClassFilter('all')
                  }}
                  className="mt-4 text-sm font-medium text-[#990000] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div
                data-testid="network-alumni-grid"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {filtered.map((profile, index) => (
                  <motion.div
                    key={profile.personId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: Math.min(index * 0.04, 0.4) }}
                  >
                    <Link
                      href={`/player/alumni/${profile.personId}?teamSlug=${teamSlug}`}
                      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4 hover:shadow-md transition-shadow group"
                      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                    >
                      <div className="mb-2">
                        <span className="font-semibold text-[#0a1628] text-sm leading-snug">
                          {profile.canonicalName}
                        </span>
                      </div>

                      <div className="space-y-0.5 mb-3">
                        {profile.rosterYearsLabel !== '—' && (
                          <p className="text-xs text-[#8a7f70]">
                            Penn Golf {profile.rosterYearsLabel}
                          </p>
                        )}
                        {profile.classLabel && (
                          <p className="text-xs text-[#8a7f70]">{profile.classLabel}</p>
                        )}
                        {profile.hometown && (
                          <p className="text-xs text-[#8a7f70]">{profile.hometown}</p>
                        )}
                        {profile.highSchool && (
                          <p className="text-xs text-[#8a7f70]">{profile.highSchool}</p>
                        )}
                        {profile.career &&
                          (profile.career.currentRole || profile.career.currentCompany) && (
                            <p className="text-xs text-[#4a5568] pt-0.5">
                              {profile.career.currentRole && profile.career.currentCompany
                                ? `${profile.career.currentRole} at ${profile.career.currentCompany}`
                                : profile.career.currentRole ?? profile.career.currentCompany}
                            </p>
                          )}
                      </div>

                      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-2 block">
                        View profile &rarr;
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PlayerSearchPage() {
  return (
    <Suspense
      fallback={<div className="py-20 text-center text-sm text-[#8a7f70]">Loading...</div>}
    >
      <PlayerSearchInner />
    </Suspense>
  )
}
