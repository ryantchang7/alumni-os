'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

interface RosterEntry {
  fullName: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  bioUrl?: string
  sourceUrl: string
  extractionConfidence: number
  rawText?: string
}

interface DebugResult {
  page: { url: string; finalUrl: string; title?: string; status: number }
  entries: RosterEntry[]
  warnings: string[]
  counts: { entries: number; highConfidence: number; lowConfidence: number }
}

const PRESET_URLS = [
  { label: '2025–26 Roster (current)', url: 'https://pennathletics.com/sports/mens-golf/roster' },
  { label: '2003–04 Roster (historical)', url: 'https://pennathletics.com/sports/mens-golf/roster/2003-04' },
]

const QA_SPECS: Record<string, { label: string; expectedCount: number; expectedNames: string[] }> = {
  'https://pennathletics.com/sports/mens-golf/roster': {
    label: '2025–26 Penn Men\'s Golf',
    expectedCount: 8,
    expectedNames: ['Hayden Adams', 'Arjun Caprihan', 'Ryan Chang', 'Henry Chen', 'Max Fonseca', 'Owen Hayes', 'Wesley Hu', 'Kayden Wang'],
  },
  'https://pennathletics.com/sports/mens-golf/roster/2003-04': {
    label: '2003–04 Penn Men\'s Golf',
    expectedCount: 7,
    expectedNames: ['Sean Barrett', 'Patrick Cooper', 'Brandon Mourges', 'Larry Nickell', 'Jeff Riley', 'Derek Rogers', 'Scott Squires'],
  },
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const cls =
    value >= 0.8
      ? 'bg-green-100 text-green-800'
      : value >= 0.6
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{pct}%</span>
  )
}

function DebugRosterInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [url, setUrl] = useState(PRESET_URLS[0].url)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DebugResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveResult, setSaveResult] = useState<{ scrapeRunId: string; entriesCount: number } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset save state when result changes
  useEffect(() => {
    setSaveResult(null)
    setSaveError(null)
  }, [result])

  async function saveExtraction() {
    if (!teamSlug || !result) return
    setSaveLoading(true)
    setSaveError(null)
    setSaveResult(null)
    try {
      const res = await fetch('/api/scrape/roster-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, url: result.page.url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? `HTTP ${res.status}`)
      } else {
        setSaveResult({ scrapeRunId: data.scrapeRun.id, entriesCount: data.counts.entries })
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSaveLoading(false)
    }
  }

  async function run() {
    setLoading(true)
    setResult(null)
    setError(null)
    setExpandedRow(null)

    try {
      const res = await fetch('/api/debug/roster-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setResult(data as DebugResult)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted mb-1">
            Builder · Debug
          </p>
          <h1 className="text-2xl font-semibold text-[#0d1f3c] tracking-tight">
            Roster Extraction Debugger
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Inspect what the extraction engine pulls from any roster page before committing to a build.
          </p>
        </div>

        {/* URL input */}
        <div data-testid="roster-extract-form" className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-5 mb-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted mb-2">
            Roster URL
          </label>
          <div className="flex gap-3">
            <input
              data-testid="roster-url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://pennathletics.com/sports/mens-golf/roster"
              className="flex-1 rounded-md border border-[rgba(180,168,150,0.5)] bg-white px-3 py-2 text-sm text-[#0d1f3c] placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-[#0a1628]"
            />
            <button
              data-testid="roster-extract-submit"
              onClick={run}
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 rounded-md bg-[#990000] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b30000] disabled:opacity-50 transition-colors"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Extracting…' : 'Extract'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {PRESET_URLS.map(p => (
              <button
                key={p.url}
                onClick={() => setUrl(p.url)}
                className="text-xs text-[#990000] border border-[#990000]/30 rounded px-2.5 py-1 hover:bg-[#990000]/5 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-6"
            >
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              data-testid="roster-results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Page meta */}
              <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-5 mb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-1">Page</p>
                    <p className="text-sm font-medium text-[#0d1f3c]">{result.page.title ?? '(no title)'}</p>
                    <a
                      href={result.page.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#990000] hover:underline mt-0.5"
                    >
                      {result.page.finalUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-2xl font-bold text-[#0d1f3c]">{result.counts.entries}</p>
                      <p className="text-xs text-ink-muted">Players found</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700">{result.counts.highConfidence}</p>
                      <p className="text-xs text-ink-muted">High confidence</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{result.counts.lowConfidence}</p>
                      <p className="text-xs text-ink-muted">Low confidence</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mb-4 space-y-1">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* QA summary for known Penn URLs */}
              {(() => {
                const qa = QA_SPECS[result.page.url] ?? QA_SPECS[result.page.finalUrl]
                if (!qa) return null
                const countPass = result.counts.entries === qa.expectedCount
                const extractedNames = new Set(result.entries.map(e => e.fullName))
                return (
                  <div className="mb-4 bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">QA: {qa.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${countPass && result.entries.length === qa.expectedCount && qa.expectedNames.every(n => extractedNames.has(n)) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {countPass && qa.expectedNames.every(n => extractedNames.has(n)) ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className="text-ink-muted">Expected count:</span>
                      <span className={`font-semibold ${countPass ? 'text-green-700' : 'text-red-600'}`}>
                        {result.counts.entries} / {qa.expectedCount}
                        {countPass
                          ? <CheckCircle2 className="inline h-3.5 w-3.5 ml-1" />
                          : <XCircle className="inline h-3.5 w-3.5 ml-1" />}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      {qa.expectedNames.map(name => {
                        const found = extractedNames.has(name)
                        return (
                          <div key={name} className="flex items-center gap-2 text-sm">
                            {found
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                            <span className={found ? 'text-[#0d1f3c]' : 'text-red-600 line-through'}>{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Save to team graph */}
              <div className="mb-4 bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-3">
                  Save to Team Graph
                </p>
                {teamSlug ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      data-testid="roster-save-button"
                      onClick={saveExtraction}
                      disabled={saveLoading || result.entries.length === 0}
                      className="flex items-center gap-2 rounded-md bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2f4a] disabled:opacity-50 transition-colors"
                    >
                      {saveLoading ? 'Saving…' : 'Save this extraction to team graph'}
                    </button>
                    <span className="text-xs text-ink-muted">Team: <span className="font-mono text-[#0a1628]">{teamSlug}</span></span>
                    {saveResult && (
                      <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">
                        Saved {saveResult.entriesCount} entries.{' '}
                        <Link
                          href={`/builder/promote?teamSlug=${teamSlug}`}
                          className="underline font-medium"
                        >
                          Promote entries →
                        </Link>
                      </span>
                    )}
                    {saveError && (
                      <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-1.5">
                        {saveError}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Create or select a team first to save this extraction.{' '}
                    <Link href="/builder/new" className="text-[#990000] hover:underline font-medium">
                      Create a team →
                    </Link>
                  </p>
                )}
              </div>

              {/* Entries table */}
              {result.entries.length === 0 ? (
                <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg p-10 text-center">
                  <XCircle className="h-8 w-8 text-ink-muted mx-auto mb-3" />
                  <p className="text-sm text-ink-muted">No roster entries extracted from this page.</p>
                </div>
              ) : (
                <div className="bg-[#fffdf9] border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f0ece5]">
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">#</th>
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Class</th>
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Hometown</th>
                        <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">High School</th>
                        <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Conf.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                      {result.entries.map((e, i) => (
                        <React.Fragment key={`${e.fullName}-${i}`}>
                          <tr
                            key={`row-${e.fullName}-${i}`}
                            onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                            className="hover:bg-[#f5f2ed] cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-ink-muted font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-[#0d1f3c]">
                              <div className="flex items-center gap-2">
                                {e.extractionConfidence >= 0.8 ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                )}
                                {e.fullName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-ink-muted">{e.classLabel ?? <span className="text-[#c4bbb0]">, </span>}</td>
                            <td className="px-4 py-3 text-ink-muted">{e.hometown ?? <span className="text-[#c4bbb0]">, </span>}</td>
                            <td className="px-4 py-3 text-ink-muted">{e.highSchool ?? <span className="text-[#c4bbb0]">, </span>}</td>
                            <td className="px-4 py-3 text-right">
                              <ConfidencePill value={e.extractionConfidence} />
                            </td>
                          </tr>
                          <AnimatePresence>
                            {expandedRow === i && (
                              <motion.tr
                                key={`raw-${e.fullName}-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <td colSpan={6} className="px-4 py-3 bg-[#f0ece5]">
                                  <p className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-1">Raw text block</p>
                                  <pre className="text-xs text-[#0d1f3c] whitespace-pre-wrap break-words font-mono bg-white rounded p-3 border border-[rgba(180,168,150,0.35)] max-h-40 overflow-y-auto">
                                    {e.rawText ?? '(none)'}
                                  </pre>
                                  {e.bioUrl && (
                                    <a
                                      href={e.bioUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 mt-2 text-xs text-[#990000] hover:underline"
                                    >
                                      Bio page <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function DebugRosterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center text-ink-muted text-sm">Loading…</div>}>
      <DebugRosterInner />
    </Suspense>
  )
}
