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
  memberRole?: 'current_player' | 'alumni' | 'parent' | 'coach'
  /** Free-text relationship label for parents/affiliates (e.g. "Parent of
   * John Smith C'24", "Affiliate — long-time supporter"). Shown on their
   * Member Book entry; ignored for current_player and alumni. */
  parentRelationship?: string
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
  // Extra locations (e.g. "winters in FL", "summers on Cape Cod"). The primary
  // city/state above is the home base; these are additional places the member
  // wants to show up on the Member Map.
  additionalLocations?: Array<{ city?: string; state?: string; label?: string }>
  // "On the loop" — a current trip the member wants other Penn Golf alumni
  // in that city to know about. Auto-expires past endDate.
  inTown?: {
    city?: string
    state?: string
    startDate?: string  // ISO date, e.g. "2026-06-05"
    endDate?: string
    note?: string       // "open to a round" / "playing Pine Valley Saturday"
  }
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
  /** Member Book entry id (the public directory). */
  memberId: string
  /** Resolved team-store person id, captured at claim time so the captain
   * approval handler can link the account without re-doing the bridge. */
  personId?: string
  requesterName: string
  requesterEmail: string
  /** Account id of the signed-in claimer. Present for the new captain-
   * gated flow; absent for legacy public-form claims. */
  requesterAccountId?: string
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
  /** Marks a seeded/demo gathering so the UI can label it "Example". Real
   * gatherings created by hosts never get this flag. */
  isExample?: boolean
  createdAt: string
  updatedAt: string
}

export interface ClubhouseGatheringRequest {
  id: string
  gatheringId: string
  teamId: string
  /** Account that submitted the RSVP (set when an approved member RSVPs).
   * Lets us de-dup, link to profiles, and email the attendee later. */
  fromAccountId?: string
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
  /** ISO timestamp of the last weekly digest email sent to this account. */
  lastDigestSentAt?: string
  /** Stripe customer id, set the first time this account interacts with billing. */
  stripeCustomerId?: string
  /** Active subscription state (Founding Member tier). */
  subscription?: {
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
    priceId: string
    /** ISO. */
    currentPeriodEnd?: string
    canceledAt?: string
  }
  /** Manually-granted badge ids from /internal/roles. Stacks on top of
   *  the Stripe-derived badges in getBadgesForAccount(). Used to hand
   *  Family & Affiliate, Founding Member, or Supporting Member status
   *  to people who aren't paying through Stripe. */
  manualBadges?: ('founding-member' | 'member' | 'parent')[]
  /** Founder-granted captain access. Stacks on top of the hardcoded
   *  CAPTAIN_EMAILS_BY_TEAM list in src/lib/captains.ts. */
  manualCaptain?: boolean
}

/**
 * One-time donations (separate from the subscription). Recorded on
 * Stripe Checkout completion via webhook.
 */
export interface Donation {
  id: string
  teamId: string
  accountId?: string  // null for anonymous donations
  donorEmail: string
  donorName?: string
  amountCents: number
  currency: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId?: string
  createdAt: string
}

/**
 * A news/article item pulled from the team's official athletics site
 * (Penn Athletics for the men's golf program). De-duplicated by sourceUrl.
 */
export interface TeamNewsItem {
  id: string
  teamId: string
  sourceUrl: string
  title: string
  summary?: string
  imageUrl?: string
  publishedAt?: string
  fetchedAt: string
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
  /** The hosted asset URL. Despite the name, this may point at an image OR
   *  a video — `mediaType` disambiguates. Kept as `photoUrl` for backwards
   *  compatibility with seed data. */
  photoUrl: string
  /** 'image' (default) or 'video'. Older records without this field are
   *  treated as 'image' by the UI. */
  mediaType?: 'image' | 'video'
  /** Visibility tier. 'public' (default) is all approved members.
   *  'locker-room' is current players + alumni only — excludes coach and
   *  family. Older records without this field default to 'public'. */
  audience?: 'public' | 'locker-room'
  taggedPersonIds: string[]
  status: 'published' | 'pending' | 'removed'
  createdAt: string
}

/**
 * Asks-and-Offers board for the Career Room. An "ask" is something an
 * alumnus is looking for (warm intro, role, advice); an "offer" is
 * something an alumnus is willing to give (intros at their firm, seat
 * at a dinner, a job referral). Designed to be the active, signal-rich
 * surface vs. the passive "open to mentorship" booleans on profiles.
 */
export type CareerPostSector =
  | 'finance'
  | 'consulting'
  | 'real-estate'
  | 'law'
  | 'technology'
  | 'startups'
  | 'sports'
  | 'medicine'
  | 'media'
  | 'public-service'
  | 'other'

export interface CareerPost {
  id: string
  teamId: string
  kind: 'ask' | 'offer'
  sector: CareerPostSector
  headline: string
  body?: string
  postedByAccountId: string
  postedByPersonId?: string
  postedByName: string
  contactEmail: string
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
}

/**
 * 1-on-1 or group chat between approved members. Direct chats are
 * deduped on creation by exact member set so we never end up with two
 * threads between the same pair.
 */
export interface ChatConversation {
  id: string
  teamId: string
  type: 'direct' | 'group'
  /** Optional name for group chats. */
  name?: string
  memberAccountIds: string[]
  createdByAccountId: string
  /** Bumps on every new message so list-sort by activity is cheap. */
  lastMessageAt?: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  teamId: string
  fromAccountId: string
  /** Snapshot of sender name at send time — survives later renames. */
  fromName: string
  body: string
  createdAt: string
  /** Account ids that have read this message. */
  readByAccountIds: string[]
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
  careerPosts: CareerPost[]
  teamNewsItems: TeamNewsItem[]
  chatConversations: ChatConversation[]
  chatMessages: ChatMessage[]
  donations: Donation[]
  /** Captain-editable text + image overrides for content slots across the
   * site. Keys come from src/lib/site-content/slots.ts; values are either
   * plain strings (text slots) or URLs (image slots). */
  siteContent: Record<string, string>
}
