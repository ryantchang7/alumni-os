import { NextResponse } from 'next/server'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import { fetchPage } from '@/lib/scraping/fetch-page'
import { extractRoster } from '@/lib/scraping/extract-roster'
import { requireFounder } from '@/lib/auth/guards'

export async function POST(req: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('url' in body) || typeof (body as Record<string, unknown>).url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const url = ((body as Record<string, unknown>).url as string).trim()

  const guard = validateCrawlTarget(url)
  if (!guard.allowed) {
    return NextResponse.json({ error: guard.reason }, { status: 422 })
  }

  const fetched = await fetchPage(url)
  if (fetched.status < 200 || fetched.status >= 400) {
    return NextResponse.json(
      { error: `Page returned HTTP ${fetched.status}`, page: { url, finalUrl: fetched.finalUrl, status: fetched.status } },
      { status: 502 },
    )
  }

  const { entries, warnings } = extractRoster(fetched.html, fetched.finalUrl)

  const highConfidence = entries.filter(e => e.extractionConfidence >= 0.8).length
  const lowConfidence = entries.filter(e => e.extractionConfidence < 0.8).length

  return NextResponse.json({
    page: {
      url,
      finalUrl: fetched.finalUrl,
      title: fetched.title,
      status: fetched.status,
    },
    entries,
    warnings: [...fetched.warnings, ...warnings],
    counts: {
      entries: entries.length,
      highConfidence,
      lowConfidence,
    },
  })
}
