'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { HistoricalImportRun, HistoricalSeasonResult, Team } from '@/lib/store/types'

type RunState = 'idle' | 'creating' | 'running' | 'finalizing' | 'done' | 'error'

function HistoryInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug') ?? ''

  const [earliestYear, setEarliestYear] = useState('2015')
  const [promoteHighConfidence, setPromoteHighConfidence] = useState(false)
  const [runState, setRunState] = useState<RunState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [team, setTeam] = useState<Team | null>(null)
  const [run, setRun] = useState<HistoricalImportRun | null>(null)
  const [seasonResults, setSeasonResults] = useState<HistoricalSeasonResult[]>([])
  const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0)
  const [didPromote, setDidPromote] = useState(false)

  useEffect(() => {
    if (!teamSlug) return
    Promise.all([
      fetch(`/api/teams?slug=${teamSlug}`).then(r => r.json()),
      fetch(`/api/scrape/historical/runs?teamSlug=${teamSlug}`).then(r => r.json()),
    ]).then(([teamData, runsData]) => {
      if (teamData && !teamData.error) setTeam(teamData as Team)
      if (runsData.runs?.length > 0) {
        setRun(runsData.runs[0])
        setSeasonResults(runsData.latestSeasonResults ?? [])
        const latestRun = runsData.runs[0] as HistoricalImportRun
        if (latestRun.status === 'complete' || latestRun.status === 'failed') {
          setRunState('done')
          setDidPromote((latestRun.promotedCount ?? 0) > 0)
        }
      }
    }).catch(() => null)
  }, [teamSlug])

  // Season-by-season execution.
  // Per-season fetch errors are absorbed via IIFE so the loop always continues —
  // a single failed season never halts the remaining pending seasons.
  const executeSeasons = useCallback(
    async (
      results: HistoricalSeasonResult[],
      runId: string,
      promoteWhenDone: boolean,
      idx: number,
    ): Promise<void> => {
      const pending = results.filter(r => r.status === 'pending')

      if (pending.length === 0) {
        setRunState('finalizing')
        try {
          const res = await fetch('/api/scrape/historical/complete-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId, promoteHighConfidence: promoteWhenDone }),
          })
          if (!res.ok) throw new Error(`complete-run failed: HTTP ${res.status}`)
          const data = await res.json()
          if (data.run) setRun(data.run)
          setDidPromote(promoteWhenDone && (data.promoted ?? 0) > 0)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to finalize import')
          setRunState('error')
          return
        }
        setRunState('done')
        return
      }

      const next = pending[0]
      setCurrentSeasonIndex(idx)

      // Optimistic: flip this row to 'running' before the fetch
      const optimistic = results.map(r =>
        r.id === next.id ? { ...r, status: 'running' as const } : r,
      )
      setSeasonResults(optimistic)

      // IIFE: catch per-season errors and return a synthetic failed result
      // so the rest of the loop is never blocked
      const updated: HistoricalSeasonResult = await (async () => {
        try {
          const res = await fetch('/api/scrape/historical/run-season', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seasonResultId: next.id }),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          return data.seasonResult as HistoricalSeasonResult
        } catch (err) {
          return {
            ...next,
            status: 'failed' as const,
            errorMessage: err instanceof Error ? err.message : 'Network error',
          }
        }
      })()

      const updatedResults = optimistic.map(r => (r.id === updated.id ? updated : r))
      setSeasonResults(updatedResults)

      await executeSeasons(updatedResults, runId, promoteWhenDone, idx + 1)
    },
    [],
  )

  const handleStart = async () => {
    if (!team) return
    setError(null)
    setRunState('creating')
    const promoteWhenDone = promoteHighConfidence

    let data: { run: HistoricalImportRun; seasonResults: HistoricalSeasonResult[] }
    try {
      const res = await fetch('/api/scrape/historical/create-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug,
          baseRosterUrl: team.websiteUrl,
          earliestStartYear: parseInt(earliestYear, 10),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`)
        setRunState('error')
        return
      }
      data = json
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import')
      setRunState('error')
      return
    }

    setRun(data.run)
    setSeasonResults(data.seasonResults)
    setCurrentSeasonIndex(0)
    setRunState('running')

    await executeSeasons(data.seasonResults, data.run.id, promoteWhenDone, 0)
  }

  // Retry: reset failed seasons to pending locally, then re-run the loop
  const handleRetry = async () => {
    if (!run) return
    setError(null)
    setRunState('running')
    const reset = seasonResults.map(r =>
      r.status === 'failed'
        ? { ...r, status: 'pending' as const, errorMessage: undefined }
        : r,
    )
    setSeasonResults(reset)
    await executeSeasons(reset, run.id, promoteHighConfidence, 0)
  }

  const handleReset = () => {
    setRunState('idle')
    setRun(null)
    setSeasonResults([])
    setCurrentSeasonIndex(0)
    setError(null)
    setDidPromote(false)
  }

  const statusColor = (status: HistoricalSeasonResult['status']) => {
    switch (status) {
      case 'complete': return 'bg-emerald-100 text-emerald-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'skipped': return 'bg-gray-100 text-gray-500'
      case 'running': return 'bg-blue-100 text-blue-700 animate-pulse'
      default: return 'bg-gray-100 text-gray-400'
    }
  }

  const completedCount = seasonResults.filter(r => r.status === 'complete' || r.status === 'skipped').length
  const failedCount = seasonResults.filter(r => r.status === 'failed').length
  const totalEntries = seasonResults.reduce((s, r) => s + r.entriesExtracted, 0)

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← Builder
          </Link>
          <Link
            href={teamSlug ? `/builder/workspace?teamSlug=${teamSlug}` : '/builder'}
            className="text-xs text-gray-300 hover:text-white transition-colors mb-3 block"
          >
            ← Team Workspace
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mb-2">Historical Import</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Fetch public roster data season-by-season. Rows are saved as extracted entries — no
            identities are added to the graph until you promote them.
          </p>
        </div>
      </div>

      <div className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
        {runState === 'idle' && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 mb-8"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <h2 className="font-semibold text-[#0a1628] mb-5">Configure Historical Import</h2>

            {!teamSlug && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm text-amber-700">
                  No team selected. Return to the builder and select a team.
                </p>
              </div>
            )}

            {team && (
              <div className="mb-4 rounded-md bg-[#f0ece5] border border-[rgba(180,168,150,0.4)] px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wide">Roster URL</p>
                <p className="text-sm font-mono text-[#0a1628] break-all">{team.websiteUrl}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Earliest Season Start Year
                </label>
                <input
                  type="number"
                  min="1950"
                  max="2030"
                  value={earliestYear}
                  onChange={e => setEarliestYear(e.target.value)}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
                <p className="text-xs text-gray-400">
                  e.g. 2015 imports seasons 2015-16 through present
                </p>
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteHighConfidence}
                    onChange={e => setPromoteHighConfidence(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-[#0a1628]">
                    Auto-promote high-confidence entries after import
                    <span className="block text-xs text-gray-400 mt-0.5">
                      Entries with &ge;80% confidence are added to the graph automatically when the
                      import finishes. If unchecked, review and promote them manually.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!teamSlug || !team || runState !== 'idle'}
              className="mt-6 bg-[#990000] hover:bg-[#b30000] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
            >
              Start Historical Import →
            </button>
          </div>
        )}

        {run && (
          <>
            <div className="flex gap-6 mb-6 flex-wrap">
              {[
                { label: 'Seasons', value: seasonResults.length },
                { label: 'Fetched', value: completedCount },
                { label: 'Entries', value: totalEntries },
                { label: 'Status', value: run.status },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-lg font-semibold text-[#0a1628]">{s.value}</p>
                </div>
              ))}
            </div>

            {(runState === 'running' || runState === 'creating') && (
              <div className="flex items-center gap-2 mb-6 text-sm text-blue-700">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin inline-block" />
                Fetching season {currentSeasonIndex + 1} of {seasonResults.length}…
              </div>
            )}

            {runState === 'finalizing' && (
              <div className="flex items-center gap-2 mb-6 text-sm text-blue-700">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin inline-block" />
                Completing import…
              </div>
            )}

            {runState === 'error' && error && (
              <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 flex items-start justify-between gap-4">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
                >
                  New Import
                </button>
              </div>
            )}

            {runState === 'done' && (
              <div className="mb-6">
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 mb-4">
                  <p className="text-sm text-emerald-800">
                    {didPromote
                      ? 'Import complete. High-confidence entries were promoted to the graph.'
                      : `Import complete. ${totalEntries} roster rows saved as extracted entries. Review and promote them below.`}
                    {failedCount > 0 && (
                      <span className="block mt-1 text-amber-700">
                        {failedCount} season{failedCount > 1 ? 's' : ''} failed to fetch.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/builder/promote?teamSlug=${teamSlug}`}
                    className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-4 py-2 rounded-md transition-colors"
                  >
                    Promote Roster →
                  </Link>
                  <Link
                    href={`/builder/people?teamSlug=${teamSlug}`}
                    className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
                  >
                    View People →
                  </Link>
                  <Link
                    href={`/builder/graph?teamSlug=${teamSlug}`}
                    className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Open Graph →
                  </Link>
                  <Link
                    href={`/builder/quality?teamSlug=${teamSlug}`}
                    className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
                  >
                    View Quality →
                  </Link>
                  {failedCount > 0 && (
                    <button
                      onClick={handleRetry}
                      className="text-sm font-medium text-amber-700 border border-amber-400 hover:bg-amber-50 px-4 py-2 rounded-md transition-colors"
                    >
                      Retry Failed Seasons
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="text-sm font-medium text-gray-500 hover:text-[#0a1628] transition-colors"
                  >
                    New Import
                  </button>
                </div>
              </div>
            )}

            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(180,168,150,0.3)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Season</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entries</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonResults.map((sr, i) => (
                    <tr
                      key={sr.id}
                      className={`border-b border-[rgba(180,168,150,0.2)] ${i % 2 === 1 ? 'bg-[#faf9f7]' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-[#0a1628]">{sr.seasonYear}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(sr.status)}`}>
                          {sr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        {sr.status === 'complete' ? sr.entriesExtracted : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[200px]">
                        {sr.errorMessage ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {seasonResults.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-400 text-sm">
                  No seasons loaded yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-ink-muted text-sm">Loading…</div>}>
      <HistoryInner />
    </Suspense>
  )
}
