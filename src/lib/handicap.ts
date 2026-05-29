/**
 * Handicap bucketing. The PersonEnrichment.handicap field is a free
 * string so it can hold both numeric indexes ("12.4") and the preset
 * categories Scratch / Beginner. The /the-course "Players around your
 * level" section uses these buckets to find people of similar skill.
 *
 * Buckets:
 *   scratch  — string "scratch" OR numeric ≤ 0.0
 *   low      — numeric in (0.0, 9.9]
 *   mid      — numeric in (9.9, 19.9]
 *   high     — numeric ≥ 20.0
 *   learning — string "beginner" / "beginner / learning"
 */

export type HandicapBucket = 'scratch' | 'low' | 'mid' | 'high' | 'learning'

export const BUCKET_LABELS: Record<HandicapBucket, string> = {
  scratch: 'Scratch (≤ 0)',
  low: 'Low handicaps (1–9)',
  mid: 'Mid handicaps (10–19)',
  high: 'High handicaps (20+)',
  learning: 'Beginner / Learning',
}

export const BUCKET_SHORT: Record<HandicapBucket, string> = {
  scratch: 'Scratch',
  low: 'Low (1–9)',
  mid: 'Mid (10–19)',
  high: 'High (20+)',
  learning: 'Learning',
}

/**
 * Map a raw handicap string to a bucket. Returns null when the value
 * is empty or unparseable.
 */
export function bucketHandicap(raw: string | undefined | null): HandicapBucket | null {
  if (!raw) return null
  const cleaned = raw.trim().toLowerCase()
  if (!cleaned) return null

  // String presets
  if (cleaned === 'scratch') return 'scratch'
  if (cleaned === 'beginner' || cleaned.startsWith('beginner')) return 'learning'

  // Numeric — accept things like "+2", "12.4", "5.6", "20"
  const stripped = cleaned.replace(/^\+/, '')
  const n = Number.parseFloat(stripped)
  if (!Number.isFinite(n)) return null
  if (n <= 0) return 'scratch'
  if (n <= 9.9) return 'low'
  if (n <= 19.9) return 'mid'
  return 'high'
}
