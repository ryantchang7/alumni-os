import { NextRequest, NextResponse } from 'next/server'
import type { DiscoveryPreviewInput, DiscoveryPreviewResponse } from '@/lib/scraping/types'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import { fetchPage } from '@/lib/scraping/fetch-page'
import { discoverTeamPages } from '@/lib/scraping/discover-team-pages'
import { extractRoster } from '@/lib/scraping/extract-roster'

const TRUST_NOTES = [
  'Preview only: no data is saved.',
  'Public pages only.',
  'No login-gated or LinkedIn scraping.',
  'Human review is required before publishing identities.',
  'Contact paths, not scraped emails.',
  'Production crawling must check and respect robots.txt.',
]

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const input = body as Partial<DiscoveryPreviewInput>

  if (!input.teamName || typeof input.teamName !== 'string' || !input.teamName.trim()) {
    return NextResponse.json({ error: 'teamName is required' }, { status: 400 })
  }
  if (!input.website || typeof input.website !== 'string' || !input.website.trim()) {
    return NextResponse.json({ error: 'website is required' }, { status: 400 })
  }

  const validation = validateCrawlTarget(input.website.trim())
  if (!validation.allowed) {
    return NextResponse.json(
      { error: 'Website URL is not allowed', details: validation.reason },
      { status: 400 },
    )
  }

  const allWarnings: string[] = []

  let fetched: Awaited<ReturnType<typeof fetchPage>>
  try {
    fetched = await fetchPage(input.website.trim())
    allWarnings.push(...fetched.warnings)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Failed to fetch website', details: message },
      { status: 500 },
    )
  }

  const discoveredPages = discoverTeamPages(
    fetched.html,
    fetched.finalUrl,
    input.teamName,
    input.sport,
  )

  const { entries: rosterEntries, warnings: rosterWarnings } = extractRoster(
    fetched.html,
    fetched.finalUrl,
  )
  allWarnings.push(...rosterWarnings)

  const response: DiscoveryPreviewResponse = {
    team: {
      teamName: input.teamName.trim(),
      schoolName: input.schoolName?.trim(),
      sport: input.sport?.trim(),
      gender: input.gender?.trim(),
      website: input.website.trim(),
    },
    rootPage: {
      url: fetched.url,
      finalUrl: fetched.finalUrl,
      title: fetched.title,
      status: fetched.status,
      contentType: fetched.contentType,
    },
    discoveredPages,
    rosterEntriesFromRootIfAny: rosterEntries,
    warnings: allWarnings,
    trustNotes: TRUST_NOTES,
  }

  return NextResponse.json(response)
}
