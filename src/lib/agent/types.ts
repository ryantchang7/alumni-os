export type AgentRunStepId =
  | 'team'
  | 'site'
  | 'current_roster'
  | 'review_roster'
  | 'add_to_graph'
  | 'historical_coverage'
  | 'profile_enrichment'
  | 'player_ready'

export type AgentRunStepStatus =
  | 'locked'
  | 'ready'
  | 'running'
  | 'needs_approval'
  | 'complete'
  | 'warning'
  | 'failed'

export interface AgentRunStep {
  id: AgentRunStepId
  label: string
  description: string
  status: AgentRunStepStatus
  href?: string
  detail?: string
  count?: number
}

export interface AgentRunSummary {
  teamSlug: string
  rosterUrl?: string
  recommendedActionId: string
  recommendedActionLabel: string
  steps: AgentRunStep[]
  counts: {
    extractedEntries: number
    extractedPending: number
    promotedEntries: number
    people: number
    seasonsWithEntries: number
    enrichedProfiles: number
    verifiedEnrichments: number
  }
}
