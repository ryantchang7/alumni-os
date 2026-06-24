import { NextResponse } from 'next/server'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import { fetchPage } from '@/lib/scraping/fetch-page'
import { classifyPage } from '@/lib/scraping/classify-page'
import { extractRoster } from '@/lib/scraping/extract-roster'
import { inferSeasonFromTitle, formatSeason, currentSeasonStartYear } from '@/lib/scraping/seasons'
import {
  getTeamBySlug,
  createScrapeRun,
  updateScrapeRun,
  saveCrawledPage,
  saveExtractedRosterEntries,
  addReviewItem,
} from '@/lib/store/local-store'
import { requireFounder } from '@/lib/auth/guards'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { teamSlug, url, seasonYear } = (body ?? {}) as Record<string, unknown>

  if (!teamSlug || !url) {
    return NextResponse.json(
      { error: 'Missing required fields: teamSlug, url' },
      { status: 400 },
    )
  }

  const team = await getTeamBySlug(String(teamSlug))
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const validation = validateCrawlTarget(String(url))
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 422 })
  }

  const now = new Date().toISOString()

  const run = await createScrapeRun({
    teamId: team.id,
    seedUrl: String(url),
    status: 'running',
    startedAt: now,
    logs: [],
  })

  let fetched: Awaited<ReturnType<typeof fetchPage>>
  try {
    fetched = await fetchPage(String(url))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateScrapeRun(run.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      logs: [msg],
    })
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 })
  }

  if (fetched.status >= 400) {
    await updateScrapeRun(run.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      logs: [`HTTP ${fetched.status}`],
    })
    return NextResponse.json({ error: `HTTP ${fetched.status} from target URL` }, { status: 502 })
  }

  const classification = classifyPage(String(url), undefined, fetched.title)
  const fetchedAt = new Date().toISOString()

  const page = await saveCrawledPage({
    scrapeRunId: run.id,
    teamId: team.id,
    url: String(url),
    title: fetched.title,
    status: fetched.status,
    pageType: classification.pageType,
    fetchedAt,
    htmlPreview: fetched.html.slice(0, 2000),
    warnings: fetched.warnings,
  })

  const { entries: rawEntries, warnings: extractionWarnings } = extractRoster(
    fetched.html,
    fetched.finalUrl,
  )

  if (rawEntries.length === 0) {
    await addReviewItem({
      teamId: team.id,
      type: 'missing_required_field',
      title: 'No roster entries extracted',
      description: `No entries found at ${url}`,
      status: 'open',
      priority: 'high',
    })
  }

  const resolvedSeasonYear: string =
    seasonYear
      ? String(seasonYear)
      : (inferSeasonFromTitle(fetched.title) ?? formatSeason(currentSeasonStartYear()))

  const entryInputs = rawEntries.map(e => ({
    scrapeRunId: run.id,
    crawledPageId: page.id,
    teamId: team.id,
    fullName: e.fullName,
    classLabel: e.classLabel,
    hometown: e.hometown,
    highSchool: e.highSchool,
    bioUrl: e.bioUrl,
    sourceUrl: e.sourceUrl,
    seasonYear: resolvedSeasonYear,
    rawText: e.rawText,
    extractionConfidence: e.extractionConfidence,
    status: 'extracted' as const,
    createdAt: new Date().toISOString(),
  }))

  const savedEntries = await saveExtractedRosterEntries(entryInputs)

  // Create review items for low-confidence entries
  const lowConfidenceEntries = savedEntries.filter(e => e.extractionConfidence < 0.75)
  for (const entry of lowConfidenceEntries) {
    await addReviewItem({
      teamId: team.id,
      type: 'low_confidence_extraction',
      title: `Low confidence: ${entry.fullName}`,
      description: `Extraction confidence ${Math.round(entry.extractionConfidence * 100)}% for "${entry.fullName}" at ${url}`,
      relatedExtractedEntryId: entry.id,
      status: 'open',
      priority: 'normal',
    })
  }

  const allWarnings = [...fetched.warnings, ...extractionWarnings]
  const highConfidence = savedEntries.filter(e => e.extractionConfidence >= 0.75).length
  const lowConfidence = savedEntries.length - highConfidence

  await updateScrapeRun(run.id, {
    status: 'complete',
    finishedAt: new Date().toISOString(),
    summary: `Extracted ${savedEntries.length} entries`,
    logs: allWarnings,
  })

  return NextResponse.json({
    scrapeRun: { ...run, status: 'complete' },
    crawledPage: page,
    entries: savedEntries,
    warnings: allWarnings,
    counts: {
      entries: savedEntries.length,
      highConfidence,
      lowConfidence,
    },
  })
}
