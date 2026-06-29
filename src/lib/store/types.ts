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
  /** Member opted out of providing a home course — they're not a member
   *  at a club. Suppresses the required-field check on save. */
  noHomeCourse?: boolean
  /** USGA handicap index as a free-form string. Stored as the user
   *  enters it so we can hold both numeric indexes ("12.4") and the
   *  preset categories "Scratch" and "Beginner / Learning". */
  handicap?: string
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
  /** Optional host-supplied photo or short video clip of the venue/vibe. */
  imageUrl?: string
  /** Optional Google Maps link the host pasted. When absent, the card
   * auto-generates a Maps search from venue + city/state. */
  mapsUrl?: string
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
  /** When true, the member has opted OUT of community-wide notifications
   *  (new member joined, new moment posted). Personal notifications
   *  (a request addressed to them, their claim being approved) ignore this
   *  flag and always send. Defaults to ON (undefined === not muted). */
  mutedCommunityNotifications?: boolean
  /** Current players can opt out of the "Answer the team's questions" queue.
   *  Undefined or true means opted IN; false means opted OUT. */
  answersTeamQuestions?: boolean
}

/**
 * In-app notification shown in the NavBar bell. One row per (recipient,
 * event). `type` distinguishes personal notifications (request/approved —
 * always delivered) from community broadcasts (new_member/new_moment —
 * suppressed when the recipient muted community updates). Stored newest-
 * first and capped per account to protect the single JSON blob.
 */
export interface AppNotification {
  id: string
  /** Recipient account id — the only account that may read this row. */
  accountId: string
  type: 'request' | 'approved' | 'new_member' | 'new_moment' | 'new_question' | 'question_answered'
  title: string
  body: string
  /** Where clicking the notification takes the member (e.g. '/player'). */
  href?: string
  createdAt: string
  /** ISO timestamp the recipient marked it read; undefined === unread. */
  readAt?: string
}

/**
 * A Web Push subscription endpoint for one account+device. Created when a
 * member taps "Turn on notifications". Deduped by endpoint. Pruned when a
 * push send returns 404/410 (subscription expired/unsubscribed at the
 * push service). Inert unless VAPID keys are configured server-side.
 */
