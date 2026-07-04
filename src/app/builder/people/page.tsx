'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Person, TeamMembership } from '@/lib/store/types'

function PeopleInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [people, setPeople] = useState<Person[]>([])
  const [memberships, setMemberships] = useState<TeamMembership[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!teamSlug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/people?teamSlug=${encodeURIComponent(teamSlug)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setPeople(data.people as Person[])
        setMemberships(data.memberships as TeamMembership[])
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

  function getMembership(personId: string): TeamMembership | undefined {
    return memberships.find(m => m.personId === personId)
  }

  function rosterYears(m: TeamMembership | undefined): string {
    if (!m) return '—'
    if (m.rosterStartYear && m.rosterEndYear) return `${m.rosterStartYear}–${m.rosterEndYear}`
    if (m.rosterStartYear) return String(m.rosterStartYear)
    return '—'
  }

  const avgConfidence =
    memberships.length > 0
      ? Math.round((memberships.reduce((s, m) => s + m.confidence, 0) / memberships.length) * 100)
      : 0

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      {/* Navy header */}
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
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
                Normalized People
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                People promoted from extracted roster entries.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {teamSlug && (
                <span className="inline-block rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-gray-300 font-mono">
                  Team: {teamSlug}
                </span>
              )}
              {teamSlug && (
                <Link
                  href={`/builder/quality?teamSlug=${teamSlug}`}
                  className="text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full transition-colors"
                >
                  Graph Quality →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {people.length > 0 && (
        <div className="bg-[#0d1f3c] px-8 py-4 border-t border-white/10">
          <div className="max-w-[1320px] mx-auto flex gap-8 text-sm">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">People</span>
              <p className="text-white font-semibold text-lg">{people.length}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Memberships</span>
              <p className="text-white font-semibold text-lg">{memberships.length}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Avg Confidence</span>
              <p className="text-white font-semibold text-lg">{avgConfidence}%</p>
            </div>
          </div>
        </div>
      )}

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
            Loading people…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        ) : people.length === 0 ? (
          <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-12 text-center">
            <p className="text-sm text-ink-muted mb-3">
              No promoted people yet. Run a scrape and promote roster entries first.
            </p>
            <Link
              href={`/builder/debug-roster?teamSlug=${teamSlug}`}
              className="text-sm text-[#990000] hover:underline font-medium"
            >
              Go to Roster Extractor →
            </Link>
          </div>
        ) : (
          <div
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
                    Class
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Hometown
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    High School
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Conf.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Bio URLs
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Sources
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Inspect
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Enrich
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                {people.map(person => {
                  const m = getMembership(person.id)
                  return (
                    <tr key={person.id} className="hover:bg-[#f5f2ed] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0d1f3c]">
                        {person.canonicalName}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{rosterYears(m)}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m?.classLabel ?? <span className="text-[#c4bbb0]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m?.hometown ?? <span className="text-[#c4bbb0]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m?.highSchool ?? <span className="text-[#c4bbb0]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m ? (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.confidence >= 0.8
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {Math.round(m.confidence * 100)}%
                          </span>
                        ) : (
                          <span className="text-[#c4bbb0]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m && m.bioUrls.length > 0 ? (
                          <span
                            className="text-xs font-medium text-[#0a1628] cursor-default"
                            title={m.bioUrls.join('\n')}
                          >
                            {m.bioUrls.length} link{m.bioUrls.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[#c4bbb0]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {m && m.sourceUrls.length > 0 ? (
                          <span
                            className="text-xs font-medium text-[#0a1628] cursor-default"
                            title={m.sourceUrls.join('\n')}
                          >
                            {m.sourceUrls.length}
                          </span>
                        ) : (
                          <span className="text-amber-400 text-xs font-medium">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/builder/people/${person.id}${teamSlug ? `?teamSlug=${teamSlug}` : ''}`}
                          className="text-xs font-medium text-[#990000] hover:underline"
                        >
                          Sources →
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/builder/enrich/${person.id}${teamSlug ? `?teamSlug=${teamSlug}` : ''}`}
                          className="text-xs font-medium text-[#990000] hover:underline"
                        >
                          Enrich →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick nav */}
        {people.length > 0 && teamSlug && (
          <div className="mt-6 flex gap-3">
            <Link
              href={`/builder/promote?teamSlug=${teamSlug}`}
              className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
            >
              ← Back to Promote
            </Link>
            <Link
              href={`/builder/graph?teamSlug=${teamSlug}`}
              className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2 rounded-md transition-colors"
            >
              View Graph →
            </Link>
            <Link
              href={`/builder/enrich?teamSlug=${teamSlug}`}
              className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
            >
              Enrich Profiles →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-ink-muted text-sm">Loading…</div>}>
      <PeopleInner />
    </Suspense>
  )
}
