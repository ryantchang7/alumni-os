'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, Bug } from 'lucide-react'
import type { DiscoveryPreviewResponse } from '@/lib/scraping/types'

const inputClass =
  'bg-white border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2.5 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 w-full'

function PageTypeBadge({ type, priority }: { type: string; priority: 'high' | 'medium' | 'low' }) {
  const typeColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  }
  const priorityColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className="flex gap-1 flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[priority] ?? typeColors.low}`}>
        {type.replace(/_/g, ' ')}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[priority]}`}>
        {priority}
      </span>
    </span>
  )
}

export default function BuilderDiscoveryPage() {
  const [form, setForm] = useState({
    teamName: "Penn Men's Golf",
    schoolName: 'University of Pennsylvania',
    sport: "Men's Golf",
    gender: 'Men',
    website: 'https://pennathletics.com/sports/mens-golf',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiscoveryPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/discovery/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? `Request failed with status ${res.status}`)
      } else {
        const data: DiscoveryPreviewResponse = await res.json()
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Check the URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  const nonRobotsWarnings = result?.warnings?.filter(w => !w.toLowerCase().includes('robot')) ?? []

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 py-10">
        <div className="max-w-[1320px] mx-auto">
          <Link
            href="/builder"
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← Builder
          </Link>
          <h1 className="text-white text-3xl font-semibold tracking-tight">Real Discovery Preview</h1>
          <p className="text-gray-300 text-base mt-2 max-w-2xl leading-relaxed">
            Test the first real agent step: website → discovered pages → roster extraction preview.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This preview fetches the public URL you enter and shows what the agent would discover. Nothing is saved.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1320px] mx-auto px-8 py-8">
        {/* Form */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 mb-8"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                  Team Name
                </label>
                <input
                  className={inputClass}
                  value={form.teamName}
                  onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                  placeholder="e.g. Penn Men's Golf"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                  School Name
                </label>
                <input
                  className={inputClass}
                  value={form.schoolName}
                  onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                  placeholder="e.g. University of Pennsylvania"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                  Sport
                </label>
                <input
                  className={inputClass}
                  value={form.sport}
                  onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                  placeholder="e.g. Men's Golf"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                  Gender
                </label>
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                Team Website URL
              </label>
              <input
                className={`${inputClass} font-mono`}
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://athletics.university.edu/sports/golf"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#990000] hover:bg-[#b30000] text-white font-semibold px-5 py-3 rounded-md transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Fetching…
                </>
              ) : (
                'Run Preview →'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Root page summary */}
            {result.rootPage && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Root Page</p>
                <div className="space-y-1.5">
                  <p className="text-xs font-mono text-[#0a1628] truncate">{result.rootPage.finalUrl || result.rootPage.url}</p>
                  {result.rootPage.title && (
                    <p className="text-sm font-medium text-[#0a1628]">{result.rootPage.title}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${result.rootPage.status === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                    >
                      HTTP {result.rootPage.status}
                    </span>
                    {result.rootPage.contentType && (
                      <span className="text-xs text-ink-muted font-mono">{result.rootPage.contentType}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {nonRobotsWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {nonRobotsWarnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-800">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust notes */}
            {result.trustNotes && result.trustNotes.length > 0 && (
              <div className="bg-[#112240] border border-white/[0.08] rounded-lg p-4">
                <p className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-3">Trust & Safety</p>
                <ul className="space-y-2">
                  {result.trustNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Discovered pages */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="px-5 py-4 border-b border-[rgba(180,168,150,0.35)]">
                <h2 className="text-sm font-semibold text-[#0a1628]">
                  Discovered Pages ({result.discoveredPages.length})
                </h2>
              </div>
              {result.discoveredPages.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-ink-muted">No pages discovered.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(180,168,150,0.35)] bg-[#f8f5f0]">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Page</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Confidence</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.discoveredPages.slice(0, 20).map((page, i) => (
                        <tr key={i} className="border-b border-[rgba(180,168,150,0.2)] last:border-0">
                          <td className="px-4 py-3 max-w-[280px]">
                            <p className="text-xs font-mono text-[#0a1628] truncate" title={page.url}>
                              {page.label || page.url}
                            </p>
                            <p className="text-[10px] text-ink-muted font-mono truncate mt-0.5">{page.url}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <PageTypeBadge type={page.pageType} priority={page.priority} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-mono text-[#0a1628]">
                              {Math.round(page.confidence * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-ink-muted leading-relaxed">{page.reason}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Roster entries */}
            {(() => {
              const entries = result.rosterEntriesFromRootIfAny
              const high = entries.filter(e => e.extractionConfidence >= 0.8).length
              const status: 'pass' | 'partial' | 'fail' =
                entries.length === 0 ? 'fail'
                : high >= entries.length * 0.7 ? 'pass'
                : 'partial'
              return (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <div className="px-5 py-4 border-b border-[rgba(180,168,150,0.35)] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold text-[#0a1628]">
                        Roster Entries from Root Page ({entries.length})
                      </h2>
                      {status === 'pass' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Pass
                        </span>
                      )}
                      {status === 'partial' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-3 w-3" /> Partial
                        </span>
                      )}
                      {status === 'fail' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> No data
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/builder/debug-roster?url=${encodeURIComponent(form.website)}`}
                      className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-[#0a1628] transition-colors"
                    >
                      <Bug className="h-3.5 w-3.5" />
                      Debug extractor
                    </Link>
                  </div>
                  {entries.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-ink-muted">
                        No roster structure found on the root page. Select a discovered roster page to try extraction.
                      </p>
                      <Link
                        href="/builder/debug-roster"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#990000] hover:underline"
                      >
                        <Bug className="h-3.5 w-3.5" /> Open debugger to test a specific roster URL
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[rgba(180,168,150,0.35)] bg-[#f8f5f0]">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Name</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Class</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Hometown</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.slice(0, 20).map((entry, i) => (
                            <tr key={i} className="border-b border-[rgba(180,168,150,0.2)] last:border-0">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {entry.extractionConfidence >= 0.8
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                  <span className="text-sm font-medium text-[#0a1628]">{entry.fullName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-ink-muted">{entry.classLabel ?? '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-ink-muted">{entry.hometown ?? '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-mono text-[#0a1628]">
                                  {Math.round(entry.extractionConfidence * 100)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Next steps */}
            <div className="border-t border-[rgba(180,168,150,0.35)] pt-6 flex flex-wrap gap-3">
              <Link
                href="/builder/run"
                className="text-sm font-semibold text-white bg-[#990000] hover:bg-[#b30000] px-5 py-2.5 rounded-md transition-colors"
              >
                Continue to Agent Run →
              </Link>
              <Link
                href="/builder/debug-roster"
                className="flex items-center gap-1.5 text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                <Bug className="h-4 w-4" />
                Debug Extractor
              </Link>
              <Link
                href="/builder/graph"
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                Open Graph →
              </Link>
              <Link
                href="/builder/promote?teamSlug=penn-mens-golf"
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                Promote Entries →
              </Link>
              <Link
                href="/builder/people?teamSlug=penn-mens-golf"
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-md transition-colors"
              >
                View People →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
