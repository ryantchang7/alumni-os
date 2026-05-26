import type { PageType } from './types'

interface ClassifyResult {
  pageType: PageType
  confidence: number
  reason: string
  season?: string
}

const SEASON_PATTERNS = [
  /\b(20\d{2})[-–](2\d)\b/,
  /\b(20\d{2})[-–](20\d{2})\b/,
  /\b(20\d{2})\b/,
]

function extractSeason(text: string): string | undefined {
  for (const p of SEASON_PATTERNS) {
    const m = text.match(p)
    if (m) return m[0]
  }
  return undefined
}

export function classifyPage(
  url: string,
  linkText?: string,
  pageTitle?: string,
): ClassifyResult {
  const combined = [url, linkText ?? '', pageTitle ?? ''].join(' ').toLowerCase()
  const urlLower = url.toLowerCase()

  // Media guide / PDF
  if (combined.includes('media-guide') || combined.includes('media guide') || urlLower.endsWith('.pdf')) {
    return { pageType: 'media_guide', confidence: 0.8, reason: 'URL or text references media guide or PDF' }
  }

  // Staff / coaches
  if (/\b(staff|coaches?|coaching)\b/.test(combined)) {
    return { pageType: 'staff', confidence: 0.85, reason: 'URL or text references staff or coaches' }
  }

  // Recruits
  if (/\b(recruit|recruiting|recruits)\b/.test(combined)) {
    return { pageType: 'recruits', confidence: 0.8, reason: 'URL or text references recruiting' }
  }

  // News / article
  if (/\b(news|article|recap|story|stories|release|press)\b/.test(combined)) {
    return { pageType: 'news', confidence: 0.8, reason: 'URL or text references news or articles' }
  }

  // Stats
  if (/\b(stats?|statistics|standings?)\b/.test(combined)) {
    return { pageType: 'stats', confidence: 0.85, reason: 'URL or text references stats or statistics' }
  }

  // Schedule
  if (/\b(schedule|calendar|upcoming)\b/.test(combined)) {
    return { pageType: 'schedule', confidence: 0.9, reason: 'URL or text references schedule or calendar' }
  }

  // Results
  if (/\b(results?|scores?|recap|tournament|finish)\b/.test(combined)) {
    return { pageType: 'results', confidence: 0.85, reason: 'URL or text references results or scores' }
  }

  // Player bio
  if (/\b(bio|bios?|player|players?|athlete|athletes?)\b/.test(combined)) {
    return { pageType: 'player_bio', confidence: 0.8, reason: 'URL or text references player bios' }
  }

  // Roster — check for season to distinguish historical vs current
  if (/\b(roster|team|members?|players?)\b/.test(combined)) {
    const season = extractSeason(combined)
    // If a past season is mentioned it's historical
    const currentYear = new Date().getFullYear()
    if (season) {
      const yearMatch = season.match(/\b(20\d{2})\b/)
      const year = yearMatch ? parseInt(yearMatch[1]) : currentYear
      if (year < currentYear - 1) {
        return { pageType: 'historical_roster', confidence: 0.9, reason: `Roster reference with past season ${season}`, season }
      }
      return { pageType: 'current_roster', confidence: 0.9, reason: `Roster reference with season ${season}`, season }
    }
    return { pageType: 'current_roster', confidence: 0.75, reason: 'URL or text references roster without explicit season' }
  }

  // History / archive — historical roster
  if (/\b(history|historical|archive|all[-\s]time|past|former|alumni)\b/.test(combined)) {
    return { pageType: 'historical_roster', confidence: 0.7, reason: 'URL or text references historical data or alumni' }
  }

  return { pageType: 'unknown', confidence: 0.2, reason: 'No strong classification signal found' }
}
