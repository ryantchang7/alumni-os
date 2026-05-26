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
  // NYC summer dinner (/19th-hole)
  '8951fd85-1d3b-452f-81f5-5da9eedc879f',
  // Alumni Weekend (/19th-hole)
  '254018cd-04e0-4790-9ddb-fe1adf42cef6',
])

export function isExampleGathering(id: string, dataFlag?: boolean): boolean {
  return !!dataFlag || EXAMPLE_GATHERING_IDS.has(id)
}
