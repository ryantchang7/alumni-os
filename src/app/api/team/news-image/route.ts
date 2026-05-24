/**
 * Image proxy for team news thumbnails. Sidearm Sports' CDN blocks
 * hot-linked images when the browser sends a referrer, so we fetch the
 * image server-side (no referrer) and stream the bytes back through our
 * own origin. Cached aggressively at the edge.
 *
 * Hostname whitelist to prevent SSRF — only proxies image hosts we
 * actually use for team news.
 */

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOST_SUFFIXES = [
  'pennathletics.com',
  'sidearmdev.com',
  'sidearmsports.com',
  'cloudfront.net', // Sidearm sometimes serves via CloudFront
]

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some(s => h === s || h.endsWith('.' + s))
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return NextResponse.json({ error: 'Bad protocol' }, { status: 400 })
  }
  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let upstream: Response
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'PennGolfClubhouse/1.0 (+alumni-os)',
        Accept: 'image/*',
      },
      signal: controller.signal,
      // No referrer header sent — that's the whole point.
      redirect: 'follow',
    })
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }
  clearTimeout(timeout)

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream ${upstream.status}` },
      { status: 502 },
    )
  }

  const ct = upstream.headers.get('content-type') ?? 'image/jpeg'
  const ctBase = ct.split(';')[0].trim().toLowerCase()
  if (!ALLOWED_CONTENT_TYPES.includes(ctBase)) {
    return NextResponse.json({ error: 'Bad content-type' }, { status: 415 })
  }

  // Stream the body back. 1-day shared cache + stale-while-revalidate so
  // we only proxy each image once per day per region.
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': ctBase,
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
