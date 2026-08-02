/**
 * Living class-year labels. classYearEstimate is stored as e.g.
 * "Junior / 2028" — the stored word goes stale every September, but the
 * grad year doesn't. Derive the label from the year at render time so
 * grades roll forward on their own each season (Aug 1 cutover).
 */

const LABELS = ['Senior', 'Junior', 'Sophomore', 'Freshman']

export function deriveClassLabel(
  classYearEstimate: string | undefined,
  now = new Date(),
): string | undefined {
  if (!classYearEstimate) return undefined
  const stored = classYearEstimate.split(' / ')[0]?.trim() || undefined
  const yearMatch = classYearEstimate.match(/(20\d{2})\s*$/)
  if (!yearMatch) return stored
  const gradYear = Number(yearMatch[1])
  // Academic year is named for its spring: Aug 2026–Jul 2027 → 2027.
  const academicYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
  const idx = gradYear - academicYear
  if (idx < 0) return 'Alum'
  if (idx > 3) return stored
  return LABELS[idx]
}

/** "2026–27"-style label for the current academic season (Aug 1 cutover). */
export function currentSeasonLabel(now = new Date()): string {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}–${String(start + 1).slice(2)}`
}

const CLASS_SORT: Record<string, number> = { Senior: 0, Junior: 1, Sophomore: 2, Freshman: 3 }

/** Sort key that matches the DERIVED label, so order and chips agree. */
export function classSortOrder(classYearEstimate: string | undefined, now = new Date()): number {
  const label = deriveClassLabel(classYearEstimate, now)
  return label !== undefined && label in CLASS_SORT ? CLASS_SORT[label] : 99
}
