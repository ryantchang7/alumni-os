'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type EnrichmentStatus = 'none' | 'partial' | 'source_backed' | 'verified'

interface ProfileRow {
  personId: string
  canonicalName: string
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  enrichment?: {
    currentRole?: string
    currentCompany?: string
    city?: string
    verificationStatus: string
    sourceUrls: string[]
  }
  enrichmentStatus: EnrichmentStatus
}

interface Team {
  teamName: string
  schoolName: string
  sport: string
  gender: string
}

type FilterTab = 'all' | 'none' | 'partial' | 'source_backed' | 'verified'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'none', label: 'No enrichment' },
  { id: 'partial', label: 'Needs review' },
  { id: 'source_backed', label: 'Source backed' },
  { id: 'verified', label: 'Verified' },
]

function statusPill(enrichmentStatus: EnrichmentStatus) {
  switch (enrichmentStatus) {
    case 'none':
      return (
        <span className="inline-block rounded-full bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5">
          None
        </span>
      )
    case 'partial':
      return (
        <span className="inline-block rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5">
          Unverified
        </span>
      )
    case 'source_backed':
      return (
        <span className="inline-block rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5">
          Source backed
        </span>
      )
    case 'verified':
      return (
        <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5">
          Verified
        </span>
      )
  }
}

function enrichmentSummary(profile: ProfileRow): string {
  const e = profile.enrichment
  if (!e) return 'No enrichment yet'
  const parts: string[] = []
  if (e.currentRole && e.currentCompany) {
    parts.push(`${e.currentRole} at ${e.currentCompany}`)
  } else if (e.currentRole) {
    parts.push(e.currentRole)
  } else if (e.currentCompany) {
    parts.push(e.currentCompany)
  }
  if (e.city) parts.push(e.city)
  return parts.length > 0 ? parts.join(', ') : 'No enrichment yet'
}

function EnrichListInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [team, setTeam] = useState<Team | null>(null)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    if (!teamSlug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/alumni/profiles?teamSlug=${encodeURIComponent(teamSlug)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setTeam(data.team)
        setProfiles(data.profiles ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [teamSlug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = profiles.filter(p => {
    if (activeTab !== 'all' && p.enrichmentStatus !== activeTab) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const fields = [
        p.canonicalName,
        p.hometown,
        p.highSchool,
        p.enrichment?.currentRole,
        p.enrichment?.currentCompany,
        p.enrichment?.city,
      ]
      if (!fields.some(f => f?.toLowerCase().includes(q))) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col">
      {/* Navy header */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link href="/builder" className="text-xs text-gray-400 hover:text-white transition-colors mb-1 block">
            ← Builder
          </Link>
          {teamSlug && (
            <Link
              href={`/builder/workspace?teamSlug=${teamSlug}`}
              className="text-xs text-gray-300 hover:text-white transition-colors mb-3 block"
            >
              ← Team Workspace
            </Link>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl font-semibold tracking-tight mb-1">
                Enrich Profiles
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                {team ? `${team.teamName} — ${team.schoolName}` : 'Add verified career, contact, and relationship data.'}
              </p>
            </div>
            {teamSlug && (
              <span className="inline-block rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-gray-300 font-mono">
                {teamSlug}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1320px] mx-auto w-full px-8 py-8">
        {!teamSlug ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-amber-800 text-sm">
            No team selected. Start from{' '}
            <Link href="/builder/new" className="underline font-medium">
              /builder/new
            </Link>
            .
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 text-ink-muted text-sm py-12 justify-center">
            <span className="w-5 h-5 border-2 border-[#8a7f70]/30 border-t-[#8a7f70] rounded-full animate-spin" />
            Loading profiles…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-12 text-center">
            <p className="text-sm text-ink-muted mb-3">
              No promoted people yet. Promote roster entries first.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href={teamSlug ? `/builder/workspace?teamSlug=${teamSlug}` : '/builder'}
                className="text-sm text-[#990000] hover:underline font-medium"
              >
                ← Team Workspace
              </Link>
              <Link
                href={teamSlug ? `/builder/promote?teamSlug=${teamSlug}` : '/builder'}
                className="text-sm text-[#990000] hover:underline font-medium"
              >
                Promote Entries →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Filter + search bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div data-testid="enrich-filter-tabs" className="flex gap-1 flex-wrap">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#0a1628] text-white'
                        : 'bg-[#ece8e1] text-ink-muted hover:bg-[#e0dbd3]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <input
                data-testid="enrich-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, hometown, role…"
                className="ml-auto text-sm border border-[rgba(180,168,150,0.5)] rounded-md px-3 py-1.5 bg-white text-[#0d1f3c] placeholder-[#b4a896] focus:outline-none focus:ring-1 focus:ring-[#0a1628] w-64"
              />
            </div>

            {/* Table */}
            <div
              data-testid="enrich-list"
              className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0ece5]">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Roster Years
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Hometown / HS
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Enrichment
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Sources
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-muted text-sm">
                        No profiles match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(profile => (
                      <tr key={profile.personId} className="hover:bg-[#f5f2ed] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#0d1f3c]">
                          {profile.canonicalName}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {profile.rosterYearsLabel || '—'}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {profile.hometown || profile.highSchool ? (
                            <span>
                              {profile.hometown && <span>{profile.hometown}</span>}
                              {profile.hometown && profile.highSchool && ' / '}
                              {profile.highSchool && <span>{profile.highSchool}</span>}
                            </span>
                          ) : (
                            <span className="text-[#c4bbb0]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs max-w-[220px] truncate">
                          {enrichmentSummary(profile)}
                        </td>
                        <td className="px-4 py-3">
                          {statusPill(profile.enrichmentStatus)}
                        </td>
                        <td className="px-4 py-3 text-ink-muted text-xs">
                          {profile.enrichment?.sourceUrls?.length ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/builder/enrich/${profile.personId}${teamSlug ? `?teamSlug=${teamSlug}` : ''}`}
                            className="text-xs font-medium text-[#990000] hover:underline whitespace-nowrap"
                          >
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-ink-muted mt-3">
              {filtered.length} of {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function EnrichPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center text-ink-muted text-sm">
          Loading…
        </div>
      }
    >
      <EnrichListInner />
    </Suspense>
  )
}
