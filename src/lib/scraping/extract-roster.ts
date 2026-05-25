import * as cheerio from 'cheerio'
import type { RosterEntryPreview } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASS_LABEL_RE =
  /\b(Freshman|Sophomore|Junior|Senior|Graduate\s+Student|First\s+Year|Second\s+Year|Third\s+Year|Fourth\s+Year|Fr\.|So\.|Jr\.|Sr\.|Fy\.|Redshirt)\b/i

// Sidearm Sports pages include this distinctive button per player.
// It is the most reliable signal for player identification.
const HIDE_SHOW_RE =
  /Hide[\/\-–]Show\s+Additional\s+Information\s+For\s+([A-Z][A-Za-z''\- ]{1,65})/gi

const NOISE_NAMES = new Set([
  'team photo', 'print', 'roster layout', 'choose a season', 'sort by',
  'players', 'coaching staff', 'go to coaching staff', 'full bio',
  'hide/show', 'hide show', 'roster', 'no image', 'placeholder',
])

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNoiseName(s: string): boolean {
  const lower = s.toLowerCase().trim()
  if (lower.length < 3 || lower.length > 65) return true
  if (NOISE_NAMES.has(lower)) return true
  if (/^\d/.test(lower)) return true
  // Reject strings that are purely a height value
  if (/^[4-7]'\s*\d{1,2}"?$/.test(lower.replace(/\s/g, ''))) return true
  if (/^(go to|choose|sort by|print|layout|photo|image|no image)/i.test(lower)) return true
  return false
}

function looksLikeName(s: string): boolean {
  if (!s) return false
  const t = s.trim()
  if (isNoiseName(t)) return false
  if (!/[A-Za-z]{2}/.test(t)) return false
  if (/https?:\/\//.test(t)) return false
  return /^[A-Za-zÀ-ɏ''\-.,\s]{3,65}$/.test(t)
}

/**
 * Parse "Lexington, Ky. Sayre School" → { hometown: "Lexington, Ky.", highSchool: "Sayre School" }
 * The class label should already be stripped before calling this.
 */
function parseHometownSchool(text: string): { hometown?: string; highSchool?: string } {
  const t = text.trim()
  if (!t) return {}

  // Also strip class label if it somehow slipped through
  const withoutClass = t.replace(CLASS_LABEL_RE, '').trim()
  if (!withoutClass) return {}

  if (!withoutClass.includes(',')) {
    // No comma: could be high school only, or nothing useful
    const clean = withoutClass.replace(/^Full\s+Bio.*/i, '').trim()
    return clean ? { highSchool: clean } : {}
  }

  const commaIdx = withoutClass.indexOf(',')
  const city = withoutClass.slice(0, commaIdx).trim()
  const afterComma = withoutClass.slice(commaIdx + 1).trim()

  // First token after comma is the state abbreviation or full state name.
  // Examples: "Ky.", "Calif.", "N.J.", "Texas", "Ga.", "N.Y.", "Conn.", "Mass."
  const tokens = afterComma.split(/\s+/)
  if (tokens.length === 0 || !city) return {}

  const stateToken = tokens[0]
  const hometown = `${city}, ${stateToken}`
  const schoolTokens = tokens.slice(1)
  const highSchool = schoolTokens.length > 0 ? schoolTokens.join(' ').trim() : undefined

  return { hometown, highSchool: highSchool || undefined }
}

// ── Strategy A: Sidearm structured HTML (primary) ────────────────────────────
// For live Sidearm Sports roster pages (Penn Athletics and most D1 schools).
// Targets li.sidearm-roster-player elements with specific class selectors.

function extractViaSidearmHTML($: cheerio.CheerioAPI, sourceUrl: string): RosterEntryPreview[] {
  const entries: RosterEntryPreview[] = []
  const seenNames = new Set<string>()

  // Scope to the players section if present; otherwise fall back to body
  const playerSection = $('section[aria-label*="Player"]')
  const scope = playerSection.length > 0 ? playerSection : $('body')

  // Try the specific Sidearm li.sidearm-roster-player structure first
  const sidearmPlayers = scope.find('li.sidearm-roster-player')

  if (sidearmPlayers.length > 0) {
    sidearmPlayers.each((_i, el) => {
      if (entries.length >= 100) return false
      const container = $(el)

      // Name: prefer .sidearm-roster-player-name a; fall back to aria-label on bio link
      let name = container.find('.sidearm-roster-player-name a').first().text().trim()
      if (!name || isNoiseName(name)) {
        const ariaLabel = container.find('a[aria-label*="View Full Bio"]').first().attr('aria-label')
        if (ariaLabel) {
          name = ariaLabel.replace(/\s*-\s*View Full Bio$/i, '').trim()
        }
      }

      if (!name || !looksLikeName(name)) return
      const nameKey = name.toLowerCase()
      if (seenNames.has(nameKey)) return
      seenNames.add(nameKey)

      // Academic year: prefer desktop span (no hide class), fall back to any span
      // .not('[class*="hide-on"]') excludes the abbreviated mobile span
      const desktopYearEl = container
        .find('.sidearm-roster-player-academic-year')
        .not('[class*="hide-on"]')
        .first()
      const yearEl = desktopYearEl.length > 0
        ? desktopYearEl
        : container.find('.sidearm-roster-player-academic-year').last()
      const classRaw = yearEl.text().trim()
      const classMatch = classRaw.match(CLASS_LABEL_RE)
      const classLabel = classMatch ? classMatch[1] : undefined

      // Hometown
      const hometownRaw = container.find('.sidearm-roster-player-hometown').first().text().trim()
      const hometown = hometownRaw || undefined

      // High school
      const highSchoolRaw = container.find('.sidearm-roster-player-highschool').first().text().trim()
      const highSchool = highSchoolRaw || undefined

      // Bio URL
      const bioHref = container.find('a[aria-label*="View Full Bio"]').first().attr('href')
      let bioUrl: string | undefined
      if (bioHref && !bioHref.startsWith('#')) {
        try { bioUrl = new URL(bioHref, sourceUrl).toString() } catch { /* ignore */ }
      }

      entries.push({
        fullName: name,
        classLabel,
        hometown,
        highSchool,
        bioUrl,
        sourceUrl,
        extractionConfidence: 0.9,
        rawText: container.text().replace(/\s+/g, ' ').trim().slice(0, 300),
      })
    })

    if (entries.length > 0) return entries
  }

  // Generic fallback selectors for other Sidearm-like structures
  const genericSelectors = [
    '.s-person',
    '[class*="roster-player"]:not([class*="header"])',
    '[class*="s-person-card"]',
    'li[class*="player"]',
  ]

  for (const sel of genericSelectors) {
    scope.find(sel).each((_i, el) => {
      if (entries.length >= 100) return false
      const container = $(el)
      const fullText = container.text().replace(/\s+/g, ' ').trim()

      // Prefer link text in a roster bio link
      const nameLink = container.find('a[href*="/roster/"]').first()
      let name = nameLink.text().trim()

      // Fallback: extract from hide/show text
      if (!name || isNoiseName(name)) {
        const hs = fullText.match(
          /Hide[\/\-–]Show\s+Additional\s+Information\s+For\s+([A-Z][A-Za-z''\- ]{1,65})/i,
        )
        if (hs) name = hs[1].trim().replace(/[.,\s]+$/, '').trim()
      }

      if (!name || !looksLikeName(name)) return
      const nameKey = name.toLowerCase()
      if (seenNames.has(nameKey)) return
      seenNames.add(nameKey)

      const classRaw = container.find('[class*="year"], [class*="class"], [class*="academic"]').first().text().trim()
      const classMatch = classRaw.match(CLASS_LABEL_RE) ?? fullText.match(CLASS_LABEL_RE)
      const classLabel = classMatch ? classMatch[1] : undefined

      const hometown = container.find('[class*="hometown"], [class*="city"]').first().text().trim() || undefined
      const highSchool = container.find('[class*="highschool"], [class*="high-school"], [class*="prep"]').first().text().trim() || undefined

      const href = nameLink.attr('href')
      let bioUrl: string | undefined
      if (href && !href.startsWith('#')) {
        try { bioUrl = new URL(href, sourceUrl).toString() } catch { /* ignore */ }
      }

      entries.push({
        fullName: name,
        classLabel,
        hometown,
        highSchool,
        bioUrl,
        sourceUrl,
        extractionConfidence: 0.8,
        rawText: fullText.slice(0, 300),
      })
    })
    if (entries.length > 0) break
  }

  return entries
}

// ── Strategy B: Sidearm "Hide/Show" text extraction ──────────────────────────
// Gold standard for Sidearm Sports roster pages (Penn Athletics, most D1 schools).
// Each player has a "Hide/Show Additional Information For {Name}" button whose text
// definitively identifies the player name. We use these as anchors, then parse the
// surrounding block for class year, hometown, and high school.

function extractViaSidearmText(text: string, sourceUrl: string): RosterEntryPreview[] {
  const entries: RosterEntryPreview[] = []
  const seenNames = new Set<string>()

  const hideShowMatches: Array<{ name: string; index: number; end: number }> = []
  const re = new RegExp(HIDE_SHOW_RE.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    let rawName = m[1].trim()
    // Greedy regex may bleed into the next player's block when pages lack
    // non-alpha delimiters (heights, jersey numbers) between player cards.
    // Truncate at the first class-label word that was swept in.
    const classSpill = rawName.search(/\s+(?:Freshman|Sophomore|Junior|Senior|Graduate\s+Student|First\s+Year|Second\s+Year|Third\s+Year|Fourth\s+Year|Fr\.|So\.|Jr\.|Sr\.|Fy\.|Redshirt)\b/i)
    if (classSpill > 0) rawName = rawName.slice(0, classSpill)
    // Hard cap at 4 tokens — names with more are almost certainly bleed-through
    rawName = rawName.trim().split(/\s+/).slice(0, 4).join(' ').replace(/[.,\s]+$/, '').trim()
    if (rawName && !isNoiseName(rawName)) {
      hideShowMatches.push({ name: rawName, index: m.index, end: m.index + m[0].length })
    }
  }

  if (hideShowMatches.length === 0) return entries

  for (let i = 0; i < hideShowMatches.length; i++) {
    const { name, index, end: _end } = hideShowMatches[i]
    const nameKey = name.toLowerCase()
    if (seenNames.has(nameKey)) continue
    seenNames.add(nameKey)

    // Block = text between end of previous hide/show and start of this one
    const blockStart = i === 0
      ? Math.max(0, index - 600)
      : hideShowMatches[i - 1].end
    const rawBlock = text.slice(blockStart, index)
    const block = rawBlock.replace(/\s+/g, ' ').trim()

    // Class label
    const classMatch = block.match(CLASS_LABEL_RE)
    const classLabel = classMatch ? classMatch[1] : undefined

    let hometown: string | undefined
    let highSchool: string | undefined

    if (classLabel && classMatch) {
      const classIdx = block.search(CLASS_LABEL_RE)
      const afterClass = block.slice(classIdx + classLabel.length).trim()
      // Grab everything up to the first "Full Bio" (or end of block)
      const chunk = afterClass.split(/Full\s+Bio/i)[0].trim().slice(0, 200)
      if (chunk) {
        const parsed = parseHometownSchool(chunk)
        hometown = parsed.hometown
        highSchool = parsed.highSchool
      }
    } else {
      // No class label — try to parse hometown/school from after the name
      const nameIdx = block.lastIndexOf(name)
      if (nameIdx !== -1) {
        const afterName = block.slice(nameIdx + name.length).trim()
        const chunk = afterName.split(/Full\s+Bio/i)[0].trim().slice(0, 200)
        if (chunk && chunk.includes(',')) {
          const parsed = parseHometownSchool(chunk)
          hometown = parsed.hometown
          highSchool = parsed.highSchool
        }
      }
    }

    entries.push({
      fullName: name,
      classLabel,
      hometown,
      highSchool,
      sourceUrl,
      extractionConfidence: 0.85,
      rawText: rawBlock.slice(-300).trim(),
    })

    if (entries.length >= 100) break
  }

  return entries
}

// ── Strategy C: Table rows ───────────────────────────────────────────────────
// For older roster pages with structured HTML tables.

function extractViaTable($: cheerio.CheerioAPI, sourceUrl: string): RosterEntryPreview[] {
  const entries: RosterEntryPreview[] = []
  const seenNames = new Set<string>()

  $('table').each((_i, table) => {
    if (entries.length >= 100) return false

    const headers = $(table)
      .find('th')
      .map((_j, th) => $(th).text().trim().toLowerCase())
      .get()
    const hasNameCol = headers.some(h => /name|player|athlete/.test(h))
    const hasClassCol = headers.some(h => /class|year|eligibility/.test(h))
    if (!hasNameCol && !hasClassCol && headers.length > 0) return

    $(table).find('tr').each((_j, row) => {
      if (entries.length >= 100) return false
      const cells = $(row).find('td').map((_k, td) => $(td).text().trim()).get()
      if (cells.length < 2) return

      const nameCandidate = cells[0]
      if (!looksLikeName(nameCandidate)) return
      const nameKey = nameCandidate.toLowerCase()
      if (seenNames.has(nameKey)) return
      seenNames.add(nameKey)

      const classLabel = cells.find(c => CLASS_LABEL_RE.test(c)) || undefined
      let hometown: string | undefined
      let highSchool: string | undefined

      for (let k = 1; k < cells.length; k++) {
        const c = cells[k]
        if (CLASS_LABEL_RE.test(c)) continue
        if (c.includes(',') && !hometown) { hometown = c; continue }
        if (c && !highSchool && c !== classLabel) { highSchool = c }
      }

      const href = $(row).find('a[href]').first().attr('href')
      let bioUrl: string | undefined
      if (href && !href.startsWith('#')) {
        try { bioUrl = new URL(href, sourceUrl).toString() } catch { /* ignore */ }
      }

      entries.push({
        fullName: nameCandidate,
        classLabel,
        hometown,
        highSchool,
        bioUrl,
        sourceUrl,
        extractionConfidence: 0.75,
        rawText: cells.join(' | '),
      })
    })
  })

  return entries
}

// ── Main export ───────────────────────────────────────────────────────────────

export function extractRoster(
  html: string,
  sourceUrl: string,
): { entries: RosterEntryPreview[]; warnings: string[] } {
  const warnings: string[] = []
  const $ = cheerio.load(html)

  // Remove noise elements before extraction
  $('nav, footer, script, style, noscript, [class*="navigation"], [class*="footer"], [class*="social"], [class*="ad-"]').remove()

  // Remove coaching/staff sections to prevent staff appearing as players
  $('section[aria-label*="Coach"], section[aria-label*="Staff"], section[aria-label*="coach"], section[aria-label*="staff"]').remove()

  // Strategy A: Sidearm structured HTML (primary for Penn Athletics and most D1 schools)
  const htmlEntries = extractViaSidearmHTML($, sourceUrl)
  if (htmlEntries.length > 0) {
    return { entries: htmlEntries, warnings }
  }

  // Strategy B: Sidearm text-based (fallback)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const sidearmEntries = extractViaSidearmText(bodyText, sourceUrl)
  if (sidearmEntries.length > 0) {
    return { entries: sidearmEntries, warnings }
  }

  // Strategy C: Table rows
  const tableEntries = extractViaTable($, sourceUrl)
  if (tableEntries.length > 0) {
    return { entries: tableEntries, warnings }
  }

  warnings.push(
    'No high-confidence roster structure found on this page. Try selecting a discovered roster page in the next phase.',
  )
  return { entries: [], warnings }
}
