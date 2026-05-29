/**
 * Single source of truth for the industry list. Used by:
 *   - the profile editor (multi-select chips on /alumni/profile/[id])
 *   - the Career Room "Explore by Industry" tiles
 *   - the Member Book ?industry= filter
 *
 * Order matters — this is the order chips appear in the editor and the
 * order tiles render in the Career Room. Keep it stable; reordering
 * doesn't break stored data (the value is the label string itself).
 */

export const INDUSTRY_OPTIONS = [
  'Finance',
  'Tech',
  'Real Estate',
  'Law',
  'Consulting',
  'Healthcare / Biotech',
  'Energy',
  'Consumer / Retail',
  'Media / Entertainment',
  'Sports',
  'Government / Policy',
  'Education / Academia',
  'Nonprofit',
  'Entrepreneurship',
  'Student',
  'Other',
] as const

export type Industry = (typeof INDUSTRY_OPTIONS)[number]

/**
 * Split a member's stored `enrichment.industry` (a comma-separated
 * string like "Finance, Tech") into an array of trimmed labels. Returns
 * an empty array for null/undefined/empty input.
 */
export function parseIndustries(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * True when the given member's industry string contains the target
 * industry label. Case-insensitive exact match per token, so "Finance"
 * matches "Finance, Tech" but does NOT match "Finance / Investing"
 * (we standardized labels, so this should not be an issue going
 * forward).
 */
export function memberHasIndustry(
  rawMemberIndustry: string | null | undefined,
  targetLabel: string,
): boolean {
  const target = targetLabel.trim().toLowerCase()
  if (!target) return false
  return parseIndustries(rawMemberIndustry).some(
    tag => tag.toLowerCase() === target,
  )
}

/**
 * Slug helper for URL params. `'Real Estate'` → `'real-estate'`. The
 * label is the canonical form; the slug exists only for clean URLs.
 */
export function industryToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[/&]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Inverse of `industryToSlug`: find the canonical label. */
export function slugToIndustry(slug: string): string | null {
  const s = slug.trim().toLowerCase()
  return (
    INDUSTRY_OPTIONS.find(opt => industryToSlug(opt) === s) ?? null
  )
}
