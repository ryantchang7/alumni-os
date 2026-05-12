import type { FetchedPage } from './types'
import { validateCrawlTarget } from './guards'

const USER_AGENT = 'AlumniOSPreviewBot/0.1 (+public discovery preview; no persistence)'
const TIMEOUT_MS = 10_000

// TODO: Production crawling must check and respect robots.txt before fetching any page.

export async function fetchPage(url: string): Promise<FetchedPage> {
  const warnings: string[] = [
    'Robots.txt checking is not implemented in this prototype. Production crawling must check and respect robots.txt.',
  ]

  const validation = validateCrawlTarget(url)
  if (!validation.allowed) {
    throw new Error(`Cannot fetch: ${validation.reason}`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })
  } catch (err) {
    clearTimeout(timeout)
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Fetch failed for ${url}: ${message}`)
  } finally {
    clearTimeout(timeout)
  }

  const finalUrl = response.url || url
  const contentType = response.headers.get('content-type')

  if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
    warnings.push(`Non-HTML content type: ${contentType}`)
  }

  let html = ''
  try {
    html = await response.text()
  } catch {
    warnings.push('Could not read response body')
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : undefined

  // Extract text (rough, no cheerio dependency here)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50_000)

  return {
    url,
    finalUrl,
    status: response.status,
    title,
    html,
    text,
    contentType,
    warnings,
  }
}
