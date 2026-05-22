export interface Team {
  id: string
  schoolName: string
  teamName: string
  sport: string
  gender: string
  slug: string
  websiteUrl: string
  createdAt: string
}

export interface ScrapeRun {
  id: string
  teamId: string
  seedUrl: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  startedAt: string
  finishedAt?: string
  summary?: string
  logs: string[]
}

export interface CrawledPage {
  id: string
  scrapeRunId: string
  teamId: string
  url: string
  title?: string
  status: number
  pageType: string
  fetchedAt: string
  contentHash?: string
  htmlPreview?: string
  warnings: string[]
}

export interface ExtractedRosterEntry {
  id: string
  scrapeRunId: string
  crawledPageId: string
  teamId: string
  fullName: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  bioUrl?: string
  sourceUrl: string
  seasonYear?: string
  rawText?: string
  extractionConfidence: number
  status: 'extracted' | 'promoted' | 'rejected'
  createdAt: string
}

export interface Person {
  id: string
  canonicalName: string
  normalizedName: string
  firstName?: string
  lastName?: string
  createdAt: string
}

export interface TeamMembership {
  id: string
  personId: string
  teamId: string
  memberRole?: 'current_player' | 'alumni'
  memberStatus?: 'imported' | 'verified' | 'active'
  rosterStartYear?: number
  rosterEndYear?: number
  classYearEstimate?: string
  classLabel?: string
  hometown?: string
  highSchool?: string
  bioUrls: string[]
  sourceUrls: string[]
  confidence: number
  publishedToNetwork?: boolean
  publishedAt?: string
  publishedByRole?: 'captain' | 'staff' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface ReviewItem {
  id: string
  teamId: string
  type: 'low_confidence_extraction' | 'duplicate_candidate' | 'missing_required_field' | 'promotion_conflict'
  title: string
  description: string
  relatedExtractedEntryId?: string
  relatedPersonId?: string
  status: 'open' | 'approved' | 'rejected' | 'resolved'
  priority: 'low' | 'normal' | 'high'
  createdAt: string
}

export interface HistoricalImportRun {
  id: string
  teamId: string
  baseRosterUrl: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  currentSeason: string
  earliestSeason: string
  startedAt: string
  finishedAt?: string
  totalSeasons: number
  completedSeasons: number
  successfulSeasons: number
  failedSeasons: number
  totalEntries: number
  promotedCount?: number
  logs: string[]
}

export interface HistoricalSeasonResult {
  id: string
  historicalImportRunId: string
  teamId: string
  seasonYear: string
  url: string
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped'
  entriesExtracted: number
  warningCount: number
  errorMessage?: string
  scrapeRunId?: string
  createdAt: string
  updatedAt: string
}

export interface PersonEnrichment {
  id: string
  personId: string
  teamId: string
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  state?: string
  country?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  photoUrl?: string
  personalWebsiteUrl?: string
  notes?: string
  relationshipStatus?: 'not_started' | 'identified' | 'drafted' | 'contacted' | 'replied' | 'met' | 'do_not_contact'
  verificationStatus: 'unverified' | 'source_backed' | 'manually_verified' | 'needs_review'
  sourceUrls: string[]
  // Alumni self-service fields
  alumniBio?: string
  helpTopics?: string[]
  contactPreference?: 'team_intro' | 'email_ok' | 'linkedin_ok' | 'not_available'
  availabilityLevel?: 'one_per_month' | 'two_per_month' | 'open' | 'paused'
  openToGolfRounds?: boolean
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
  favoritePennGolfMemory?: string
  favoriteCourses?: string
  homeCourse?: string
  interests?: string
  memberSince?: string
  visibleToPlayers?: boolean
  optedOutAt?: string
  createdAt: string
  updatedAt: string
}

export interface Pre2000Candidate {
  id: string
  teamId: string
  name: string
  years?: string
  signal?: string
  sourceUrl?: string
  sourceType?: string
  reviewStatus: 'not_reviewed' | 'confirmed' | 'rejected' | 'needs_more_info'
  notes?: string
  createdAt: string
}

export interface EnrichmentSource {
  id: string
  personId: string
  teamId: string
  url: string
  title?: string
  sourceType: 'team_roster' | 'company_bio' | 'personal_site' | 'linkedin_public' | 'news_article' | 'manual_note' | 'other'
  notes?: string
  createdAt: string
}

export interface PlayerAlumniRequest {
  id: string
  teamId: string
  alumniPersonId: string
  fromName: string
  fromEmail?: string
  purpose: 'career_advice' | 'coffee_chat' | 'mentorship' | 'golf_connection' | 'warm_introduction' | 'internship_guidance' | 'interview_prep' | 'resume_review' | 'golf_round' | 'city_advice' | 'drinks_informal' | 'general_intro'
  context?: string
  additionalContext?: string
  message: string
  status: 'requested' | 'seen' | 'accepted' | 'declined' | 'suggested' | 'responded' | 'closed'
  responseMessage?: string
  respondedAt?: string
  suggestedPersonId?: string
  suggestedPersonName?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ClubhouseProfileClaimRequest {
  id: string
  teamId: string
  memberId: string
  requesterName: string
  requesterEmail: string
  pennGolfYears?: string
  note?: string
  status: 'pending' | 'approved' | 'declined'
  createdAt: string
  updatedAt: string
  respondedAt?: string
}

export interface ClubhouseGathering {
  id: string
  teamId: string
  type: 'round' | 'coffee' | 'drinks' | 'dinner' | 'event'
  title: string
  description?: string
  hostPersonId?: string
  hostName: string
  city?: string
  state?: string
  venue?: string
  dateText: string
  timeText?: string
  capacity?: number
  audience: 'players' | 'alumni' | 'both'
  vibe?: 'casual' | 'competitive' | 'career' | 'social' | 'formal'
  status: 'open' | 'full' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface ClubhouseGatheringRequest {
  id: string
  gatheringId: string
  teamId: string
  fromName: string
  fromEmail?: string
  note?: string
  status: 'requested' | 'accepted' | 'declined' | 'closed'
  createdAt: string
  updatedAt: string
  respondedAt?: string
}

export interface Account {
  id: string
  email: string
  googleSub: string
  name?: string
  image?: string
  linkedPersonId?: string
  teamId: string
  createdAt: string
  updatedAt: string
}

/**
 * A photo + caption shared to the Penn Golf wall by any signed-in member.
 * Status defaults to 'published' — first-version moderation is admin-side.
 */
export interface ClubhouseMoment {
  id: string
  teamId: string
  postedByAccountId: string
  postedByPersonId?: string
  postedByName: string
  caption: string
  photoUrl: string
  taggedPersonIds: string[]
  status: 'published' | 'pending' | 'removed'
  createdAt: string
}

export interface Store {
  teams: Team[]
  scrapeRuns: ScrapeRun[]
  crawledPages: CrawledPage[]
  extractedRosterEntries: ExtractedRosterEntry[]
  people: Person[]
  teamMemberships: TeamMembership[]
  reviewItems: ReviewItem[]
  historicalImportRuns: HistoricalImportRun[]
  historicalSeasonResults: HistoricalSeasonResult[]
  personEnrichments: PersonEnrichment[]
  enrichmentSources: EnrichmentSource[]
  playerAlumniRequests: PlayerAlumniRequest[]
  pre2000Candidates: Pre2000Candidate[]
  clubhouseGatherings: ClubhouseGathering[]
  clubhouseGatheringRequests: ClubhouseGatheringRequest[]
  profileClaimRequests: ClubhouseProfileClaimRequest[]
  accounts: Account[]
  moments: ClubhouseMoment[]
}
