import {
  readStore,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
  getExtractedEntriesForTeam,
  extractSeasonYears,
} from './local-store'
import type { Person, TeamMembership, ExtractedRosterEntry } from './types'

export interface GraphQualityResult {
  score: number
  label: 'graph-ready' | 'needs-review' | 'incomplete'
  totalPeople: number
  totalMemberships: number
  highConfidenceCount: number
  lowConfidenceCount: number
  missingHometownCount: number
  missingHighSchoolCount: number
  missingBioUrlCount: number
  missingSourceUrlCount: number
  openReviewItems: number
  warnings: string[]
}

export interface DuplicateCandidate {
  personA: Person
  personB: Person
  reason: 'exact_normalized_name' | 'same_last_first_initial' | 'similar_name'
  confidence: number
}

export interface SeasonCoverage {
  seasonYear: string
  totalEntries: number
  promotedEntries: number
  avgConfidence: number
  hasHistoricalResult: boolean
}

export interface PersonMissingFields {
  person: Person
  membership: TeamMembership
  missingFields: string[]
}

export async function calculateGraphQuality(teamId: string): Promise<GraphQualityResult> {
  const store = await readStore()
  const people = await getPeopleForTeam(teamId)
  const memberships = await getTeamMembershipsForTeam(teamId)
  const reviewItems = store.reviewItems.filter(r => r.teamId === teamId && r.status === 'open')

  const warnings: string[] = []
  let score = 100

  if (people.length === 0) {
    return {
      score: 0,
      label: 'incomplete',
      totalPeople: 0,
      totalMemberships: 0,
      highConfidenceCount: 0,
      lowConfidenceCount: 0,
      missingHometownCount: 0,
      missingHighSchoolCount: 0,
      missingBioUrlCount: 0,
      missingSourceUrlCount: 0,
      openReviewItems: reviewItems.length,
      warnings: ['No people promoted yet'],
    }
  }

  const highConfidenceCount = memberships.filter(m => m.confidence >= 0.8).length
  const lowConfidenceCount = memberships.filter(m => m.confidence < 0.8).length
  const missingHometownCount = memberships.filter(m => !m.hometown).length
  const missingHighSchoolCount = memberships.filter(m => !m.highSchool).length
  const missingBioUrlCount = memberships.filter(m => m.bioUrls.length === 0).length
  const missingSourceUrlCount = memberships.filter(m => m.sourceUrls.length === 0).length

  // Deduct for low confidence (up to -20)
  if (lowConfidenceCount > 0) {
    const pct = lowConfidenceCount / memberships.length
    const deduction = Math.round(pct * 20)
    score -= deduction
    warnings.push(`${lowConfidenceCount} memberships below 80% confidence`)
  }

  // Deduct for missing hometown (up to -10)
  if (missingHometownCount > 0) {
    const pct = missingHometownCount / memberships.length
    const deduction = Math.round(pct * 10)
    score -= deduction
    if (pct > 0.3) warnings.push(`${missingHometownCount} people missing hometown`)
  }

  // Deduct for missing high school (up to -10)
  if (missingHighSchoolCount > 0) {
    const pct = missingHighSchoolCount / memberships.length
    const deduction = Math.round(pct * 10)
    score -= deduction
    if (pct > 0.3) warnings.push(`${missingHighSchoolCount} people missing high school`)
  }

  // Deduct for missing bio URLs (up to -15)
  if (missingBioUrlCount > 0) {
    const pct = missingBioUrlCount / memberships.length
    const deduction = Math.round(pct * 15)
    score -= deduction
    if (pct > 0.5) warnings.push(`${missingBioUrlCount} people have no bio URL`)
  }

  // Deduct for open review items (up to -15)
  if (reviewItems.length > 0) {
    const highPriority = reviewItems.filter(r => r.priority === 'high').length
    const deduction = Math.min(15, highPriority * 5 + (reviewItems.length - highPriority) * 2)
    score -= deduction
    warnings.push(`${reviewItems.length} open review items`)
  }

  score = Math.max(0, Math.min(100, score))

  const label: GraphQualityResult['label'] =
    score >= 80 ? 'graph-ready' : score >= 60 ? 'needs-review' : 'incomplete'

  return {
    score,
    label,
    totalPeople: people.length,
    totalMemberships: memberships.length,
    highConfidenceCount,
    lowConfidenceCount,
    missingHometownCount,
    missingHighSchoolCount,
    missingBioUrlCount,
    missingSourceUrlCount,
    openReviewItems: reviewItems.length,
    warnings,
  }
}

function normalizedEditDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return Math.max(m, n)
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export async function findDuplicateCandidates(teamId: string): Promise<DuplicateCandidate[]> {
  const people = await getPeopleForTeam(teamId)
  const candidates: DuplicateCandidate[] = []
  const seen = new Set<string>()

  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i]
      const b = people[j]
      const pairKey = [a.id, b.id].sort().join('|')
      if (seen.has(pairKey)) continue

      if (a.normalizedName === b.normalizedName) {
        candidates.push({ personA: a, personB: b, reason: 'exact_normalized_name', confidence: 0.98 })
        seen.add(pairKey)
        continue
      }

      // Same last name + same first initial
      if (a.lastName && b.lastName && a.firstName && b.firstName) {
        const sameLastName =
          a.lastName.toLowerCase().replace(/[^a-z]/g, '') ===
          b.lastName.toLowerCase().replace(/[^a-z]/g, '')
        const sameFirstInitial = a.firstName[0].toLowerCase() === b.firstName[0].toLowerCase()
        if (sameLastName && sameFirstInitial) {
          candidates.push({ personA: a, personB: b, reason: 'same_last_first_initial', confidence: 0.72 })
          seen.add(pairKey)
          continue
        }
      }

      // Edit distance similarity (only check names of similar length)
      const aN = a.normalizedName
      const bN = b.normalizedName
      if (Math.abs(aN.length - bN.length) <= 3) {
        const dist = normalizedEditDistance(aN, bN)
        const maxLen = Math.max(aN.length, bN.length)
        if (dist <= 2 && maxLen >= 6) {
          candidates.push({ personA: a, personB: b, reason: 'similar_name', confidence: 0.62 })
          seen.add(pairKey)
        }
      }
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence)
}

export async function getCoverageBySeason(teamId: string): Promise<SeasonCoverage[]> {
  const store = await readStore()
  const entries = await getExtractedEntriesForTeam(teamId)

  const seasonMap = new Map<
    string,
    { total: number; promoted: number; confidenceSum: number; hasHistoricalResult: boolean }
  >()

  // Mark which season years have historical results
  const historicalSeasonYears = new Set(
    store.historicalSeasonResults
      .filter(r => r.teamId === teamId && r.status === 'complete')
      .map(r => r.seasonYear),
  )

  for (const entry of entries) {
    const season = entry.seasonYear ?? 'unknown'
    const existing = seasonMap.get(season) ?? {
      total: 0,
      promoted: 0,
      confidenceSum: 0,
      hasHistoricalResult: historicalSeasonYears.has(season),
    }
    existing.total++
    if (entry.status === 'promoted') existing.promoted++
    existing.confidenceSum += entry.extractionConfidence
    seasonMap.set(season, existing)
  }

  return Array.from(seasonMap.entries())
    .map(([seasonYear, data]) => ({
      seasonYear,
      totalEntries: data.total,
      promotedEntries: data.promoted,
      avgConfidence: data.total > 0 ? Math.round((data.confidenceSum / data.total) * 100) / 100 : 0,
      hasHistoricalResult: data.hasHistoricalResult,
    }))
    .sort((a, b) => b.seasonYear.localeCompare(a.seasonYear))
}

export async function getPeopleMissingFields(teamId: string): Promise<PersonMissingFields[]> {
  const people = await getPeopleForTeam(teamId)
  const memberships = await getTeamMembershipsForTeam(teamId)

  const membershipMap = new Map(memberships.map(m => [m.personId, m]))
  const results: PersonMissingFields[] = []

  for (const person of people) {
    const m = membershipMap.get(person.id)
    if (!m) continue

    const missingFields: string[] = []
    if (!m.hometown) missingFields.push('hometown')
    if (!m.highSchool) missingFields.push('highSchool')
    if (m.sourceUrls.length === 0) missingFields.push('sourceUrls')
    if (m.bioUrls.length === 0) missingFields.push('bioUrls')

    if (missingFields.length > 0) {
      results.push({ person, membership: m, missingFields })
    }
  }

  return results.sort((a, b) => b.missingFields.length - a.missingFields.length)
}
