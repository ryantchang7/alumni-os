/**
 * Hardcoded IDs of the demo gatherings that ship with the app. These are
 * the Merion alumni round + 5 sample 19th-hole gatherings — they exist so
 * the rooms aren't empty on day one. We mark them with isExample so the
 * UI can render an "Example" badge and members understand they're seeds,
 * not real RSVPs.
 *
 * Source of truth for the data itself is `data/alumni-os.json`. This Set
 * is the live override applied in the API GET route so the live KV
 * doesn't need a migration to backfill the flag.
 */

export const EXAMPLE_GATHERING_IDS = new Set<string>([
  // Merion round (/the-course)
  '97b7f0a8-20fb-4fe1-936d-628f61996826',
  // NYC drinks (/19th-hole)
  'e3d7f849-8435-4e25-ac5f-763da4b4a00b',
  // Philly coffee (/19th-hole)
  '9945ab95-163d-439a-a681-5ccb8b8b9271',
  // Career Night (/19th-hole)
  '6bb361bd-0f0d-4f39-a8ef-2b8133cbe57c',
  // Alumni Weekend (/19th-hole)
  '254018cd-04e0-4790-9ddb-fe1adf42cef6',
])

/** Seeded ids we want hidden from the live UI (e.g. Summer Clubhouse —
 * intentionally retired to declutter). The API filters these out before
 * returning so the existing KV data doesn't need a manual delete. */
export const HIDDEN_GATHERING_IDS = new Set<string>([
  '8951fd85-1d3b-452f-81f5-5da9eedc879f', // Summer Clubhouse — NYC dinner
])

export function isExampleGathering(id: string, dataFlag?: boolean): boolean {
  return !!dataFlag || EXAMPLE_GATHERING_IDS.has(id)
}

export function isHiddenGathering(id: string): boolean {
  return HIDDEN_GATHERING_IDS.has(id)
}

/** Seeded EXAMPLE gatherings age out once their date passes — a sample from
 * last month labeled "Upcoming" reads like a dead site. Real gatherings are
 * never auto-hidden. Unparseable dateText = keep. */
export function isExpiredExampleGathering(g: { isExample?: boolean; dateText: string }): boolean {
  if (!g.isExample) return false
  const t = Date.parse(g.dateText)
  return !Number.isNaN(t) && t < Date.now() - 24 * 60 * 60 * 1000
}

/**
 * Chronological order for anything with a human `dateText`. Unparseable dates
 * ("Championship Weekend") sort last.
 *
 * Lives here because /api/gatherings and /the-course build their lists from
 * different sources — the API sorted, the page didn't, so the soonest round
 * was not the first one shown.
 */
export function byGatheringDate(
  a: { dateText: string },
  b: { dateText: string },
): number {
  const key = (d: string) => {
    const t = Date.parse(d)
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
  }
  return key(a.dateText) - key(b.dateText)
}
