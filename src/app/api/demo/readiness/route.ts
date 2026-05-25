import { NextResponse } from 'next/server'
import {
  getTeamBySlug,
  getExtractedEntriesForTeam,
  getPeopleForTeam,
  getTeamMembershipsForTeam,
  getHistoricalImportRunsForTeam,
  readStore,
} from '@/lib/store/local-store'
import { calculateGraphQuality } from '@/lib/store/graph-quality'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const [entries, people, memberships, historicalRuns, quality, rawStore] = await Promise.all([
    getExtractedEntriesForTeam(team.id),
    getPeopleForTeam(team.id),
    getTeamMembershipsForTeam(team.id),
    getHistoricalImportRunsForTeam(team.id),
    calculateGraphQuality(team.id),
    readStore(),
  ])

  const enrichments = (rawStore.personEnrichments ?? []).filter(e => e.teamId === team.id)
  const enrichedProfiles = enrichments.length
  const verifiedEnrichments = enrichments.filter(
    e => e.verificationStatus === 'manually_verified' || e.verificationStatus === 'source_backed',
  ).length

  const extractedEntries = entries.length
  const extractedPending = entries.filter(e => e.status === 'extracted').length
  const promotedEntries = entries.filter(e => e.status === 'promoted').length
  const rejectedEntries = entries.filter(e => e.status === 'rejected').length
  const seasonsWithEntries = new Set(entries.map(e => e.seasonYear).filter(Boolean)).size

  const counts = {
    extractedEntries,
    extractedPending,
    promotedEntries,
    rejectedEntries,
    people: people.length,
    memberships: memberships.length,
    seasonsWithEntries,
    historicalRuns: historicalRuns.length,
    enrichedProfiles,
    verifiedEnrichments,
  }

  const q = { score: quality.score, label: quality.label, warnings: quality.warnings }

  let recommendedNextAction: {
    id: string
    label: string
    href: string
    reason: string
  }

  if (extractedPending === 0 && people.length === 0) {
    recommendedNextAction = {
      id: 'extract-roster',
      label: 'Extract current roster',
      href: `/builder/debug-roster?teamSlug=${teamSlug}`,
      reason: 'No entries extracted yet',
    }
  } else if (extractedPending > 0 && people.length === 0) {
    recommendedNextAction = {
      id: 'promote-entries',
      label: 'Promote roster entries',
      href: `/builder/promote?teamSlug=${teamSlug}`,
      reason: `${extractedPending} entries awaiting promotion`,
    }
  } else if (people.length > 0 && seasonsWithEntries <= 1) {
    recommendedNextAction = {
      id: 'import-historical',
      label: 'Import historical seasons',
      href: `/builder/history?teamSlug=${teamSlug}`,
      reason: `Only ${seasonsWithEntries} season covered`,
    }
  } else if (people.length > 0 && seasonsWithEntries > 1 && verifiedEnrichments === 0) {
    recommendedNextAction = {
      id: 'enrich-profiles',
      label: 'Enrich profiles',
      href: `/builder/enrich?teamSlug=${teamSlug}`,
      reason: 'Roster graph exists, but no verified career/contact enrichment yet',
    }
  } else if (people.length > 0 && quality.score < 60) {
    recommendedNextAction = {
      id: 'review-quality',
      label: 'Review graph quality',
      href: `/builder/quality?teamSlug=${teamSlug}`,
      reason: `Quality score is ${quality.score}`,
    }
  } else {
    recommendedNextAction = {
      id: 'open-graph',
      label: 'Open alumni graph',
      href: `/builder/graph?teamSlug=${teamSlug}`,
      reason: 'Graph is ready',
    }
  }

  type ChecklistStatus = 'complete' | 'warning' | 'missing'

  const enrichmentStatus: ChecklistStatus =
    verifiedEnrichments > 0 ? 'complete' : people.length > 0 ? 'warning' : 'missing'

  const entriesPromotedStatus: ChecklistStatus =
    people.length > 0 ? 'complete' : extractedPending > 0 ? 'warning' : 'missing'

  const historicalStatus: ChecklistStatus =
    seasonsWithEntries > 1 ? 'complete' : people.length > 0 ? 'warning' : 'missing'

  const qualityStatus: ChecklistStatus =
    quality.score >= 60 ? 'complete' : quality.score > 0 ? 'warning' : 'missing'

  const checklist = [
    {
      id: 'team-created',
      label: 'Team created',
      status: 'complete' as ChecklistStatus,
      href: `/builder/workspace?teamSlug=${teamSlug}`,
      detail: `Team "${team.teamName}" created`,
    },
    {
      id: 'roster-extracted',
      label: 'Current roster extracted',
      status: (extractedEntries > 0 ? 'complete' : 'missing') as ChecklistStatus,
      href: `/builder/debug-roster?teamSlug=${teamSlug}`,
      detail: `${extractedEntries} entries extracted`,
    },
    {
      id: 'entries-promoted',
      label: 'Entries promoted to graph',
      status: entriesPromotedStatus,
      href: `/builder/promote?teamSlug=${teamSlug}`,
      detail: `${people.length} people promoted`,
    },
    {
      id: 'historical-imported',
      label: 'Historical seasons imported',
      status: historicalStatus,
      href: `/builder/history?teamSlug=${teamSlug}`,
      detail: `${seasonsWithEntries} season(s) covered`,
    },
    {
      id: 'quality-reviewed',
      label: 'Graph quality reviewed',
      status: qualityStatus,
      href: `/builder/quality?teamSlug=${teamSlug}`,
      detail: `Quality score: ${quality.score}`,
    },
    {
      id: 'profiles-enriched',
      label: 'Profiles enriched',
      status: enrichmentStatus,
      href: `/builder/enrich?teamSlug=${teamSlug}`,
      detail: `${verifiedEnrichments} verified enrichment(s)`,
    },
  ]

  return NextResponse.json({ team, counts, quality: q, recommendedNextAction, checklist })
}
