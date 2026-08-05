'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Team {
  id: string
  schoolName: string
  teamName: string
  sport: string
  gender: string
  slug: string
  websiteUrl: string
  createdAt: string
}

interface Counts {
  extractedEntries: number
  extractedPending: number
  promotedEntries: number
  rejectedEntries: number
  people: number
  memberships: number
  seasonsWithEntries: number
  historicalRuns: number
  enrichedProfiles?: number
  verifiedEnrichments?: number
}

interface Quality {
  score: number
  label: string
  warnings: string[]
}

interface RecommendedNextAction {
  id: string
  label: string
  href: string
  reason: string
}

interface ChecklistItem {
  id: string
  label: string
  status: 'complete' | 'warning' | 'missing'
  href: string
  detail: string
}

interface ReadinessData {
  team: Team
  counts: Counts
  quality: Quality
  recommendedNextAction: RecommendedNextAction
  checklist: ChecklistItem[]
}

interface HistoricalRun {
  id: string
  teamId: string
  status: string
  totalSeasons: number
  completedSeasons: number
  totalEntries: number
  startedAt: string
  finishedAt?: string
}

interface HistoricalRunsData {
  runs: HistoricalRun[]
  latestSeasonResults: unknown[]
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="h-24 bg-white rounded-lg border border-gray-200 animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-32 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white rounded-lg border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function statusColor(status: 'complete' | 'warning' | 'missing') {
  if (status === 'complete') return 'bg-emerald-100 text-emerald-800'
  if (status === 'warning') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-600'
}

function stepStatus(done: boolean, warn?: boolean): { label: string; color: string } {
  if (done) return { label: 'Complete', color: 'text-emerald-600' }
  if (warn) return { label: 'In progress', color: 'text-amber-600' }
  return { label: 'Pending', color: 'text-gray-400' }
}

