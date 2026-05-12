import { NextResponse } from 'next/server'
import { fetchPage } from '@/lib/scraping/fetch-page'
import { classifyPage } from '@/lib/scraping/classify-page'
import { extractRoster } from '@/lib/scraping/extract-roster'
import {
  getHistoricalSeasonResultById,
  updateHistoricalSeasonResult,
  createScrapeRun,
  updateScrapeRun,
  saveCrawledPage,
  saveExtractedRosterEntries,
  addReviewItem,
  readStore,
  writeStore,
} from '@/lib/store/local-store'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { seasonResultId } = (body ?? {}) as Record<string, unknown>

  if (!seasonResultId) {
    return NextResponse.json({ error: 'Missing required field: seasonResultId' }, { status: 400 })
  }

  const seasonResult = await getHistoricalSeasonResultById(String(seasonResultId))
  if (!seasonResult) {
    return NextResponse.json({ error: `SeasonResult not found: ${seasonResultId}` }, { status: 404 })
  }

  // Allow both 'pending' and 'failed' to be (re)processed; skip all others
  if (seasonResult.status !== 'pending' && seasonResult.status !== 'failed') {
    return NextResponse.json({ seasonResult, skipped: true }, { status: 200 })
  }

  const now = new Date().toISOString()

  await updateHistoricalSeasonResult(seasonResult.id, { status: 'running', updatedAt: now })
  await _bumpRunCounters(seasonResult.historicalImportRunId, {}, `Season ${seasonResult.seasonYear} started: ${seasonResult.url}`)

  // Create a ScrapeRun for this season
  const scrapeRun = await createScrapeRun({
    teamId: seasonResult.teamId,
    seedUrl: seasonResult.url,
    status: 'running',
    startedAt: now,
    logs: [],
  })

  let fetched: Awaited<ReturnType<typeof fetchPage>>
  try {
    fetched = await fetchPage(seasonResult.url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateScrapeRun(scrapeRun.id, { status: 'failed', finishedAt: new Date().toISOString(), logs: [msg] })
    const updated = await updateHistoricalSeasonResult(seasonResult.id, {
      status: 'failed',
      errorMessage: `Fetch failed: ${msg}`,
      scrapeRunId: scrapeRun.id,
      updatedAt: new Date().toISOString(),
    })
    await _bumpRunCounters(seasonResult.historicalImportRunId, { failed: 1 })
    return NextResponse.json({ seasonResult: updated, error: msg }, { status: 200 })
  }

  // HTTP 404 on a historical season usually means the season doesn't exist — skip it
  if (fetched.status === 404) {
    await updateScrapeRun(scrapeRun.id, { status: 'complete', finishedAt: new Date().toISOString(), logs: ['HTTP 404 — season not found'] })
    const updated = await updateHistoricalSeasonResult(seasonResult.id, {
      status: 'skipped',
      errorMessage: 'HTTP 404 — season not found on server',
      scrapeRunId: scrapeRun.id,
      updatedAt: new Date().toISOString(),
    })
    await _bumpRunCounters(seasonResult.historicalImportRunId, { completed: 1, successful: 1 })
    return NextResponse.json({ seasonResult: updated, skipped: true }, { status: 200 })
  }

  if (fetched.status >= 400) {
    const msg = `HTTP ${fetched.status}`
    await updateScrapeRun(scrapeRun.id, { status: 'failed', finishedAt: new Date().toISOString(), logs: [msg] })
    const updated = await updateHistoricalSeasonResult(seasonResult.id, {
      status: 'failed',
      errorMessage: msg,
      scrapeRunId: scrapeRun.id,
      updatedAt: new Date().toISOString(),
    })
    await _bumpRunCounters(seasonResult.historicalImportRunId, { failed: 1 })
    return NextResponse.json({ seasonResult: updated, error: msg }, { status: 200 })
  }

  const classification = classifyPage(seasonResult.url, undefined, fetched.title)
  const fetchedAt = new Date().toISOString()

  const page = await saveCrawledPage({
    scrapeRunId: scrapeRun.id,
    teamId: seasonResult.teamId,
    url: seasonResult.url,
    title: fetched.title,
    status: fetched.status,
    pageType: classification.pageType,
    fetchedAt,
    htmlPreview: fetched.html.slice(0, 2000),
    warnings: fetched.warnings,
  })

  const { entries: rawEntries, warnings: extractionWarnings } = extractRoster(fetched.html, fetched.finalUrl)

  const entryInputs = rawEntries.map(e => ({
    scrapeRunId: scrapeRun.id,
    crawledPageId: page.id,
    teamId: seasonResult.teamId,
    fullName: e.fullName,
    classLabel: e.classLabel,
    hometown: e.hometown,
    highSchool: e.highSchool,
    bioUrl: e.bioUrl,
    sourceUrl: e.sourceUrl,
    seasonYear: seasonResult.seasonYear,
    rawText: e.rawText,
    extractionConfidence: e.extractionConfidence,
    status: 'extracted' as const,
    createdAt: new Date().toISOString(),
  }))

  const savedEntries = await saveExtractedRosterEntries(entryInputs)

  // Flag low-confidence entries for review — no promotion happens here
  const lowConfidenceEntries = savedEntries.filter(e => e.extractionConfidence < 0.75)
  for (const entry of lowConfidenceEntries) {
    await addReviewItem({
      teamId: seasonResult.teamId,
      type: 'low_confidence_extraction',
      title: `Low confidence: ${entry.fullName}`,
      description: `${Math.round(entry.extractionConfidence * 100)}% confidence for "${entry.fullName}" in ${seasonResult.seasonYear}`,
      relatedExtractedEntryId: entry.id,
      status: 'open',
      priority: 'normal',
    })
  }

  const allWarnings = [...fetched.warnings, ...extractionWarnings]

  await updateScrapeRun(scrapeRun.id, {
    status: 'complete',
    finishedAt: new Date().toISOString(),
    summary: `Extracted ${savedEntries.length} entries`,
    logs: allWarnings,
  })

  const updated = await updateHistoricalSeasonResult(seasonResult.id, {
    status: 'complete',
    entriesExtracted: savedEntries.length,
    warningCount: allWarnings.length,
    scrapeRunId: scrapeRun.id,
    updatedAt: new Date().toISOString(),
  })

  await _bumpRunCounters(seasonResult.historicalImportRunId, {
    completed: 1,
    successful: 1,
    entries: savedEntries.length,
  })

  return NextResponse.json({
    seasonResult: updated,
    entries: savedEntries.length,
    warnings: allWarnings,
  })
}

async function _bumpRunCounters(
  runId: string,
  counts: { completed?: number; successful?: number; failed?: number; entries?: number },
  log?: string,
) {
  const store = await readStore()
  const run = store.historicalImportRuns.find(r => r.id === runId)
  if (!run) return
  // Transition run from pending → running on first season activity
  if (run.status === 'pending') run.status = 'running'
  if (counts.completed) run.completedSeasons += counts.completed
  if (counts.successful) run.successfulSeasons += counts.successful
  if (counts.failed) run.failedSeasons += counts.failed
  if (counts.entries) run.totalEntries += counts.entries
  if (log) run.logs.push(`[${new Date().toISOString()}] ${log}`)
  await writeStore(store)
}
