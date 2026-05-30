import { NextResponse } from 'next/server'
import {
  generateSeasonPlan,
  currentSeasonStartYear,
  formatSeason,
  parseSeasonUrlsFromHtml,
  buildSeasonUrlCandidates,
} from '@/lib/scraping/seasons'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import { fetchPage } from '@/lib/scraping/fetch-page'
import {
  getTeamBySlug,
  createHistoricalImportRun,
  saveHistoricalSeasonResult,
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

  const { teamSlug, baseRosterUrl, earliestStartYear } = (body ?? {}) as Record<string, unknown>

  if (!teamSlug || !baseRosterUrl || earliestStartYear === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: teamSlug, baseRosterUrl, earliestStartYear' },
      { status: 400 },
    )
  }

  const team = await getTeamBySlug(String(teamSlug))
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const guardResult = validateCrawlTarget(String(baseRosterUrl))
  if (!guardResult.allowed) {
    return NextResponse.json({ error: guardResult.reason }, { status: 400 })
  }

  const earliestYear = Number(earliestStartYear)
  if (!Number.isInteger(earliestYear) || earliestYear < 1950 || earliestYear > 2100) {
    return NextResponse.json({ error: 'earliestStartYear must be a valid year (1950–2100)' }, { status: 400 })
  }

  const currentStart = currentSeasonStartYear()
  const currentSeason = formatSeason(currentStart)
  const earliestSeason = formatSeason(earliestYear)
  const seasons = generateSeasonPlan(earliestYear, currentStart)
  const now = new Date().toISOString()

  // Try to parse actual season URLs from the base page (non-fatal if fetch fails)
  let parsedSeasonUrls = new Map<string, string>()
  try {
    const baseFetch = await fetchPage(String(baseRosterUrl))
    if (baseFetch.status < 400) {
      parsedSeasonUrls = parseSeasonUrlsFromHtml(baseFetch.html, baseFetch.finalUrl || String(baseRosterUrl))
    }
  } catch {
    // proceed with candidate-based URLs
  }

  const run = await createHistoricalImportRun({
    teamId: team.id,
    baseRosterUrl: String(baseRosterUrl),
    status: 'pending',
    currentSeason,
    earliestSeason,
    startedAt: now,
    totalSeasons: seasons.length,
    completedSeasons: 0,
    successfulSeasons: 0,
    failedSeasons: 0,
    totalEntries: 0,
    logs: [],
  })

  // Pre-create a HistoricalSeasonResult for each season (status: 'pending')
  // Use the parsed URL from the base page if available, else the first candidate pattern
  const seasonResults = await Promise.all(
    seasons.map(seasonYear => {
      const parsedUrl = parsedSeasonUrls.get(seasonYear)
      const candidates = buildSeasonUrlCandidates(String(baseRosterUrl), seasonYear, parsedUrl)
      const url = parsedUrl ?? (seasonYear === currentSeason ? String(baseRosterUrl) : candidates[0])
      return saveHistoricalSeasonResult({
        historicalImportRunId: run.id,
        teamId: team.id,
        seasonYear,
        url,
        status: 'pending',
        entriesExtracted: 0,
        warningCount: 0,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  return NextResponse.json({
    run,
    seasonResults,
    seasons,
  })
}