function WorkspaceInner() {
  const searchParams = useSearchParams()
  const teamSlug = searchParams.get('teamSlug')

  const [readiness, setReadiness] = useState<ReadinessData | null>(null)
  const [historical, setHistorical] = useState<HistoricalRunsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!teamSlug) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/demo/readiness?teamSlug=${teamSlug}`).then(r => {
        if (!r.ok) throw new Error(`Readiness fetch failed: ${r.status}`)
        return r.json() as Promise<ReadinessData>
      }),
      fetch(`/api/scrape/historical/runs?teamSlug=${teamSlug}`).then(r => {
        if (!r.ok) throw new Error(`Historical runs fetch failed: ${r.status}`)
        return r.json() as Promise<HistoricalRunsData>
      }),
    ])
      .then(([r, h]) => {
        setReadiness(r)
        setHistorical(h)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => setLoading(false))
  }, [teamSlug, retryKey])

  if (!teamSlug) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">No team selected.</p>
          <Link
            href="/builder/new"
            className="inline-block bg-[#990000] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#7a0000] transition-colors"
          >
            Create a team
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-700 font-medium">Failed to load workspace</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="inline-block bg-[#990000] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#7a0000] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!readiness) return null

  const { team, counts, quality, recommendedNextAction, checklist } = readiness
  const latestRun = historical?.runs?.[0] ?? null

  const steps = [
    {
      num: 1,
      title: 'Current Roster Extraction',
      description: 'Scrape and extract the current team roster from the athletic website.',
      href: `/builder/debug-roster?teamSlug=${teamSlug}`,
      done: counts.extractedEntries > 0,
      warn: false,
    },
    {
      num: 2,
      title: 'Historical Import',
      description: 'Import roster data from past seasons to build alumni history.',
      href: `/builder/history?teamSlug=${teamSlug}`,
      done: counts.seasonsWithEntries > 1,
      warn: counts.historicalRuns > 0,
    },
    {
      num: 3,
      title: 'Add rows to graph',
      description: 'Review roster rows and add them to the people graph.',
      href: `/builder/promote?teamSlug=${teamSlug}`,
      done: counts.people > 0 && counts.extractedPending === 0,
      warn: counts.extractedPending > 0,
    },
    {
      num: 4,
      title: 'People & Sources',
      description: 'View and manage people in the graph with their source data.',
      href: `/builder/people?teamSlug=${teamSlug}`,
      done: counts.people > 0,
      warn: false,
    },
    {
      num: 5,
      title: 'Quality Check',
      description: 'Review graph quality, missing fields, and open review items.',
      href: `/builder/quality?teamSlug=${teamSlug}`,
      done: quality.score >= 60,
      warn: quality.score > 0 && quality.score < 60,
    },
    {
      num: 6,
      title: 'Graph Output',
      description: 'View the final alumni graph and explore connections.',
      href: `/builder/graph?teamSlug=${teamSlug}`,
      done: counts.people > 0 && quality.score >= 60,
      warn: false,
    },
    {
      num: 7,
      title: 'Verified profile details',
      description: 'Add verified career, contact, and relationship context to promoted alumni.',
      href: `/builder/enrich?teamSlug=${teamSlug}`,
      done: (counts.verifiedEnrichments ?? 0) > 0,
      warn: (counts.enrichedProfiles ?? 0) > 0 && (counts.verifiedEnrichments ?? 0) === 0,
    },
  ]

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/builder"
            className="text-white/70 hover:text-white text-sm transition-colors inline-block mb-4"
          >
            &larr; Builder
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-semibold">{team.teamName}</h1>
              <p className="text-white/70 text-sm mt-1">
                {team.schoolName} &middot; {team.sport} &middot; {team.gender}
              </p>
              <a
                href={team.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/75 text-xs font-mono hover:text-white/80 transition-colors mt-1 inline-block"
              >
                {team.websiteUrl}
              </a>
            </div>
            <span className="bg-white/10 text-white/70 text-xs font-mono px-3 py-1 rounded-full">
              {team.slug}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Three-layer path banner */}
        <div className="bg-[#0a1628] rounded-lg p-5">
          <p className="text-white/70 text-xs uppercase tracking-widest font-medium mb-3">Recommended path</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/builder/agent?teamSlug=${teamSlug}`}
              className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              1. AI Builder
            </Link>
            <span className="text-white/30 text-sm">&rarr;</span>
            <Link
              href={`/builder/captain-review?teamSlug=${teamSlug}`}
              className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              2. Captain Review
            </Link>
            <span className="text-white/30 text-sm">&rarr;</span>
            <Link
              href={`/network/search?teamSlug=${teamSlug}`}
              className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              3. Player Network
            </Link>
          </div>
          <p className="text-white/75 text-xs mt-3">
            Extract rows with the AI Builder, approve for graph, then publish to the Player Network via Captain Review.
          </p>
        </div>

        <div data-testid="workspace-ready" className="bg-white border border-gray-200 rounded-lg p-5 border-l-4 border-l-[#990000]">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Recommended next action
          </p>
          <div data-testid="recommended-action" className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-gray-900 font-semibold text-lg">
                {recommendedNextAction.label}
              </p>
              <p className="text-gray-500 text-sm mt-0.5">{recommendedNextAction.reason}</p>
            </div>
            <Link
              href={recommendedNextAction.href}
              className="bg-[#990000] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#7a0000] transition-colors whitespace-nowrap"
            >
              Go &rarr;
            </Link>
          </div>
        </div>

        <div data-testid="readiness-checklist" className="flex flex-wrap gap-2">
          {checklist.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 ${statusColor(item.status)}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Extracted entries', value: counts.extractedEntries },
            { label: 'Pending review', value: counts.extractedPending },
            { label: 'People promoted', value: counts.people },
            { label: 'Seasons covered', value: counts.seasonsWithEntries },
            {
              label: 'Graph quality',
              value: `${quality.score}/100`,
            },
            { label: 'Open warnings', value: quality.warnings.length },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <p className="text-2xl font-bold text-[#0a1628]">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div data-testid="workflow-steps">
          <h2 className="text-[#0a1628] font-semibold text-base mb-4">Workflow steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map(step => {
              const st = stepStatus(step.done, step.warn)
              return (
                <div
                  key={step.num}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-mono text-gray-400">Step {step.num}</span>
                    <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div>
                    <p className="text-[#0a1628] font-semibold text-sm">{step.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{step.description}</p>
                  </div>
                  <Link
                    href={step.href}
                    className="text-[#990000] text-xs font-medium hover:underline mt-auto"
                  >
                    Open &rarr;
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-[#0a1628] font-semibold text-base mb-4">Recent activity</h2>
          {latestRun ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-[#0a1628]">
                    Historical import, {' '}
                    <span className="capitalize">{latestRun.status}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {latestRun.completedSeasons} of {latestRun.totalSeasons} seasons &middot;{' '}
                    {latestRun.totalEntries} entries
                  </p>
                </div>
                <Link
                  href={`/builder/history?teamSlug=${teamSlug}`}
                  className="text-[#990000] text-xs font-medium hover:underline"
                >
                  View &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-400 text-sm">No activity yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WorkspaceInner />
    </Suspense>
  )
}
