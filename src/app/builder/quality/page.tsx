'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { GraphQualityResult, DuplicateCandidate, SeasonCoverage, PersonMissingFields } from '@/lib/store/graph-quality'

function QualityInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? ''

  const [quality, setQuality] = useState<GraphQualityResult | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([])
  const [coverage, setCoverage] = useState<SeasonCoverage[]>([])
  const [missing, setMissing] = useState<PersonMissingFields[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamSlug) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/graph/quality?teamSlug=${teamSlug}`).then(r => r.json()),
      fetch(`/api/graph/duplicates?teamSlug=${teamSlug}`).then(r => r.json()),
      fetch(`/api/graph/coverage?teamSlug=${teamSlug}`).then(r => r.json()),
      fetch(`/api/graph/missing-fields?teamSlug=${teamSlug}`).then(r => r.json()),
    ])
      .then(([q, d, c, m]) => {
        if (q.error) { setError(q.error); return }
        setQuality(q.quality)
        setDuplicates(d.candidates ?? [])
        setCoverage(c.coverage ?? [])
        setMissing(m.missing ?? [])
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Network error'))
      .finally(() => setLoading(false))
  }, [teamSlug])

  const scoreColor = (score: number) => {
    if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
    if (score >= 60) return { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
    return { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50 border-red-200' }
  }

  const duplicateReasonLabel = (r: DuplicateCandidate['reason']) => {
    switch (r) {
      case 'exact_normalized_name': return 'Exact match'
      case 'same_last_first_initial': return 'Same last, same initial'
      case 'similar_name': return 'Similar name'
    }
  }

  const colors = quality ? scoreColor(quality.score) : null

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href={`/builder/workspace?teamSlug=${teamSlug}`}
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← Team Workspace
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mb-1">Graph Quality</h1>
          <p className="text-gray-400 text-sm">
            Completeness, duplicates, and coverage for{' '}
            <span className="font-mono text-gray-300">{teamSlug || '—'}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-[1320px] mx-auto w-full px-8 py-8">
        {!teamSlug && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-amber-800 text-sm">
            No team selected. Return to the builder and select a team.
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-ink-muted text-sm py-16 justify-center">
            <span className="w-5 h-5 border-2 border-[#8a7f70]/30 border-t-[#8a7f70] rounded-full animate-spin" />
            Analyzing graph quality…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {quality && colors && (
          <div className="space-y-8">
            {/* Score card */}
            <div
              className={`border rounded-xl p-8 ${colors.bg}`}
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="flex items-end gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Graph Quality Score</p>
                  <p className={`text-6xl font-bold ${colors.text}`}>{quality.score}</p>
                  <p className={`text-sm font-medium mt-1 ${colors.text}`}>
                    {quality.label === 'graph-ready' ? 'Graph Ready' : quality.label === 'needs-review' ? 'Needs Review' : 'Incomplete'}
                  </p>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors.bar}`}
                      style={{ width: `${quality.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {quality.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {quality.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-amber-700 flex items-center gap-2">
                      <span className="text-amber-500">⚠</span> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total People', value: quality.totalPeople },
                { label: 'High Confidence', value: quality.highConfidenceCount, sub: '≥80%' },
                { label: 'Low Confidence', value: quality.lowConfidenceCount, sub: '<80%', warn: quality.lowConfidenceCount > 0 },
                { label: 'Open Reviews', value: quality.openReviewItems, warn: quality.openReviewItems > 0 },
                { label: 'Missing Hometown', value: quality.missingHometownCount, warn: quality.missingHometownCount > 0 },
                { label: 'Missing High School', value: quality.missingHighSchoolCount, warn: quality.missingHighSchoolCount > 0 },
                { label: 'Missing Bio URL', value: quality.missingBioUrlCount, warn: quality.missingBioUrlCount > 0 },
                { label: 'Missing Source URL', value: quality.missingSourceUrlCount, warn: quality.missingSourceUrlCount > 0 },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.warn ? 'text-amber-600' : 'text-[#0a1628]'}`}>{s.value}</p>
                  {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Season coverage */}
            {coverage.length > 0 && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.3)]">
                  <h2 className="font-semibold text-[#0a1628]">Season Coverage</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f0ece5]">
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Season</th>
                      <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Entries</th>
                      <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Promoted</th>
                      <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Avg Conf.</th>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                    {coverage.map((row, i) => (
                      <tr key={row.seasonYear} className={i % 2 === 1 ? 'bg-[#faf9f7]' : ''}>
                        <td className="px-5 py-3 font-mono text-[#0a1628]">{row.seasonYear}</td>
                        <td className="px-5 py-3 text-right text-ink-muted">{row.totalEntries}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.promotedEntries > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {row.promotedEntries}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.avgConfidence >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {Math.round(row.avgConfidence * 100)}%
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {row.hasHistoricalResult ? (
                            <span className="text-xs text-emerald-600 font-medium">Historical import</span>
                          ) : (
                            <span className="text-xs text-gray-400">Manual / scrape</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Duplicate candidates */}
            {duplicates.length > 0 && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.3)] flex items-center justify-between">
                  <h2 className="font-semibold text-[#0a1628]">Duplicate Candidates</h2>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {duplicates.length} found
                  </span>
                </div>
                <div className="divide-y divide-[rgba(180,168,150,0.2)]">
                  {duplicates.map((d, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/builder/people/${d.personA.id}?teamSlug=${teamSlug}`}
                            className="text-sm font-medium text-[#0a1628] hover:text-[#990000] hover:underline truncate"
                          >
                            {d.personA.canonicalName}
                          </Link>
                          <span className="text-gray-400 text-xs">vs</span>
                          <Link
                            href={`/builder/people/${d.personB.id}?teamSlug=${teamSlug}`}
                            className="text-sm font-medium text-[#0a1628] hover:text-[#990000] hover:underline truncate"
                          >
                            {d.personB.canonicalName}
                          </Link>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{duplicateReasonLabel(d.reason)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.confidence >= 0.9 ? 'bg-red-100 text-red-700' : d.confidence >= 0.7 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {Math.round(d.confidence * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {duplicates.length === 0 && quality.totalPeople > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4 text-sm text-emerald-700">
                No duplicate candidates found.
              </div>
            )}

            {/* Missing fields panel */}
            {missing.length > 0 && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.3)] flex items-center justify-between">
                  <h2 className="font-semibold text-[#0a1628]">Incomplete Records</h2>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {missing.length} people
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f0ece5]">
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Missing</th>
                      <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                    {missing.map((row, i) => (
                      <tr key={row.person.id} className={i % 2 === 1 ? 'bg-[#faf9f7]' : ''}>
                        <td className="px-5 py-3 font-medium text-[#0a1628]">{row.person.canonicalName}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.missingFields.map(f => (
                              <span key={f} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/builder/people/${row.person.id}?teamSlug=${teamSlug}`}
                            className="text-xs font-medium text-[#990000] hover:underline"
                          >
                            Inspect →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 border-t border-[rgba(180,168,150,0.35)] pt-6 pb-4">
              <Link
                href={`/builder/people?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
              >
                View All People →
              </Link>
              <Link
                href={`/builder/promote?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
              >
                Promote More →
              </Link>
              <Link
                href={`/builder/graph?teamSlug=${teamSlug}`}
                className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2 rounded-md transition-colors"
              >
                Open Graph →
              </Link>
            </div>
          </div>
        )}

        {quality && quality.totalPeople === 0 && (
          <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-12 text-center">
            <p className="text-sm text-ink-muted mb-3">No promoted people yet for this team.</p>
            <Link
              href={`/builder/promote?teamSlug=${teamSlug}`}
              className="text-sm text-[#990000] hover:underline font-medium"
            >
              Promote Roster Entries →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QualityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-ink-muted text-sm">Loading…</div>}>
      <QualityInner />
    </Suspense>
  )
}
