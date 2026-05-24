/**
 * Fetcher for Penn Athletics men's golf news. Primary source is the
 * Sidearm Sports RSS feed at:
 *   https://pennathletics.com/rss.aspx?path=mgolf
 *
 * The feed exposes title, link, pubDate, description (with embedded image),
 * and media:thumbnail / media:content / enclosure for the image URL.
 *
 * No XML parser dep — Sidearm's feed is well-formed and tag-name based so
 * we extract with focused regex per field. If the feed ever breaks shape,
 * we return [] rather than throwing so the cron run still 200s.
 */

const FEED_URL = 'https://pennathletics.com/rss.aspx?path=mgolf'

export interface FetchedNewsItem {
  sourceUrl: string
  title: string
  summary?: string
  imageUrl?: string
  publishedAt?: string
}

export async function fetchPennGolfNews(): Promise<FetchedNewsItem[]> {
  let xml: string
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'PennGolfClubhouse/1.0 (+alumni-os)' },
      // Sidearm doesn't set strong cache headers; let Next/runtime handle.
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn(`[penn-golf-feed] HTTP ${res.status} from ${FEED_URL}`)
      return []
    }
    xml = await res.text()
  } catch (e) {
    console.warn('[penn-golf-feed] fetch failed:', e)
    return []
  }

  return parseRss(xml)
}

function parseRss(xml: string): FetchedNewsItem[] {
  const items: FetchedNewsItem[] = []
  // Match each <item>...</item> block.
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const title = pickTag(block, 'title')
    const link = pickTag(block, 'link')
    if (!title || !link) continue
    const pubDate = pickTag(block, 'pubDate')
    const description = pickTag(block, 'description')
    const image =
      pickAttr(block, 'media:thumbnail', 'url') ??
      pickAttr(block, 'media:content', 'url') ??
      pickAttr(block, 'enclosure', 'url') ??
      pickImgFromHtml(description) ??
      undefined
    const summary = description ? stripHtml(description).slice(0, 280) : undefined
    items.push({
      sourceUrl: decodeEntities(link.trim()),
      title: decodeEntities(title.trim()),
      summary: summary ? decodeEntities(summary) : undefined,
      // Critical: HTML-decode the image URL. XML attributes encode `&` as
      // `&amp;`, and a raw `&amp;` in the URL turns ASP querystring params
      // into garbage (pennathletics' image_handler.aspx then returns nothing).
      imageUrl: image ? decodeEntities(image) : undefined,
      publishedAt: pubDate ? safeIsoFromRfc822(pubDate) : undefined,
    })
  }
  return items
}

function pickTag(block: string, tag: string): string | undefined {
  // Handles <tag>...</tag> and <tag><![CDATA[...]]></tag>.
  const re = new RegExp(`<${escapeRe(tag)}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escapeRe(tag)}>`)
  const m = re.exec(block)
  return m ? m[1] : undefined
}

function pickAttr(block: string, tag: string, attr: string): string | undefined {
  // <tag attr="value" ... />  or  <tag attr="value">...</tag>
  const re = new RegExp(`<${escapeRe(tag)}\\b[^>]*\\b${escapeRe(attr)}="([^"]*)"`, 'i')
  const m = re.exec(block)
  return m ? m[1] : undefined
}

function pickImgFromHtml(html: string | undefined): string | undefined {
  if (!html) return undefined
  const m = /<img[^>]+src="([^"]+)"/i.exec(html)
  return m ? m[1] : undefined
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function safeIsoFromRfc822(s: string): string | undefined {
  const ms = Date.parse(s.trim())
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
