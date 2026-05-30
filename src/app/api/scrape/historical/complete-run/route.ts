import { NextResponse } from 'next/server'
import {
  updateHistoricalImportRun,
  getHistoricalSeasonResultsForRun,
  getExtractedEntriesForTeam,
  promoteRosterEntries,
  readStore,
} from '@/lib/store/local-store'
import { requireCaptain } from '@/lib/auth/guards'

export async function POST(request: Request) {
  const gate = await requireCaptain()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { runId, promoteHighConfidence } = (body ?? {}) as Record<string, unknown>

  if (!runId) {
    return NextResponse.json({ error: 'Missing required field: runId' }, { status: 400 })
  }

  const store = await readStore()
  const run = store.historicalImportRuns.find(r => r.id === String(runId))
  if (!run) {
    return NextResponse.json({ error: `HistoricalImportRun not found: ${runId}` }, { status: 404 })
  }

  const seasonResults = await getHistoricalSeasonResultsForRun(run.id)
  const allDone = seasonResults.every(r => r.status !== 'pending' && r.status !== 'running')
  const anyFailed = seasonResults.some(r => r.status === 'failed')

  let promotionResult: { promotedCount: number; peopleCreated: number } | undefined

  // Only promote if every season has finished — never promote mid-run
  if (promoteHighConfidence === true && allDone) {
    const runScrapeIds = new Set(
      seasonResults.map(r => r.scrapeRunId).filter(Boolean) as string[],
    )
    if (runScrapeIds.size > 0) {
      // Promote only extracted entries from this run's seasons (confidence >= 0.8)
      const allTeamEntries = await getExtractedEntriesForTeam(run.teamId)
      const toPromoteIds = allTeamEntries
        .filter(
          e =>
            e.status === 'extracted' &&
            e.extractionConfidence >= 0.8 &&
            runScrapeIds.has(e.scrapeRunId),
        )
        .map(e => e.id)

      promotionResult = await promoteRosterEntries(run.teamId, toPromoteIds)
    }
  }

  const updated = await updateHistoricalImportRun(run.id, {
    status: allDone && !anyFailed ? 'complete' : anyFailed ? 'failed' : 'running',
    finishedAt: new Date().toISOString(),
    completedSeasons: seasonResults.filter(r => r.status === 'complete' || r.status === 'skipped').length,
    successfulSeasons: seasonResults.filter(r => r.status === 'complete').length,
    failedSeasons: seasonResults.filter(r => r.status === 'failed').length,
    totalEntries: seasonResults.reduce((sum, r) => sum + r.entriesExtracted, 0),
    promotedCount: promotionResult?.promotedCount,
  })

  return NextResponse.json({
    run: updated,
    seasonResults,
    ...(promotionResult !== undefined
      ? { promoted: promotionResult.promotedCount, peopleCreated: promotionResult.peopleCreated }
      : {}),
  })
}
