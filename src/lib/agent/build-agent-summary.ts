import type { AgentRunStep, AgentRunStepId, AgentRunStepStatus, AgentRunSummary } from './types'

interface ReadinessCounts {
  extractedEntries: number
  extractedPending: number
  promotedEntries: number
  people: number
  seasonsWithEntries: number
  enrichedProfiles: number
  verifiedEnrichments: number
}

interface TeamInfo {
  slug: string
  websiteUrl?: string
}

function step(
  id: AgentRunStepId,
  label: string,
  description: string,
  status: AgentRunStepStatus,
  extra?: Partial<AgentRunStep>,
): AgentRunStep {
  return { id, label, description, status, ...extra }
}

export function buildAgentSummary(team: TeamInfo, counts: ReadinessCounts): AgentRunSummary {
  const {
    extractedEntries,
    extractedPending,
    promotedEntries,
    people,
    seasonsWithEntries,
    enrichedProfiles,
    verifiedEnrichments,
  } = counts
  const teamSlug = team.slug

  const teamStep = step(
    'team',
    'Team selected',
    'The team has been created and is ready for roster import.',
    'complete',
    { href: `/builder/workspace?teamSlug=${teamSlug}` },
  )

  const siteStep = step(
    'site',
    'Site checked',
    team.websiteUrl
      ? 'The team has a public roster URL on file.'
      : 'No roster URL on file. Add one to continue.',
    team.websiteUrl ? 'complete' : 'warning',
    { detail: team.websiteUrl ?? undefined },
  )

  const rosterStatus: AgentRunStepStatus = extractedEntries > 0 ? 'complete' : 'ready'
  const rosterStep = step(
    'current_roster',
    'Current roster extracted',
    extractedEntries > 0
      ? `${extractedEntries} roster rows extracted from the team site.`
      : 'Paste the team roster URL and run extraction to continue.',
    rosterStatus,
    {
      count: extractedEntries,
      href: extractedEntries > 0 ? `/builder/debug-roster?teamSlug=${teamSlug}` : undefined,
    },
  )

  const reviewStatus: AgentRunStepStatus =
    extractedEntries === 0
      ? 'locked'
      : extractedPending > 0
        ? 'needs_approval'
        : promotedEntries > 0
          ? 'complete'
          : 'ready'
  const reviewStep = step(
    'review_roster',
    'Review roster rows',
    extractedPending > 0
      ? `${extractedPending} rows are waiting for approval before being added to the graph.`
      : extractedEntries > 0
        ? 'All roster rows have been reviewed.'
        : 'No roster rows yet.',
    reviewStatus,
    { count: extractedPending, href: `/builder/promote?teamSlug=${teamSlug}` },
  )

  const graphStatus: AgentRunStepStatus =
    extractedEntries === 0 ? 'locked' : people > 0 ? 'complete' : 'ready'
  const graphStep = step(
    'add_to_graph',
    'Add people to graph',
    people > 0
      ? `${people} people are in the alumni graph.`
      : 'Approve roster rows to add them to the alumni graph.',
    graphStatus,
    { count: people, href: `/builder/people?teamSlug=${teamSlug}` },
  )

  const histStatus: AgentRunStepStatus =
    people === 0 ? 'locked' : seasonsWithEntries > 1 ? 'complete' : 'warning'
  const histStep = step(
    'historical_coverage',
    'Historical coverage',
    seasonsWithEntries > 1
      ? `${seasonsWithEntries} seasons of roster history imported.`
      : people > 0
        ? 'Only the current season is covered. Import past seasons to find more alumni.'
        : 'Add people to the graph first.',
    histStatus,
    { count: seasonsWithEntries, href: `/builder/history?teamSlug=${teamSlug}` },
  )

  const enrichStatus: AgentRunStepStatus =
    people === 0 ? 'locked' : verifiedEnrichments > 0 ? 'complete' : 'warning'
  const enrichStep = step(
    'profile_enrichment',
    'Verified profile details',
    verifiedEnrichments > 0
      ? `${verifiedEnrichments} profiles have verified career details.`
      : people > 0
        ? 'No verified career details yet. Add source-backed information for each person.'
        : 'Add people to the graph first.',
    enrichStatus,
    { count: verifiedEnrichments, href: `/builder/enrich?teamSlug=${teamSlug}` },
  )

  const playerStatus: AgentRunStepStatus = people > 0 ? 'complete' : 'locked'
  const playerStep = step(
    'player_ready',
    'Player-ready graph',
    people > 0
      ? 'The alumni graph is ready for the player-facing directory and outreach view.'
      : 'Add people to see the player view.',
    playerStatus,
    { href: `/member-book` },
  )

  const steps: AgentRunStep[] = [
    teamStep,
    siteStep,
    rosterStep,
    reviewStep,
    graphStep,
    histStep,
    enrichStep,
    playerStep,
  ]

  let recommendedActionId: string
  let recommendedActionLabel: string

  if (extractedEntries === 0) {
    recommendedActionId = 'run_extraction'
    recommendedActionLabel = 'Run roster extraction'
  } else if (extractedPending > 0) {
    recommendedActionId = 'add_to_graph'
    recommendedActionLabel = `Add ${extractedPending} roster rows to graph`
  } else if (people > 0 && seasonsWithEntries <= 1) {
    recommendedActionId = 'import_historical'
    recommendedActionLabel = 'Import historical seasons'
  } else if (people > 0 && verifiedEnrichments === 0) {
    recommendedActionId = 'enrich_profiles'
    recommendedActionLabel = 'Add verified profile details'
  } else if (people > 0) {
    recommendedActionId = 'open_player_view'
    recommendedActionLabel = 'Open player view'
  } else {
    recommendedActionId = 'run_extraction'
    recommendedActionLabel = 'Run roster extraction'
  }

  return {
    teamSlug,
    rosterUrl: team.websiteUrl,
    recommendedActionId,
    recommendedActionLabel,
    steps,
    counts: {
      extractedEntries,
      extractedPending,
      promotedEntries,
      people,
      seasonsWithEntries,
      enrichedProfiles,
      verifiedEnrichments,
    },
  }
}
