'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'

const TEAM_SLUG = 'penn-mens-golf'
const BASE_ROSTER_URL = 'https://pennathletics.com/sports/mens-golf/roster'
const EARLIEST_YEAR = 2000

interface BuildPerson {
  personId: string
  canonicalName: string
  classLabel: string | null
  hometown: string | null
  publishedToNetwork: boolean
  publishedAt: string | null
}

type ImportStatus = 'idle' | 'running' | 'done' | 'error'

function PersonRow({
  person,
  onPublish,
  onHide,
  busy,
}: {
  person: BuildPerson
  onPublish: (id: string) => void
  onHide: (id: string) => void
  busy: string | null
}) {
  const isPublished = person.publishedToNetwork
  const isBusy = busy === person.personId

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[rgba(180,168,150,0.2)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0a1628] truncate">{person.canonicalName}</p>
        <p className="text-xs text-ink-muted mt-0.5">
          {[person.classLabel, person.hometown].filter(Boolean).join(' · ') || 'Roster member'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPublished ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <Eye className="w-3 h-3" />
              Visible to players
            </span>
            <button
              onClick={() => onHide(person.personId)}
              disabled={isBusy}
              className="text-xs font-medium text-ink-muted hover:text-[#0a1628] border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {isBusy ? '...' : 'Hide'}
            </button>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted bg-[#f5f2ee] border border-[rgba(180,168,150,0.35)] rounded-full px-2.5 py-1">
              <EyeOff className="w-3 h-3" />
              Hidden from players
            </span>
            <button
              onClick={() => onPublish(person.personId)}
              disabled={isBusy}
              className="text-xs font-medium bg-[#0a1628] hover:bg-[#112240] text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {isBusy ? '...' : 'Publish'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StepNumber({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  if (done) return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold flex-shrink-0 ${
        active ? 'bg-[#0a1628] text-white' : 'border border-[rgba(180,168,150,0.5)] text-ink-muted'
      }`}
    >
      {n}
    </span>
  )
}

function SectionShell({
  children,
  active,
  done,
}: {
  children: React.ReactNode
  active: boolean
  done: boolean
}) {
  return (
    <div
      className={`rounded-xl border ${
        active || done ? 'border-[#0a1628] bg-white' : 'border-[rgba(180,168,150,0.25)] bg-[#faf8f5]'
      }`}
      style={
        active || done
          ? { boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }
          : undefined
      }
    >
      {children}
    </div>
  )
}

function BuildPageInner() {
  const [people, setPeople] = useState<BuildPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [teamExists, setTeamExists] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // Import state
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
    const res = await fetch(`/api/build/people?teamSlug=${TEAM_SLUG}`)
    if (!res.ok) {
      setTeamExists(false)
      setLoading(false)
      return
    }
    const data = await res.json()
    setTeamExists(true)
    setPeople(data.people ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  const publishedCount = people.filter(p => p.publishedToNetwork).length
  const hasPeople = people.length > 0
  const hasPublished = publishedCount > 0

  const step1Done = !loading && teamExists
  const step2Done = hasPeople
  const step3Done = hasPublished
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4

  async function handlePublish(personId: string) {
    setBusy(personId)
    await fetch('/api/network/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamSlug: TEAM_SLUG, personId, role: 'captain' }),
    })
    await fetchPeople()
    setBusy(null)
  }

  async function handleHide(personId: string) {
    setBusy(personId)
    await fetch('/api/network/unpublish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamSlug: TEAM_SLUG, personId, role: 'captain' }),
    })
    await fetchPeople()
    setBusy(null)
  }

  async function runHistoricalImport() {
    setImportStatus('running')
    setImportProgress(null)
    setImportSummary(null)
    setImportError(null)

    try {
      // Step 1: Create the run and get season list
      const createRes = await fetch('/api/scrape/historical/create-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: TEAM_SLUG,
          baseRosterUrl: BASE_ROSTER_URL,
          earliestStartYear: EARLIEST_YEAR,
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}))
        throw new Error(err.error ?? `Failed to start import (${createRes.status})`)
      }
      const { run, seasonResults } = await createRes.json()
      const total: number = seasonResults.length
      setImportProgress({ done: 0, total })

      // Step 2: Run each season sequentially
      let done = 0
      for (const sr of seasonResults as { id: string }[]) {
        await fetch('/api/scrape/historical/run-season', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seasonResultId: sr.id }),
        })
        done++
        setImportProgress({ done, total })
      }

      // Step 3: Complete run + promote high-confidence entries
      const completeRes = await fetch('/api/scrape/historical/complete-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id, promoteHighConfidence: true }),
      })
      const completeData = completeRes.ok ? await completeRes.json() : {}
      const promoted: number = completeData.promoted ?? 0
      const people_created: number = completeData.peopleCreated ?? 0

      setImportSummary(
        `Found ${total} seasons. Promoted ${promoted} entries across ${people_created} alumni.`,
      )
      setImportStatus('done')
      setLoading(true)
      await fetchPeople()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
      setImportStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Build</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">
            Build your alumni clubhouse.
          </h1>
          <p className="text-gray-300 text-base mt-2 max-w-xl leading-relaxed">
            Import verified Penn Golf rosters, then choose who players can reach out to.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8">
        <div className="-mt-5 relative z-10 space-y-3 pb-16">

          {/* Step 1, Team confirmed */}
          <SectionShell active={activeStep === 1} done={step1Done}>
            <div className="flex gap-4 p-5">
              <StepNumber n={1} done={step1Done} active={activeStep === 1} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-snug mb-1 ${step1Done || activeStep === 1 ? 'text-[#0a1628]' : 'text-ink-muted'}`}>
                  Penn Golf confirmed
                </p>
                <p className={`text-xs leading-relaxed ${step1Done || activeStep === 1 ? 'text-[#3a4657]' : 'text-ink-muted'}`}>
                  {loading
                    ? 'Checking...'
                    : step1Done
                      ? 'Penn Men\'s Golf is set up.'
                      : 'Team not found. Contact support.'}
                </p>
              </div>
            </div>
          </SectionShell>

          {/* Step 2, Find alumni */}
          <SectionShell active={activeStep === 2} done={step2Done}>
            <div className="flex gap-4 p-5">
              <StepNumber n={2} done={step2Done} active={activeStep === 2} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-snug mb-1 ${step2Done || activeStep === 2 ? 'text-[#0a1628]' : 'text-ink-muted'}`}>
                  Find alumni
                </p>
                {step2Done ? (
                  <p className="text-xs text-[#3a4657] leading-relaxed">
                    {people.length} {people.length === 1 ? 'person' : 'people'} found from Penn Golf rosters.
                  </p>
                ) : importStatus === 'idle' ? (
                  <p className={`text-xs leading-relaxed ${activeStep === 2 ? 'text-[#3a4657]' : 'text-ink-muted'}`}>
                    Pull verified Penn Golf rosters from 2000 through today.
                  </p>
                ) : importStatus === 'running' ? (
                  <p className="text-xs text-[#3a4657] leading-relaxed">
                    {importProgress
                      ? `Processing season ${importProgress.done} of ${importProgress.total}...`
                      : 'Starting import...'}
                  </p>
                ) : importStatus === 'done' ? (
                  <p className="text-xs text-emerald-700 leading-relaxed">{importSummary}</p>
                ) : (
                  <p className="text-xs text-[#990000] leading-relaxed">{importError}</p>
                )}
              </div>
            </div>

            {/* Import action, visible when step 1 done and not yet have people */}
            {step1Done && !step2Done && (
              <div className="px-5 pb-5 pt-0">
                {importStatus === 'idle' || importStatus === 'error' ? (
                  <button
                    onClick={runHistoricalImport}
                    className="text-sm font-semibold bg-[#0a1628] hover:bg-[#112240] text-white px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Find Historical Alumni
                  </button>
                ) : importStatus === 'running' ? (
                  <div className="flex items-center gap-2 text-sm text-[#3a4657]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {importProgress
                        ? `${importProgress.done} / ${importProgress.total} seasons`
                        : 'Working...'}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Re-run available even after people exist */}
            {step2Done && importStatus === 'idle' && (
              <div className="px-5 pb-5 pt-0">
                <button
                  onClick={runHistoricalImport}
                  className="text-xs font-medium text-ink-muted hover:text-[#0a1628] border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] rounded-lg px-3 py-1.5 transition-colors"
                >
                  Re-run import
                </button>
              </div>
            )}
          </SectionShell>

          {/* Step 3, Review & publish */}
          <SectionShell active={activeStep === 3} done={step3Done}>
            <div className="flex gap-4 p-5">
              <StepNumber n={3} done={step3Done} active={activeStep === 3} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-snug mb-1 ${step3Done || activeStep === 3 ? 'text-[#0a1628]' : 'text-ink-muted'}`}>
                  Review and publish
                </p>
                <p className={`text-xs leading-relaxed ${step3Done || activeStep === 3 ? 'text-[#3a4657]' : 'text-ink-muted'}`}>
                  {step3Done
                    ? `${publishedCount} ${publishedCount === 1 ? 'profile' : 'profiles'} visible to players.`
                    : 'Choose who appears in the clubhouse. Nothing is visible until you publish.'}
                </p>
              </div>
            </div>

            {hasPeople && (
              <div className="px-5 pb-5">
                <div className="border-t border-[rgba(180,168,150,0.2)] pt-4">
                  <p className="text-xs text-ink-muted mb-3">
                    Published alumni are visible to current players.
                  </p>
                  {loading ? (
                    <p className="text-sm text-ink-muted py-4 text-center">Loading...</p>
                  ) : (
                    <div>
                      {people.map(person => (
                        <PersonRow
                          key={person.personId}
                          person={person}
                          onPublish={handlePublish}
                          onHide={handleHide}
                          busy={busy}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionShell>

          {/* Step 4, Open Clubhouse */}
          <SectionShell active={activeStep === 4} done={false}>
            <div className="flex gap-4 p-5">
              <StepNumber n={4} done={false} active={activeStep === 4} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-snug mb-1 ${activeStep === 4 ? 'text-[#0a1628]' : 'text-ink-muted'}`}>
                  Open Player Clubhouse
                </p>
                <p className={`text-xs leading-relaxed ${activeStep === 4 ? 'text-[#3a4657]' : 'text-ink-muted'}`}>
                  {hasPublished ? (
                    <>
                      Players can now browse and reach out to alumni.{' '}
                      <Link href="/player" className="font-semibold text-[#990000] hover:underline">
                        Open Clubhouse &rarr;
                      </Link>
                    </>
                  ) : (
                    'Players see verified alumni, names, years, hometowns, and career info when available.'
                  )}
                </p>
              </div>
            </div>
          </SectionShell>

          {hasPublished && (
            <div className="pt-4">
              <Link
                href="/player"
                className="text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-lg transition-colors"
              >
                Open Player Clubhouse &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BuildClient() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-muted">Loading...</div>}>
      <BuildPageInner />
    </Suspense>
  )
}
