import { NextResponse } from 'next/server'
import { generateSeasonPlan, currentSeasonStartYear, formatSeason, buildRosterSeasonUrl } from '@/lib/scraping/seasons'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import {
  getTeamBySlug,
  createHistoricalImportRun,
  saveHistoricalSeasonResult,
} from '@/lib/store/local-store'

export async function POST(request: Request) {
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
  const seasonResults = await Promise.all(
    seasons.map(seasonYear =>
      saveHistoricalSeasonResult({
        historicalImportRunId: run.id,
        teamId: team.id,
        seasonYear,
        url: buildRosterSeasonUrl(String(baseRosterUrl), seasonYear, currentSeason),
        status: 'pending',
        entriesExtracted: 0,
        warningCount: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ),
  )

  return NextResponse.json({
    run,
    seasonResults,
    seasons,
  })
}
