/**
 * Best-effort link preview: fetch a URL server-side and pull its Open Graph
 * image / title / description (with Twitter-card + <title> fallbacks). Used to
 * make Season Tracker links visual.
 *
 * Decoupled from the crawler's domain allowlist so any founder-pasted link
 * works. Only the founder creates season updates, so SSRF risk is low — but we
 * still keep basic guards (http/https only, skip localhost/private hosts),
 * a short timeout, and a size cap. Never throws: returns {} on any failure.
 */

import 'server-only'
import * as cheerio from 'cheerio'

export interface LinkPreview {
  imageUrl?: string
  title?: string
  description?: string
}

const TIMEOUT_MS = 8_000
const MAX_BYTES = 1_500_000
const USER_AGENT = 'PennGolfClubhouse/1.0 (+link preview)'

/** Block obvious internal targets — localhost, .local, and private IP ranges. */
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h === '0.0.0.0') return true
  if (h === '127.0.0.1' || h.startsWith('127.')) return true
  if (h.startsWith('10.') || h.startsWith('192.168.') || h.startsWith('169.254.')) return true
  // 172.16.0.0 – 172.31.255.255
  const m = h.match(/^172\.(\d{1,3})\./)
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true
  return false
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return {}
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return {}
  if (isBlockedHost(url.hostname)) return {}

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return {}
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html')) return {}

    // Read with a size cap so a giant page can't blow up memory.
    const reader = res.body?.getReader()
    if (!reader) return {}
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.length
        if (total > MAX_BYTES) {
          await reader.cancel()
          break
        }
      }
    }
    const html = Buffer.concat(chunks).toString('utf-8')
    const $ = cheerio.load(html)

    const meta = (names: string[]): string | undefined => {
      for (const n of names) {
        const v =
          $(`meta[property="${n}"]`).attr('content') ??
          $(`meta[name="${n}"]`).attr('content')
        if (v && v.trim()) return v.trim()
      }
      return undefined
    }

    const rawImage = meta(['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'])
    const title = meta(['og:title', 'twitter:title']) ?? $('title').first().text().trim() || undefined
    const description = meta(['og:description', 'twitter:description', 'description'])

    // Resolve a relative og:image against the final page URL.
    let imageUrl: string | undefined
    if (rawImage) {
      try {
        imageUrl = new URL(rawImage, res.url || url.toString()).toString()
      } catch {
        imageUrl = undefined
      }
    }

    return { imageUrl, title, description }
  } catch {
    return {}
  } finally {
    clearTimeout(timeout)
  }
}
