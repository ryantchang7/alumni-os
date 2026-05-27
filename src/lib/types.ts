// Core domain types for the Penn Golf Clubhouse

export type RelationshipMode =
  | 'career_chat'
  | 'play_golf'
  | 'mentorship'
  | 'junior_golf_family'
  | 'city_advice'
  | 'founder_advice'
  | 'finance_advice'
  | 'grad_school_advice'
  | 'team_events'
  | 'host_dinner'
  | 'program_support'
  | 'warm_intro'
  | 'do_not_contact'

export type ContactPathType =
  | 'coach_intro'
  | 'teammate_intro'
  | 'linkedin_public_url'
  | 'public_employer_bio'
  | 'alumni_submitted'
  | 'team_directory_permissioned'
  | 'unknown'
  | 'do_not_contact'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified'

export type VerificationStatus = 'verified' | 'needs_review' | 'rejected' | 'do_not_contact'

export type RelationshipStatus =
  | 'saved'
  | 'planning_to_contact'
  | 'contacted'
  | 'replied'
  | 'call_scheduled'
  | 'met'
  | 'played_golf'
  | 'follow_up_due'
  | 'thanked'
  | 'relationship_established'

export type OutreachPurpose =
  | 'career_advice'
  | 'play_golf'
  | 'mentorship'
  | 'junior_golf_parent_advice'
  | 'city_move'
  | 'founder_advice'
  | 'alumni_event'
  | 'thank_you'
  | 'follow_up'

export type OutreachChannel = 'email' | 'linkedin' | 'text' | 'coach_intro_request'

export type OutreachTone = 'casual' | 'polished' | 'concise'

export type ReviewItemType =
  | 'low_confidence_match'
  | 'duplicate_person'
  | 'contact_path_concern'
  | 'missing_source'
  | 'common_name_risk'
  | 'possible_wrong_profile'

// Graph Build Request
export interface GraphBuildRequest {
  id: string
  teamName: string
  schoolName: string
  sport: string
  gender: string
  officialTeamWebsite: string
  submittedAt: string
  status: 'pending' | 'running' | 'complete' | 'failed'
}

// Discovery / Pipeline
export interface DiscoveryRun {
  id: string
  teamId: string
  startedAt: string
  completedAt: string
  pagesDiscovered: number
  rosterPagesClassified: number
  rosterEntriesExtracted: number
  uniquePeopleNormalized: number
  profileCandidatesFound: number
  highConfidenceProfiles: number
  reviewItems: number
  connectionHooksGenerated: number
}

export interface PipelineStage {
  id: string
  order: number
  label: string
  description: string
  status: 'pending' | 'running' | 'complete' | 'warning'
  metric?: string
  metricLabel?: string
  completedAt?: string
  durationMs?: number
}

export interface AgentFinding {
  id: string
  timestamp: string
  type: 'page_found' | 'entry_extracted' | 'person_normalized' | 'candidate_found' | 'hook_generated' | 'review_queued'
  summary: string
  detail?: string
  confidence?: ConfidenceLevel
  url?: string
}

// Pages
export interface DiscoveredPage {
  id: string
  url: string
  pageType: 'roster' | 'history' | 'news' | 'results' | 'schedule' | 'bio' | 'alumni' | 'archive' | 'unknown'
  season?: string
  confidence: ConfidenceLevel
  priority: 'high' | 'medium' | 'low'
  discovered: boolean
}

export interface CrawledPage {
  id: string
  url: string
  status: 'success' | 'error' | 'skipped' | 'blocked'
  title?: string
  extractionStatus: 'extracted' | 'partial' | 'failed' | 'no_data'
  entriesFound?: number
  crawledAt?: string
}

// Roster Pipeline
export interface RosterEntry {
  id: string
  name: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  season: string
  sourceUrl: string
  confidence: ConfidenceLevel
  positionOrYear?: string
}

export interface NormalizedPerson {
  id: string
  canonicalName: string
  rosterYears: string[]
  classEstimate?: string
  sourceCount: number
  confidence: ConfidenceLevel
  graduationYear?: number
}

export interface IdentityCandidate {
  id: string
  personId: string
  personName: string
  candidateUrl: string
  sourceType: 'linkedin_public' | 'company_bio' | 'news_mention' | 'alumni_directory' | 'team_website'
  evidence: string[]
  confidence: ConfidenceLevel
  status: 'pending' | 'approved' | 'rejected' | 'needs_review'
}

// Alumni Profile
export interface ConnectionHook {
  id: string
  category: RelationshipMode
  text: string
  sourceSupported: boolean
  sourceSummary?: string
}

export interface SourceEvidence {
  id: string
  url: string
  sourceType: 'team_roster' | 'news_article' | 'company_bio' | 'linkedin_public' | 'alumni_page' | 'tournament_results'
  title: string
  snippet?: string
  retrievedAt?: string
}

export interface ContactPath {
  id: string
  type: ContactPathType
  label: string
  value?: string
  preferred: boolean
  verified: boolean
}

export interface SuggestedAsk {
  mode: RelationshipMode
  ask: string
  context: string
}

export interface AlumniProfile {
  id: string
  canonicalName: string
  firstName: string
  lastName: string
  pennGolfYears: string[]
  classYear?: number
  graduationYear?: number
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  state?: string
  bio?: string
  relationshipModes: RelationshipMode[]
  contactPaths: ContactPath[]
  connectionHooks: ConnectionHook[]
  suggestedAsks: SuggestedAsk[]
  sourceEvidence: SourceEvidence[]
  confidence: ConfidenceLevel
  verificationStatus: VerificationStatus
  relationshipStatus?: RelationshipStatus
  whyThisTieMatters: string
  howAgentFoundThis: string
  agentNotes?: string
  isOpenToGolf?: boolean
  isOpenToCareerChat?: boolean
  isOpenToMentorship?: boolean
}

// Review Queue
export interface ReviewItem {
  id: string
  type: ReviewItemType
  title: string
  relatedPersonName: string
  relatedPersonId?: string
  sourceLinks: string[]
  evidence: string[]
  confidence: ConfidenceLevel
  riskFlags: string[]
  suggestedAction: 'approve' | 'reject' | 'needs_alumni_confirmation' | 'do_not_contact' | 'needs_more_evidence'
  createdAt: string
  notes?: string
}

// Outreach
export interface OutreachDraft {
  id: string
  purpose: OutreachPurpose
  channel: OutreachChannel
  tone: OutreachTone
  subject?: string
  body: string
  wordCount: number
  variants: {
    label: string
    body: string
    wordCount: number
  }[]
  whatNotToAskYet: string[]
  scamCheck: {
    humanTone: boolean
    specificReason: boolean
    noReferralAsk: boolean
    noAutomationMention: boolean
    noPressureClose: boolean
    sourceSupported: boolean
  }
}

// Dashboard / Team
export interface TeamStats {
  alumniMapped: number
  verifiedProfiles: number
  openToGolf: number
  openToCareerChats: number
  profileCandidates: number
  reviewItems: number
  sourcePagesDrawled: number
  connectionHooksGenerated: number
}

export interface DashboardSection {
  id: string
  title: string
  description?: string
  alumniIds: string[]
}