export interface PushSubscriptionRecord {
  id: string
  accountId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: string
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
 * A founder-authored Season Tracker entry — qualifying, tournament results,
 * stats, or a general note about the current team. Hand-written from
 * /internal/season (unlike TeamNewsItem, which is auto-fetched). Surfaces as
 * a timeline in the Team Room, newest first.
 */
export interface SeasonUpdate {
  id: string
  teamId: string
  /** What kind of update this is — drives the tag on the card. */
  kind: 'qualifying' | 'tournament' | 'stat' | 'note'
  /** Headline, e.g. "Ivy Championship" or "Regional Qualifier". */
  title: string
  /** Freeform date/label, e.g. "May 28" or "Championship Weekend". */
  dateText: string
  /** The update itself — results, context, who's in contention. */
  body?: string
  /** Optional link to paste — results page, GolfStat, a tweet, an article. */
  linkUrl?: string
  /** Optional label for the link; falls back to the link's domain. */
  linkLabel?: string
  /** Preview image for the link card. Auto-pulled from the link's Open Graph
   * image on save, or set manually by the founder (manual wins). */
  previewImageUrl?: string
  /** Auto-pulled OG title/description for the link preview card. */
  previewTitle?: string
  previewDescription?: string
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
  /** ISO timestamp when a captain featured this moment. Undefined = not featured. */
  featuredAt?: string
  /** Name of the captain who featured it (snapshot at feature time). */
  featuredByName?: string
  createdAt: string
}

/**
 * A comment on a Moment. Supports one level of threading via
 * `parentCommentId` — top-level comments leave it undefined; replies
 * point at their parent. Two levels deep is the cap; replies to a reply
 * still attach to the original parent (Twitter / Slack model).
 */
export interface MomentComment {
  id: string
  momentId: string
  teamId: string
  /** Account of the commenter. */
  fromAccountId: string
  /** Linked person id (optional — present for approved members). */
  fromPersonId?: string
  /** Snapshot of commenter's name at write time; survives later renames. */
  fromName: string
  body: string
  /** Set when this comment is a reply to another. Undefined for top-level. */
  parentCommentId?: string
  status: 'published' | 'removed'
  createdAt: string
}

/**
 * A reaction to a Moment. One row per (account, moment, emoji) — a user
 * can stack multiple distinct emojis on the same moment but cannot react
 * twice with the same one. Removal is a hard delete (no soft-delete) since
 * reactions carry no narrative weight.
 */
export interface MomentReaction {
  id: string
  momentId: string
  teamId: string
  fromAccountId: string
  /** The emoji character itself (e.g. '🔥', '❤️', '😂'). Stored as the
   *  user-perceived grapheme — clients sort + dedupe on this. */
  emoji: string
  createdAt: string
}

/**
 * Open Requests — member-posted "I'm in town and want to do X" notes.
 * Different from a captain-hosted Gathering (which has venue + time)
 * and different from inTown on the Loop (which is passive). An Open
 * Request says actively "I'm in NYC Aug 5–10, looking for a round;
 * will cover guest fees." Renders as a strip on /the-course
 * (intent=round) and /19th-hole (intent in drinks/coffee/dinner).
 */
export type OpenRequestIntent = 'round' | 'drinks' | 'coffee' | 'dinner'

export interface OpenRequest {
  id: string
  teamId: string
  fromAccountId: string
  fromPersonId?: string
  fromName: string
  intent: OpenRequestIntent
  city?: string
  state?: string
  /** ISO date (yyyy-mm-dd). Optional date window. */
  startDate?: string
  endDate?: string
  /** Free-form body, capped at 400 chars by the API. */
  note: string
  /** When intent === 'round', "I'll cover guest fees" — surfaces as a
   *  small pill on the card so visiting alumni see who's offering. */
  guestFeesOffered: boolean
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
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

/**
 * A question an approved member asks the current team. Players (and founders)
 * can answer; answered questions are visible to the asker. Capped to newest 500.
 */
export interface TeamQuestionAnswer {
  id: string
  responderAccountId: string
  responderName: string
  body: string
  createdAt: string
}

export interface TeamQuestion {
  id: string
  askerAccountId: string
  askerName: string
  askerGradYear?: string
  question: string
  createdAt: string
  status: 'open' | 'answered'
  answers: TeamQuestionAnswer[]
}

/**
 * An idea submitted via the public /suggest form. Stored regardless of
 * sign-in status. Capped to the newest 200 rows. Founder gets an email +
 * in-app notification on each submission.
 */
export interface IdeaSubmission {
  id: string
  /** Present when the submitter was signed in. */
  accountId?: string
  name: string
  email?: string
  message: string
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
  momentComments: MomentComment[]
  momentReactions: MomentReaction[]
  openRequests: OpenRequest[]
  careerPosts: CareerPost[]
  teamNewsItems: TeamNewsItem[]
  seasonUpdates: SeasonUpdate[]
  chatConversations: ChatConversation[]
  chatMessages: ChatMessage[]
  donations: Donation[]
  /** Questions from alumni to the current team. Capped to newest 500. */
  teamQuestions: TeamQuestion[]
  /** In-app notifications, one row per (recipient, event). Capped per
   * account in the store helpers to protect the single blob. */
  notifications: AppNotification[]
  /** Web Push subscription endpoints, deduped by endpoint. */
  pushSubscriptions: PushSubscriptionRecord[]
  /** Captain-editable text + image overrides for content slots across the
   * site. Keys come from src/lib/site-content/slots.ts; values are either
   * plain strings (text slots) or URLs (image slots). */
  siteContent: Record<string, string>
  /** Ideas submitted via /suggest. Capped to newest 200. */
  ideaSubmissions: IdeaSubmission[]
}
