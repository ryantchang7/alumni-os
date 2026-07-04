'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { AgentRunStep, AgentRunSummary } from '@/lib/agent/types'

interface Team {
  id: string
  schoolName: string
  teamName: string
  sport: string
  gender: string
  slug: string
  websiteUrl: string
}

interface ExtractedEntry {
  id: string
  fullName: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  extractionConfidence: number
  seasonYear?: string
  sourceUrl: string
  status: 'extracted' | 'promoted' | 'rejected'
}

interface AgentSummaryResponse {
  team: Team
  counts: AgentRunSummary['counts']
  agentSummary: AgentRunSummary
}

interface ExtractionResult {
  entries: ExtractedEntry[]
  counts: { entries: number; highConfidence: number; lowConfidence: number }
  warnings: string[]
}

// ── Status helpers ────────────────────────────────────────────────────────────

function stepDotColor(status: AgentRunStep['status']): string {
  switch (status) {
    case 'complete': return 'bg-emerald-500'
    case 'needs_approval': return 'bg-amber-400'
    case 'warning': return 'bg-amber-400'
    case 'ready': return 'bg-blue-500'
    case 'running': return 'bg-blue-500 animate-pulse'
    case 'failed': return 'bg-red-500'
    case 'locked': return 'bg-gray-300'
  }
}

function stepPillStyle(status: AgentRunStep['status']): string {
  switch (status) {
    case 'complete': return 'bg-emerald-100 text-emerald-800'
    case 'needs_approval': return 'bg-amber-100 text-amber-800'
    case 'warning': return 'bg-amber-100 text-amber-800'
    case 'ready': return 'bg-blue-100 text-blue-800'
    case 'running': return 'bg-blue-100 text-blue-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'locked': return 'bg-gray-100 text-gray-500'
  }
}

function stepPillLabel(status: AgentRunStep['status']): string {
  switch (status) {
    case 'complete': return 'Complete'
    case 'needs_approval': return 'Needs approval'
    case 'warning': return 'Warning'
    case 'ready': return 'Ready'
    case 'running': return 'Running'
    case 'failed': return 'Failed'
    case 'locked': return 'Locked'
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const cls = value >= 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {pct}%
    </span>
  )
}

