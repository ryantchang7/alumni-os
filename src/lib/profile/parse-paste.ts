/**
 * Turn a pasted line into the three fields a card needs.
 *
 * Six of thirty-six members have filled in anything, and the reason is not
 * reluctance: the profile editor is a thousand lines of form. The quickest
 * honest shortcut is the text an alum has already written about themselves,
 * in their LinkedIn headline or the signature at the bottom of their email.
 * They paste it, we guess, they correct the guess.
 *
 * A real LinkedIn sync is not available: current title and company sit behind
 * LinkedIn's Partner Program, and self-serve sign-in returns only name, photo
 * and email. So this is the closest thing that actually works, and it works
 * with no API, no approval and no account linking.
 *
 * Deliberately conservative. Every guess lands in an editable field the
 * member sees before anything is saved, so a miss costs one keystroke.
 * Guessing nothing is always better than guessing wrong and hoping they look.
 */

export interface ParsedProfile {
  currentRole?: string
  currentCompany?: string
  city?: string
  state?: string
}

/** A segment that is a location and nothing else: "Greater Boston Area". */
const AREA = /^(greater\s+)?(.+?)\s+(bay\s+)?area$/i
/** "San Francisco, CA" or "New York, New York". */
const CITY_STATE = /^([A-Za-z.\-' ]{2,40}),\s*([A-Za-z.]{2,20})$/
/** Marks the segment as schooling rather than a job. */
const SCHOOL = /\b(wharton|penn|university|college|mba|bsc?|ba|class of)\b|'\d{2}/i
/** Contact details. Never a role or a company. */
const CONTACT = /(@|https?:|www\.|\+?\d[\d\s().-]{7,})/

const US_STATES = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi',
  'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey',
  'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina',
  'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'west virginia', 'wisconsin', 'wyoming', 'd.c.', 'dc',
])

function looksLikeState(s: string): boolean {
  const t = s.trim().replace(/\.$/, '')
  if (/^[A-Z]{2}$/.test(t)) return true
  return US_STATES.has(t.toLowerCase())
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim().replace(/[,;|·•]+$/, '').trim()
}

/**
 * Job titles. Used only to tell a title apart from a person's name, since
 * "Portfolio Manager" and "Jane Doe" are the same shape to a regex.
 */
const TITLE_WORDS = /\b(manager|director|analyst|associate|president|partner|founder|co-?founder|ceo|cfo|coo|cto|cio|vp|svp|evp|head|lead|engineer|developer|consultant|advisor|adviser|counsel|attorney|lawyer|physician|doctor|nurse|teacher|professor|coach|owner|principal|trader|banker|broker|agent|specialist|officer|chief|senior|junior|intern|student|designer|architect|accountant|controller|strategist|recruiter|realtor|sales|marketing|operations|investment|portfolio|wealth|retired)\b/i

/** Two or three capitalised words and no job word in sight. */
const NAME_SHAPE = /^[A-Z][a-z'\u2019-]+(\s+(?:[A-Z]\.?|[A-Z][a-z'\u2019.-]+)){1,2}$/

function looksLikePersonName(seg: string): boolean {
  if (TITLE_WORDS.test(seg)) return false
  return NAME_SHAPE.test(seg)
}

export function parsePastedProfile(raw: string): ParsedProfile {
  const out: ParsedProfile = {}
  if (!raw?.trim()) return out

  const segments = raw
    .split(/[\n\r]+|\s[|\u2022\u00b7]\s|\s{3,}/)
    .map(clean)
    .filter(seg => seg.length > 1 && seg.length < 200)

  // Pass one: sort the segments. Locations are taken here, because
  // "Austin, Texas" has the same shape as "Role, Company" and would
  // otherwise put a city in the job fields.
  const jobish: string[] = []
  for (const seg of segments) {
    if (CONTACT.test(seg)) continue

    const cs = seg.match(CITY_STATE)
    if (cs && looksLikeState(cs[2])) {
      out.city ??= clean(cs[1])
      out.state ??= clean(cs[2])
      continue
    }
    const area = seg.match(AREA)
    if (area) {
      out.city ??= clean(area[2])
      continue
    }
    if (SCHOOL.test(seg)) continue
    jobish.push(seg)
  }

  // An email signature leads with the sender's own name. Dropped only when
  // it is first and something else is left to read, so a paste of nothing
  // but "Portfolio Manager" is never thrown away.
  if (jobish.length > 1 && looksLikePersonName(jobish[0])) jobish.shift()
  if (jobish.length === 0) return out

  // Pass two, most explicit shape first. "X at Y" is unambiguous wherever
  // it appears, so it beats position.
  for (const seg of jobish) {
    const at = seg.match(/^(.{2,80}?)\s+(?:at|@|with)\s+(.{2,80})$/i)
    if (at) {
      out.currentRole = clean(at[1])
      out.currentCompany = clean(at[2])
      return out
    }
  }

  // Two segments left means the line was already split for us, as in
  // "Managing Director, Real Estate | Furman Partners". Keep the first whole,
  // commas and all: a comma there separates a title from its division far
  // more often than it separates a title from an employer.
  if (jobish.length >= 2) {
    out.currentRole = jobish[0]
    out.currentCompany = jobish[1]
    return out
  }

  // One segment. Now a single comma is worth reading as "title, employer".
  const only = jobish[0]
  const parts = only.split(',')
  if (parts.length === 2 && !looksLikeState(parts[1])) {
    const [a, b] = parts.map(clean)
    if (a.length > 1 && b.length > 1) {
      out.currentRole = a
      out.currentCompany = b
      return out
    }
  }
  if (only.split(' ').length <= 8) out.currentRole = only

  return out
}
