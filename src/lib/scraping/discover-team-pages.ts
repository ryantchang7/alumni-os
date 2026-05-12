import * as cheerio from 'cheerio'
import type { DiscoveredPagePreview } from './types'
import { normalizeUrl } from './normalize-url'
import { validateCrawlTarget } from './guards'
import { classifyPage } from './classify-page'

const NOISE_PATTERNS = [
  /\btickets?\b/i, /\bshop\b/i, /\bdonate\b/i, /\bfacebook\b/i,
  /\btwitter\b/i, /\binstagram\b/i, /\bprivacy\b/i, /\bterms\b/i,
  /\baccessib/i, /\bopens?\s+in\s+new/i, /\byoutube\b/i, /\btiktok\b/i,
]

function isNoisyLinkText(text: string): boolean {
  return NOISE_PATTERNS.some(p => p.test(text))
}

function getPriority(pageType: string, confidence: number): 'high' | 'medium' | 'low' {
  if (['current_roster', 'historical_roster', 'player_bio'].includes(pageType)) return 'high'
  if (['schedule', 'results', 'stats', 'news', 'media_guide'].includes(pageType)) return 'medium'
  return 'low'
}

export function discoverTeamPages(
  html: string,
  baseUrl: string,
  _teamName?: string,
  _sport?: string,
): DiscoveredPagePreview[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const results: DiscoveredPagePreview[] = []

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    const linkText = $(el).text().trim().slice(0, 120)

    if (isNoisyLinkText(linkText)) return

    const normalized = normalizeUrl(href, baseUrl)
    if (!normalized) return
    if (seen.has(normalized)) return
    seen.add(normalized)

    const validation = validateCrawlTarget(normalized, baseUrl)
    if (!validation.allowed) return

    const classification = classifyPage(normalized, linkText)
    if (classification.pageType === 'unknown' && classification.confidence < 0.3) return

    const priority = getPriority(classification.pageType, classification.confidence)

    results.push({
      url: normalized,
      label: linkText || new URL(normalized).pathname,
      pageType: classification.pageType,
      season: classification.season,
      confidence: classification.confidence,
      priority,
      reason: classification.reason,
    })

    if (results.length >= 200) return false // cheerio each() stops on false
  })

  // Sort: priority first, then confidence desc
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  results.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pd !== 0) return pd
    return b.confidence - a.confidence
  })

  return results.slice(0, 50)
}