function AgentTimeline({ steps }: { steps: AgentRunStep[] }) {
  return (
    <div data-testid="agent-timeline" className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
      <h2 className="text-sm font-semibold text-[#0a1628] uppercase tracking-wider mb-5">Agent progress</h2>
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
        <div className="space-y-5">
          {steps.map(s => (
            <div key={s.id} className="flex gap-4 relative">
              <div className={`w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 relative z-10 ${stepDotColor(s.status)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[#0a1628]">{s.label}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stepPillStyle(s.status)}`}>
                    {stepPillLabel(s.status)}
                  </span>
                  {s.count !== undefined && s.count > 0 && (
                    <span className="text-xs text-gray-400">{s.count}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{s.description}</p>
                {s.href && s.status !== 'locked' && (
                  <Link href={s.href} className="text-xs text-[#990000] hover:underline mt-1 inline-block">
                    Open &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page inner ───────────────────────────────────────────────────────────

function AgentInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [summary, setSummary] = useState<AgentSummaryResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Extraction state
  const [rosterUrl, setRosterUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Pending entries (shown when entries exist from a previous run)
  const [pendingEntries, setPendingEntries] = useState<ExtractedEntry[]>([])

  // Promotion state
  const [promoting, setPromoting] = useState(false)
  const [promotionResult, setPromotionResult] = useState<{ promotedCount: number; peopleCreated: number } | null>(null)
  const [promotionError, setPromotionError] = useState<string | null>(null)

  const loadSummary = useCallback(() => {
    if (!teamSlug) { setLoading(false); return }
    setLoading(true)
    setLoadError(null)
    fetch(`/api/agent/summary?teamSlug=${encodeURIComponent(teamSlug)}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error ?? `HTTP ${r.status}`) })
        return r.json() as Promise<AgentSummaryResponse>
      })
      .then(data => {
        setSummary(data)
        setRosterUrl(prev => prev || data.team.websiteUrl || '')
        // If pending entries exist and we have no extraction result yet, fetch them
        if (data.counts.extractedPending > 0 && !extractionResult) {
          fetch(`/api/roster/entries?teamSlug=${encodeURIComponent(teamSlug)}`)
            .then(r => r.ok ? r.json() : Promise.resolve([]))
            .then((entries: ExtractedEntry[]) => {
              setPendingEntries(entries.filter(e => e.status === 'extracted'))
            })
            .catch(() => {/* non-critical */})
        }
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamSlug, refreshKey])

  useEffect(() => { loadSummary() }, [loadSummary])

  async function handleExtract() {
    if (!teamSlug || !rosterUrl.trim() || extracting) return
    setExtracting(true)
    setExtractionError(null)
    setExtractionResult(null)
    setPromotionResult(null)
    try {
      const r = await fetch('/api/scrape/roster-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, url: rosterUrl.trim() }),
      })
      const data = await r.json()
      if (!r.ok) {
        setExtractionError(data.error ?? `Extraction failed (HTTP ${r.status})`)
        return
      }
      setExtractionResult(data as ExtractionResult)
      // Refresh agent summary to reflect new entries
      setRefreshKey(k => k + 1)
    } catch (err) {
      setExtractionError(
        err instanceof Error ? err.message : 'Network error — check that the server is running.',
      )
    } finally {
      setExtracting(false)
    }
  }

  async function handleAddToGraph() {
    if (!teamSlug || promoting) return
    setPromoting(true)
    setPromotionError(null)
    try {
      // Get current extracted entries, filter high-confidence
      const r = await fetch(`/api/roster/entries?teamSlug=${encodeURIComponent(teamSlug)}`)
      if (!r.ok) throw new Error('Failed to load roster entries')
      const entries = (await r.json()) as ExtractedEntry[]
      const highConfIds = entries
        .filter(e => e.status === 'extracted' && e.extractionConfidence >= 0.8)
        .map(e => e.id)
      if (highConfIds.length === 0) {
        setPromotionError('No high-confidence rows to add (confidence < 80%).')
        return
      }
      const pr = await fetch('/api/roster/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, entryIds: highConfIds }),
      })
      const result = await pr.json()
      if (!pr.ok) throw new Error(result.error ?? `Promotion failed (HTTP ${pr.status})`)
      setPromotionResult(result as { promotedCount: number; peopleCreated: number })
      setRefreshKey(k => k + 1)
    } catch (err) {
      setPromotionError(err instanceof Error ? err.message : 'Promotion failed')
    } finally {
      setPromoting(false)
    }
  }

  // ── No teamSlug ────────────────────────────────────────────────────────────
  if (!teamSlug) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-base font-semibold text-[#0a1628]">No team selected</p>
          <p className="text-sm text-ink-muted">Add a teamSlug query parameter to continue.</p>
          <Link href="/builder" className="inline-block text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors">
            Back to Builder
          </Link>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] px-6 py-10">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-7 w-56 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-80 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError || !summary) {
    const msg = loadError ?? 'Failed to load agent summary'
    const isNotFound = msg.toLowerCase().includes('not found')
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <div className="bg-[#0a1628] px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <Link href="/builder" className="text-white/60 hover:text-white text-sm transition-colors inline-block mb-4">
              &larr; Builder
            </Link>
            <h1 className="text-white text-2xl font-semibold">Roster Agent</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white border border-red-200 rounded-xl p-6 border-l-4 border-l-red-400">
            <p className="text-sm font-semibold text-red-700 mb-1">
              {isNotFound ? 'Team not found' : 'Failed to load'}
            </p>
            <p className="text-sm text-red-600 mb-4">{msg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="text-sm font-medium bg-[#0a1628] text-white px-4 py-2 rounded hover:bg-[#112240] transition-colors"
              >
                Retry
              </button>
              <Link
                href="/builder"
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] px-4 py-2 rounded hover:bg-[#0a1628] hover:text-white transition-colors"
              >
                Back to Builder
              </Link>
              {isNotFound && (
                <Link
                  href="/builder/new"
                  className="text-sm font-medium text-[#990000] border border-[#990000] px-4 py-2 rounded hover:bg-[#990000] hover:text-white transition-colors"
                >
                  Create team
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { team, counts, agentSummary } = summary
  const hasPendingEntries =
    counts.extractedPending > 0 && !promotionResult

  // Entries to show in the roster result panel
  const displayEntries: ExtractedEntry[] =
    extractionResult?.entries ?? pendingEntries

  const highConfEntries = displayEntries.filter(
    e => e.status === 'extracted' && e.extractionConfidence >= 0.8,
  )

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-6 pt-8 pb-14">
        <div className="max-w-4xl mx-auto">
          <Link href="/builder" className="text-white/60 hover:text-white text-sm transition-colors inline-block mb-4">
            &larr; Builder
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl font-semibold tracking-tight">AI Builder</h1>
              <p className="text-gray-300 text-sm mt-1 max-w-xl leading-relaxed">
                Backstage tool for operators. Extract roster data, review evidence, and add verified people to the alumni graph.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <span className="text-white/80 text-xs font-medium">{team.teamName}</span>
                <span className="text-white/40 text-xs">/</span>
                <span className="text-white/50 text-xs font-mono">{team.slug}</span>
              </div>
            </div>
            <Link
              href={`/builder/captain-review?teamSlug=${teamSlug}`}
              className="shrink-0 text-sm font-medium text-white border border-white/30 hover:border-white/60 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Captain Review &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-16 space-y-6">
        {/* Extraction input card */}
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
          <label className="block text-xs font-semibold text-[#0a1628] uppercase tracking-wider mb-2">
            Roster URL
          </label>
          <div className="flex gap-3">
            <input
              data-testid="agent-roster-url-input"
              type="url"
              value={rosterUrl}
              onChange={e => setRosterUrl(e.target.value)}
              placeholder="https://pennathletics.com/sports/mens-golf/roster"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-[#0a1628] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
            />
            <button
              data-testid="agent-run-extraction-button"
              onClick={handleExtract}
              disabled={extracting || !rosterUrl.trim()}
              className="text-sm font-semibold text-white bg-[#0a1628] hover:bg-[#112240] px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {extracting ? 'Extracting...' : 'Run roster extraction'}
            </button>
          </div>
          {extractionError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-red-700">Extraction failed</p>
              <p className="text-xs text-red-600 mt-0.5">{extractionError}</p>
              {extractionError.toLowerCase().includes('fetch') && (
                <p className="text-xs text-red-500 mt-1">The Penn Athletics site may be unreachable. Try again or check the URL.</p>
              )}
            </div>
          )}
        </div>

        {/* Roster result panel */}
        {displayEntries.length > 0 && (
          <div data-testid="agent-roster-results" className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-[#0a1628]">
                  {extractionResult
                    ? `${extractionResult.counts.entries} roster rows found`
                    : `${displayEntries.length} roster rows pending`}
                </p>
                {extractionResult && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    {extractionResult.counts.highConfidence} high-confidence &middot; {extractionResult.counts.lowConfidence} low-confidence
                  </p>
                )}
                {displayEntries[0]?.sourceUrl && (
                  <p className="text-xs text-ink-muted font-mono mt-0.5 truncate max-w-xs">
                    Source: {displayEntries[0].sourceUrl}
                  </p>
                )}
              </div>
              <Link
                href={`/builder/promote?teamSlug=${teamSlug}`}
                className="text-xs font-medium text-[#0a1628] border border-[#0a1628] px-3 py-1.5 rounded-md hover:bg-[#0a1628] hover:text-white transition-colors"
              >
                Review all rows &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hometown</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Season</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayEntries.slice(0, 15).map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-[#0a1628]">{e.fullName}</td>
                      <td className="px-4 py-2.5 text-gray-500">{e.classLabel ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{e.hometown ?? '—'}</td>
                      <td className="px-4 py-2.5"><ConfidencePill value={e.extractionConfidence} /></td>
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{e.seasonYear ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayEntries.length > 15 && (
                <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                  + {displayEntries.length - 15} more rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* Approval checkpoint */}
        {hasPendingEntries && !promotionResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              {counts.extractedPending} roster {counts.extractedPending === 1 ? 'row' : 'rows'} not in the graph yet
            </p>
            <p className="text-sm text-amber-800 mb-4">
              These roster rows are not people yet. Add high-confidence rows to the graph when you&apos;re ready.
            </p>
            {promotionError && (
              <p className="text-xs text-red-600 mb-3">{promotionError}</p>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                data-testid="agent-add-to-graph-button"
                onClick={handleAddToGraph}
                disabled={promoting}
                className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoting
                  ? 'Adding...'
                  : `Add high-confidence rows to graph`}
              </button>
              <Link
                href={`/builder/promote?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] px-4 py-2 rounded-lg hover:bg-[#0a1628] hover:text-white transition-colors"
              >
                Review all rows &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Promotion success */}
        {promotionResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Added to graph</p>
            <p className="text-sm text-emerald-700">
              {promotionResult.peopleCreated} new {promotionResult.peopleCreated === 1 ? 'person' : 'people'} created in the alumni graph.
            </p>
          </div>
        )}

        {/* Agent timeline */}
        <AgentTimeline steps={agentSummary.steps} />

        {/* Next action panel */}
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 border-l-4 border-l-[#990000]" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Recommended next step</p>
          <p className="text-base font-semibold text-[#0a1628]">{agentSummary.recommendedActionLabel}</p>
          {agentSummary.recommendedActionId === 'add_to_graph' && !promotionResult && (
            <button
              data-testid="agent-add-to-graph-button"
              onClick={handleAddToGraph}
              disabled={promoting}
              className="mt-3 text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {promoting ? 'Adding...' : 'Add high-confidence rows to graph'}
            </button>
          )}
          {agentSummary.recommendedActionId === 'run_extraction' && (
            <p className="text-xs text-ink-muted mt-1">Enter the roster URL above and click Run roster extraction.</p>
          )}
          {agentSummary.recommendedActionId === 'import_historical' && (
            <Link href={`/builder/history?teamSlug=${teamSlug}`} className="mt-2 inline-block text-sm font-medium text-[#990000] hover:underline">
              Open historical import &rarr;
            </Link>
          )}
          {agentSummary.recommendedActionId === 'enrich_profiles' && (
            <Link href={`/builder/enrich?teamSlug=${teamSlug}`} className="mt-2 inline-block text-sm font-medium text-[#990000] hover:underline">
              Add verified profile details &rarr;
            </Link>
          )}
          {agentSummary.recommendedActionId === 'open_player_view' && (
            <Link href={`/builder/captain-review?teamSlug=${teamSlug}`} className="mt-2 inline-block text-sm font-medium text-[#990000] hover:underline">
              Open Captain Review &rarr;
            </Link>
          )}
        </div>

        {/* Advanced tools */}
        <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
          <h2 className="text-xs font-semibold text-[#0a1628] uppercase tracking-wider mb-4">Advanced tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Workspace', href: `/builder/workspace?teamSlug=${teamSlug}` },
              { label: 'Debug roster extractor', href: `/builder/debug-roster?teamSlug=${teamSlug}` },
              { label: 'Add rows to graph', href: `/builder/promote?teamSlug=${teamSlug}` },
              { label: 'Historical import', href: `/builder/history?teamSlug=${teamSlug}` },
              { label: 'People & sources', href: `/builder/people?teamSlug=${teamSlug}` },
              { label: 'Verified profile details', href: `/builder/enrich?teamSlug=${teamSlug}` },
              { label: 'Data health', href: `/builder/quality?teamSlug=${teamSlug}` },
              { label: 'Graph output', href: `/builder/graph?teamSlug=${teamSlug}` },
            ].map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-xs font-medium text-[#0a1628] border border-gray-200 rounded-lg px-3 py-2 hover:border-[#0a1628] hover:bg-[#0a1628] hover:text-white transition-colors text-center"
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f5f0]">
          <div className="bg-[#0a1628] px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
              <div className="h-7 w-56 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <AgentInner />
    </Suspense>
  )
}
