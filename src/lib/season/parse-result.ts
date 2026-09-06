/**
 * Turn a Penn Athletics recap into the one line the schedule shows as a
 * final result, e.g. "6th of 13 · 873 (+9)".
 *
 * Everything here is defensive, because the output is written to the site
 * without anyone reading it first. Two failure modes matter more than
 * missing a result:
 *
 *  1. Calling a tournament finished while it is still being played. Penn
 *     publishes mid-event recaps using the same ordinals as final ones
 *     ("Third After Day 1", "Fifth Heading Into Final Day"), so the
 *     headline is screened before anything else is read.
 *  2. Reporting another team's score as Penn's. A recap names several
 *     teams' totals in consecutive sentences, so a score only counts when
 *     Penn is the nearest team named before it.
 *
 * When any part is uncertain the parser drops that part rather than
 * guessing: a placing with no score is still correct and useful, and no
 * result at all is better than a wrong one.
 */

const ORDINAL_WORDS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
  fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20,
}

/** Headlines that describe a tournament still in progress. */
const INTERIM_HEADLINE =
  /(heading into|after day|after round|midway|through \d+ rounds?|readies|previews?|begins|opens|set to|to compete|first round|second round|third round)/i

/** Headlines that describe a completed tournament. */
const FINAL_HEADLINE = /\b(finish(?:es|ed)?|wins|win|captures|claims|takes)\b/i

/** Other programs that turn up in Penn recaps, used to tell whose score is whose. */
const RIVALS =
  /\b(Harvard|Yale|Princeton|Columbia|Cornell|Brown|Dartmouth|Seton Hall|Colgate|Holy Cross|Saint Joseph'?s|St\.? Joseph'?s|Villanova|Temple|Drexel|Navy|Army|Lafayette|Lehigh|Bucknell|Tigers|Crimson|Bulldogs|Pirates|Lions|Bears|Big Green|Raiders|Hawks)\b/i

export interface ParsedResult {
  /** The line to store on the stop, e.g. "T-3rd of 12 · 873 (+9)". */
  resultText: string
  place: number
  field: number | null
  score: string | null
  tied: boolean
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

/** Strip tags and decode the handful of entities Sidearm actually emits. */
export function articleText(html: string): string {
  const withoutCode = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
  // Match the closing quote to the one that opened the attribute. The old
  // pattern stopped at the first quote OR apostrophe, so a description
  // containing a bare "men's" was truncated before the placing sentence.
  // Penn currently encodes it as &#39;, but that is theirs to change.
  const og = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=(["'])([\s\S]*?)\1/i,
  )
  const body = withoutCode
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
  // og:description first: it is the editor's own summary and states the
  // placing in a single clean sentence.
  return `${og ? og[2] : ''} ${body}`.trim()
}

/** True only for a headline about a tournament that has finished. */
export function isFinalResultHeadline(title: string): boolean {
  if (!title) return false
  if (INTERIM_HEADLINE.test(title)) return false
  return FINAL_HEADLINE.test(title)
}

/**
 * Penn's team total. Only three-digit totals count, which rules out
 * individual rounds ("a 4-under-par 68") and individual 54-hole scores are
 * excluded by requiring Penn to be the nearest team named beforehand.
 */
export function pennTeamScore(text: string): string | null {
  const re = /(\d+)-(over|under)-par\s+(\d{3})\b|\beven-par\s+(\d{3})\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const lead = text.slice(Math.max(0, m.index - 90), m.index)
    const lower = lead.toLowerCase()
    const pennAt = Math.max(lower.lastIndexOf('penn'), lower.lastIndexOf('quaker'))
    if (pennAt === -1) continue
    // A rival named between Penn and the number means the number is theirs.
    if (RIVALS.test(lead.slice(pennAt))) continue
    if (m[3]) return `${m[3]} (${m[2].toLowerCase() === 'over' ? '+' : '-'}${m[1]})`
    if (m[4]) return `${m[4]} (E)`
  }
  return null
}

/**
 * Parse a recap into a result line, or null when it is not a finished
 * tournament or the placing cannot be read.
 */
export function parseResult(title: string, html: string): ParsedResult | null {
  if (!isFinalResultHeadline(title)) return null

  const text = articleText(html)
  const m = text.match(
    /\bfinish(?:ed|es)?\s+(tied\s+for\s+)?([A-Za-z0-9]+)(?:\s+(?:out\s+)?of\s+(\d+)\s+teams?)?/i,
  )

  let place: number | null = null
  let field: number | null = null
  let tied = false

  if (m) {
    tied = Boolean(m[1])
    const word = m[2].toLowerCase()
    const numeric = /^(\d+)(st|nd|rd|th)?$/.exec(word)
    place = ORDINAL_WORDS[word] ?? (numeric ? Number.parseInt(numeric[1], 10) : null)
    if (place && m[3]) field = Number.parseInt(m[3], 10)
  }

  // "Wins"/"captures" is a first-place headline even when the body never
  // says "finished first".
  if (!place && /\b(wins|win|captures|claims)\b/i.test(title)) place = 1

  if (!place || place < 1 || place > 100) return null
  if (field !== null && (field < place || field > 200)) field = null

  const score = pennTeamScore(text)
  const placing = `${tied ? 'T-' : ''}${ordinalSuffix(place)}${field ? ` of ${field}` : ''}`

  return {
    resultText: score ? `${placing} · ${score}` : placing,
    place,
    field,
    score,
    tied,
  }
}
