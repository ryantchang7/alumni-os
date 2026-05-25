'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { ExtractedRosterEntry } from '@/lib/store/types'

function StatusPill({ status }: { status: ExtractedRosterEntry['status'] }) {
  const colors = {
    extracted: 'bg-blue-100 text-blue-700',
    promoted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const cls =
    value >= 0.8
      ? 'bg-green-100 text-green-800'
      : 'bg-amber-100 text-amber-800'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {pct}%
    </span>
  )
}

function PromoteInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [entries, setEntries] = useState<ExtractedRosterEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!teamSlug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/roster/entries?teamSlug=${encodeURIComponent(teamSlug)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setEntries(data as ExtractedRosterEntry[])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [teamSlug])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectHighConfidence() {
    const ids = entries
      .filter(e => e.extractionConfidence >= 0.8 && e.status === 'extracted')
      .map(e => e.id)
    setSelected(new Set(ids))
  }

  async function handlePromote() {
    if (!teamSlug || selected.size === 0) return
    setActionLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/roster/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, entryIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setSuccessMsg(
          `Promoted ${data.promotedCount} entries. ${data.peopleCreated} people created, ${data.membershipsCreatedOrUpdated} memberships updated.`,
        )
        setSelected(new Set())
        await fetchEntries()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!teamSlug || selected.size === 0) return
    setActionLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/roster/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, entryIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setSuccessMsg(`Rejected ${data.rejectedCount} entries.`)
        setSelected(new Set())
        await fetchEntries()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const extractedEntries = entries.filter(e => e.status === 'extracted')
  const allDone = entries.length > 0 && extractedEntries.length === 0

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
              className="text-xs text-gray-300 hover:text-white transition-colors mb-4 block"
            >
              ← Team Workspace
            </Link>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl font-semibold tracking-tight mb-1">
                Promote Roster Entries
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Review extracted roster rows before adding them to the team graph.
              </p>
            </div>
            {teamSlug && (
              <span className="mt-1 inline-block rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-gray-300 font-mono">
                Team: {teamSlug}
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
          <div className="flex items-center gap-3 text-[#8a7f70] text-sm py-12 justify-center">
            <span className="w-5 h-5 border-2 border-[#8a7f70]/30 border-t-[#8a7f70] rounded-full animate-spin" />
            Loading entries…
          </div>
        ) : (
          <>
            {/* Actions bar */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <button
                data-testid="select-high-confidence-button"
                onClick={selectHighConfidence}
                disabled={actionLoading || extractedEntries.length === 0}
                className="text-xs font-medium text-[#0a1628] border border-[#0a1628]/40 rounded px-3 py-1.5 hover:bg-[#0a1628]/5 disabled:opacity-40 transition-colors"
              >
                Select all high-confidence (&ge;80%)
              </button>
              <button
                data-testid="promote-selected-button"
                onClick={handlePromote}
                disabled={actionLoading || selected.size === 0 || !teamSlug}
                className="text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded px-4 py-1.5 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? 'Working…' : `Promote selected (${selected.size})`}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || selected.size === 0}
                className="text-sm font-medium text-white bg-[#990000] hover:bg-[#b30000] rounded px-4 py-1.5 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? 'Working…' : `Reject selected (${selected.size})`}
              </button>

              {successMsg && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">
                  {successMsg}
                </span>
              )}
              {error && (
                <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-1.5">
                  {error}
                </span>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-12 text-center">
                <XCircle className="h-8 w-8 text-[#8a7f70] mx-auto mb-3" />
                <p className="text-sm text-[#8a7f70] mb-2">No extracted entries yet.</p>
                <Link
                  href={`/builder/debug-roster?teamSlug=${teamSlug}`}
                  className="text-sm text-[#990000] hover:underline font-medium"
                >
                  Run a scrape first from /builder/debug-roster →
                </Link>
              </div>
            ) : allDone ? (
              <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-[#8a7f70] mb-4">
                  All entries have been promoted or rejected.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link
                    href={`/builder/people?teamSlug=${teamSlug}`}
                    className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-4 py-2 rounded-md transition-colors"
                  >
                    View People →
                  </Link>
                  <Link
                    href={`/builder/history?teamSlug=${teamSlug}`}
                    className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Historical Import →
                  </Link>
                </div>
              </div>
            ) : (
              <div
                data-testid="promote-table"
                className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f0ece5]">
                      <th className="px-4 py-3 w-8" />
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Class
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Hometown
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        High School
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Season
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Conf.
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8a7f70]">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                    {entries.map(entry => {
                      const isSelected = selected.has(entry.id)
                      const isExtracted = entry.status === 'extracted'
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => isExtracted && toggleSelect(entry.id)}
                          className={`transition-colors ${isExtracted ? 'cursor-pointer hover:bg-[#f5f2ed]' : 'opacity-60'} ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            {isExtracted && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(entry.id)}
                                onClick={e => e.stopPropagation()}
                                className="rounded border-gray-300"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#0d1f3c]">
                            <div className="flex items-center gap-2">
                              {entry.extractionConfidence >= 0.8 ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              )}
                              {entry.fullName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#8a7f70]">
                            {entry.classLabel ?? <span className="text-[#c4bbb0]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[#8a7f70]">
                            {entry.hometown ?? <span className="text-[#c4bbb0]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[#8a7f70]">
                            {entry.highSchool ?? <span className="text-[#c4bbb0]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[#8a7f70]">
                            {entry.seasonYear ?? <span className="text-[#c4bbb0]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <ConfidencePill value={entry.extractionConfidence} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={entry.status} />
                          </td>
                          <td className="px-4 py-3 text-[#8a7f70] font-mono text-xs max-w-[180px] truncate">
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="hover:text-[#990000] transition-colors"
                              title={entry.sourceUrl}
                            >
                              {entry.sourceUrl.replace(/^https?:\/\//, '').slice(0, 40)}
                              {entry.sourceUrl.length > 47 ? '…' : ''}
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PromotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center text-[#8a7f70] text-sm">Loading…</div>}>
      <PromoteInner />
    </Suspense>
  )
}
