// Persistent store. Three backends, in priority order:
//   1. Upstash Redis (Vercel KV) — used when KV_REST_API_URL + KV_REST_API_TOKEN
//      are set. Writes persist across deploys and cold starts. This is the
//      production path.
//   2. Local file at data/alumni-os.json — used in dev (no env vars set).
//   3. /tmp fallback on Vercel without KV — ephemeral, writes survive within
//      a single warm function instance only. Old behavior; do not rely on it.

import fs from 'fs/promises'
import path from 'path'
import { Redis } from '@upstash/redis'
import type {
  Store,
  Team,
  ScrapeRun,
  CrawledPage,
  ExtractedRosterEntry,
  Person,
  TeamMembership,
  ReviewItem,
  HistoricalImportRun,
  HistoricalSeasonResult,
  PersonEnrichment,
  EnrichmentSource,
  PlayerAlumniRequest,
  ClubhouseGathering,
  ClubhouseGatheringRequest,
  ClubhouseProfileClaimRequest,
  Account,
  ClubhouseMoment,
  MomentComment,
  MomentReaction,
  OpenRequest,
  OpenRequestIntent,
  CareerPost,
  TeamNewsItem,
  SeasonUpdate,
  ChatConversation,
  ChatMessage,
  Donation,
  AppNotification,
  PushSubscriptionRecord,
  IdeaSubmission,
  TeamQuestion,
  TeamQuestionAnswer,
  AlumniSpotlight,
  SpotlightNomination,
  TeamTravelStop,
  TravelHostOffer,
} from './types'

// On Vercel (production) the /var/task filesystem is read-only.
// We copy the committed seed to /tmp on cold start and read/write from there.
const IS_VERCEL = process.env.VERCEL === '1'
const SEED_PATH = path.join(process.cwd(), 'data', 'alumni-os.json')
const STORE_PATH = IS_VERCEL ? '/tmp/alumni-os.json' : SEED_PATH
const REDIS_KEY = 'alumni-os:store:v1'

// Lazy Redis client. Returns null if env vars aren't configured.
let _redis: Redis | null | undefined
let _warnedFsFallback = false
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _redis = null
    // On Vercel without KV, every write lands in /tmp and disappears on the
    // next cold start. Warn loudly once per cold start so the signal shows
    // up in Vercel logs even before the founder opens /internal/launch-readiness.
    if (!_warnedFsFallback && process.env.VERCEL === '1') {
      _warnedFsFallback = true
      console.warn(
        '[store] ⚠️  Running on Vercel without KV_REST_API_URL/KV_REST_API_TOKEN. ' +
          'Writes are going to /tmp/alumni-os.json and WILL NOT persist across cold starts. ' +
          'Set Upstash KV env vars before sharing the URL with members.',
      )
    }
    return null
  }
  _redis = new Redis({ url, token })
  return _redis
}

function normalizeStore(parsed: Store): Store {
  // Backfill any new arrays the type added since this store was written.
  if (!parsed.historicalImportRuns) parsed.historicalImportRuns = []
  if (!parsed.historicalSeasonResults) parsed.historicalSeasonResults = []
  if (!parsed.personEnrichments) parsed.personEnrichments = []
  if (!parsed.enrichmentSources) parsed.enrichmentSources = []
  if (!parsed.playerAlumniRequests) parsed.playerAlumniRequests = []
  if (!parsed.pre2000Candidates) parsed.pre2000Candidates = []
  if (!parsed.clubhouseGatherings) parsed.clubhouseGatherings = []
  if (!parsed.clubhouseGatheringRequests) parsed.clubhouseGatheringRequests = []
  if (!parsed.profileClaimRequests) parsed.profileClaimRequests = []
  if (!parsed.accounts) parsed.accounts = []
  if (!parsed.moments) parsed.moments = []
  if (!parsed.momentComments) parsed.momentComments = []
  if (!parsed.momentReactions) parsed.momentReactions = []
  if (!parsed.openRequests) parsed.openRequests = []
  if (!parsed.careerPosts) parsed.careerPosts = []
  if (!parsed.teamNewsItems) parsed.teamNewsItems = []
  if (!parsed.seasonUpdates) parsed.seasonUpdates = []
  if (!parsed.chatConversations) parsed.chatConversations = []
  if (!parsed.chatMessages) parsed.chatMessages = []
  if (!parsed.donations) parsed.donations = []
  if (!parsed.notifications) parsed.notifications = []
  if (!parsed.pushSubscriptions) parsed.pushSubscriptions = []
  if (!parsed.siteContent) parsed.siteContent = {}
  if (!parsed.ideaSubmissions) parsed.ideaSubmissions = []
  if (!parsed.teamQuestions) parsed.teamQuestions = []
  if (!parsed.alumniSpotlights) parsed.alumniSpotlights = []
  if (!parsed.spotlightNominations) parsed.spotlightNominations = []
  if (!parsed.teamTravelStops) parsed.teamTravelStops = []
  if (!parsed.travelHostOffers) parsed.travelHostOffers = []
  return parsed
}

// Read the bundled seed file (read-only on Vercel, but readable for cold init).
async function readSeed(): Promise<Store> {
  try {
    const raw = await fs.readFile(SEED_PATH, 'utf-8')
    return normalizeStore(JSON.parse(raw) as Store)
  } catch {
    return { ...EMPTY_STORE }
  }
}

const EMPTY_STORE: Store = {
  teams: [],
  scrapeRuns: [],
  crawledPages: [],
  extractedRosterEntries: [],
  people: [],
  teamMemberships: [],
  reviewItems: [],
  historicalImportRuns: [],
  historicalSeasonResults: [],
  personEnrichments: [],
  enrichmentSources: [],
  playerAlumniRequests: [],
  pre2000Candidates: [],
  clubhouseGatherings: [],
  clubhouseGatheringRequests: [],
  profileClaimRequests: [],
  accounts: [],
  moments: [],
  momentComments: [],
  momentReactions: [],
  openRequests: [],
  careerPosts: [],
  teamNewsItems: [],
  seasonUpdates: [],
  chatConversations: [],
  chatMessages: [],
  donations: [],
  notifications: [],
  pushSubscriptions: [],
  siteContent: {},
  ideaSubmissions: [],
  teamQuestions: [],
  alumniSpotlights: [],
  spotlightNominations: [],
  teamTravelStops: [],
  travelHostOffers: [],
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractSeasonYears(seasonYear?: string): { start?: number; end?: number } {
  if (!seasonYear) return {}
  const m = seasonYear.match(/^(\d{4})-(\d{2})$/)
  if (!m) return {}
  const start = parseInt(m[1], 10)
  // end is always start+1 regardless of the two-digit suffix representation
  return { start, end: start + 1 }
}

function makeSlug(schoolName: string, gender: string, sport: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(university|college|the|of|and|in|at)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  const genderSlug =
    gender.toLowerCase() === 'men'
      ? 'mens'
      : gender.toLowerCase() === 'women'
        ? 'womens'
        : gender.toLowerCase()
  return [clean(schoolName), genderSlug, clean(sport)].filter(Boolean).join('-')
}

export async function ensureStore(): Promise<void> {
  const redis = getRedis()
  if (redis) {
    // Redis-backed: seed from the committed JSON the first time only.
    const existing = await redis.get(REDIS_KEY)
    if (existing == null) {
      const seed = await readSeed()
      await redis.set(REDIS_KEY, seed)
    }
    return
  }
  // File-backed (dev or Vercel-without-KV fallback).
  try {
    await fs.access(STORE_PATH)
  } catch {
    if (IS_VERCEL) {
      try {
        await fs.copyFile(SEED_PATH, STORE_PATH)
      } catch {
        await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2))
      }
    } else {
      await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
      await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2))
    }
  }
}

export async function readStore(): Promise<Store> {
  const redis = getRedis()
  if (redis) {
    let parsed = (await redis.get<Store>(REDIS_KEY)) ?? null
    if (!parsed) {
      // Cold init — seed Redis from the committed JSON, then return it.
      parsed = await readSeed()
      await redis.set(REDIS_KEY, parsed)
    }
    const normalized = normalizeStore(parsed)
    if (await ensureBootstrapMembers(normalized)) {
      await redis.set(REDIS_KEY, normalized)
    }
    return normalized
  }
  // File-backed fallback
  await ensureStore()
  const raw = await fs.readFile(STORE_PATH, 'utf-8')
  const normalized = normalizeStore(JSON.parse(raw) as Store)
  if (await ensureBootstrapMembers(normalized)) {
    await fs.writeFile(STORE_PATH, JSON.stringify(normalized, null, 2))
  }
  return normalized
}

// ── Bootstrap members ────────────────────────────────────────────────────────
// Specific members the captain has asked to land in the store without
// going through the /internal/add-member UI. Idempotent: only adds when
// not already present.
const BOOTSTRAP_MEMBERS: Array<{
  teamSlug: string
  name: string
  memberRole: 'alumni' | 'current_player'
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
}> = [
  {
    teamSlug: 'penn-mens-golf',
    name: 'Owen Hayes',
    memberRole: 'alumni',
    classLabel: "C'26",
    rosterStartYear: 2022,
    rosterEndYear: 2026,
  },
  {
    teamSlug: 'penn-mens-golf',
    name: 'Sean Curran',
    memberRole: 'current_player',
    classLabel: 'Fr.',
    rosterStartYear: 2026,
    rosterEndYear: 2030,
  },
  {
    teamSlug: 'penn-mens-golf',
    name: 'Oliver Uribe',
    memberRole: 'current_player',
    classLabel: 'Fr.',
    rosterStartYear: 2026,
    rosterEndYear: 2030,
  },
]

async function ensureBootstrapMembers(store: Store): Promise<boolean> {
  let dirty = false
  const now = new Date().toISOString()
  for (const m of BOOTSTRAP_MEMBERS) {
    const team = store.teams.find(t => t.slug === m.teamSlug)
    if (!team) continue
    const norm = normalizeName(m.name)

    // Look up any existing person on this team with the same normalized name.
    const existingPerson = store.people.find(
      p =>
        p.normalizedName === norm &&
        store.teamMemberships.some(
          tm => tm.personId === p.id && tm.teamId === team.id,
        ),
    )

    if (existingPerson) {
      // Upgrade their membership to match desired role/years if it doesn't
      // already match — covers the case where a recent grad is still
      // listed as a current player from the historical roster scrape.
      const idx = store.teamMemberships.findIndex(
        tm => tm.personId === existingPerson.id && tm.teamId === team.id,
      )
      if (idx === -1) continue
      const current = store.teamMemberships[idx]
      const needsUpdate =
        current.memberRole !== m.memberRole ||
        current.rosterEndYear !== m.rosterEndYear ||
        (m.rosterStartYear !== undefined && current.rosterStartYear !== m.rosterStartYear) ||
        (m.classLabel !== undefined && current.classLabel !== m.classLabel) ||
        !current.publishedToNetwork
      if (!needsUpdate) continue
      store.teamMemberships[idx] = {
        ...current,
        memberRole: m.memberRole,
        memberStatus: 'verified',
        classLabel: m.classLabel ?? current.classLabel,
        rosterStartYear: m.rosterStartYear ?? current.rosterStartYear,
        rosterEndYear: m.rosterEndYear ?? current.rosterEndYear,
        publishedToNetwork: true,
        publishedAt: current.publishedAt ?? now,
        publishedByRole: current.publishedByRole ?? 'captain',
        updatedAt: now,
      }
      // Make sure they have an enrichment row so they show up on Member Map etc.
      const enrichIdx = store.personEnrichments.findIndex(
        e => e.personId === existingPerson.id && e.teamId === team.id,
      )
      if (enrichIdx === -1) {
        store.personEnrichments.push({
          id: crypto.randomUUID(),
          personId: existingPerson.id,
          teamId: team.id,
          visibleToPlayers: true,
          contactPreference: 'team_intro',
          verificationStatus: 'unverified',
          sourceUrls: [],
          createdAt: now,
          updatedAt: now,
        })
      }
      dirty = true
      continue
    }

    // Brand-new — create person + membership + enrichment.
    const parts = m.name.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined

    const personId = crypto.randomUUID()
    store.people.push({
      id: personId,
      canonicalName: m.name,
      normalizedName: norm,
      firstName,
      lastName,
      createdAt: now,
    })
    store.teamMemberships.push({
      id: crypto.randomUUID(),
      personId,
      teamId: team.id,
      memberRole: m.memberRole,
      memberStatus: 'verified',
      classLabel: m.classLabel,
      rosterStartYear: m.rosterStartYear,
      rosterEndYear: m.rosterEndYear,
      bioUrls: [],
      sourceUrls: [],
      confidence: 1,
      publishedToNetwork: true,
      publishedAt: now,
      publishedByRole: 'captain',
      createdAt: now,
      updatedAt: now,
    })
    store.personEnrichments.push({
      id: crypto.randomUUID(),
      personId,
      teamId: team.id,
      visibleToPlayers: true,
      contactPreference: 'team_intro',
      verificationStatus: 'unverified',
      sourceUrls: [],
      createdAt: now,
      updatedAt: now,
    })
    dirty = true
  }
  return dirty
}

export async function writeStore(store: Store): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.set(REDIS_KEY, store)
    return
  }
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2))
}

// ── Optimistic-concurrency write guard ───────────────────────────────────────
// The store is a single JSON blob, so a naive readStore()→mutate→writeStore()
// can lose updates when two requests interleave (e.g. the captain approving a
// claim while a member saves their profile). mutateStore() captures the current
// revision, applies the mutator, then commits with a compare-and-set: if the
// revision moved underneath us we re-read and retry. Hot/concurrent write paths
// use this instead of readStore()+writeStore().
const REV_KEY = `${REDIS_KEY}:rev`
const MUTATE_MAX_RETRIES = 6
// KEYS[1]=store, KEYS[2]=rev. ARGV[1]=expectedRev, ARGV[2]=storeJson, ARGV[3]=nextRev.
const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[2])
if cur == false then cur = '0' end
if cur == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  redis.call('SET', KEYS[2], ARGV[3])
  return 1
end
return 0
`

export async function mutateStore<T>(
  mutator: (store: Store) => T | Promise<T>,
): Promise<T> {
  const redis = getRedis()
  // File-backed/dev path: single process, no contention to guard against.
  if (!redis) {
    const store = await readStore()
    const result = await mutator(store)
    await writeStore(store)
    return result
  }
  for (let attempt = 0; attempt < MUTATE_MAX_RETRIES; attempt++) {
    // Read the revision BEFORE the store so a write landing mid-read makes the
    // CAS fail (rather than silently overwriting with stale data).
    const expectedRev = Number((await redis.get<number>(REV_KEY)) ?? 0)
    const store = await readStore()
    const result = await mutator(store)
    const ok = await redis.eval(
      CAS_SCRIPT,
      [REDIS_KEY, REV_KEY],
      [String(expectedRev), JSON.stringify(store), String(expectedRev + 1)],
    )
    if (Number(ok) === 1) return result
    // Lost the race — brief backoff, then re-read and re-apply the mutation.
    await new Promise(r => setTimeout(r, 25 + attempt * 50))
  }
  throw new Error(
    `mutateStore: write contention — failed to commit after ${MUTATE_MAX_RETRIES} attempts`,
  )
}

export async function createTeam(
  input: Omit<Team, 'id' | 'slug' | 'createdAt'> & { slug?: string },
): Promise<Team> {
  const store = await readStore()
  const slug = input.slug ?? makeSlug(input.schoolName, input.gender, input.sport)
  const existing = store.teams.find(t => t.slug === slug)
  if (existing) return existing
  const team: Team = {
    id: crypto.randomUUID(),
    schoolName: input.schoolName,
    teamName: input.teamName,
    sport: input.sport,
    gender: input.gender,
    websiteUrl: input.websiteUrl,
    slug,
    createdAt: new Date().toISOString(),
  }
  store.teams.push(team)
  await writeStore(store)
  return team
}

export async function getTeamBySlug(slug: string): Promise<Team | undefined> {
  const store = await readStore()
  return store.teams.find(t => t.slug === slug)
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  const store = await readStore()
  return store.teams.find(t => t.id === id)
}

export async function createScrapeRun(input: Omit<ScrapeRun, 'id'>): Promise<ScrapeRun> {
  const store = await readStore()
  const run: ScrapeRun = { id: crypto.randomUUID(), ...input }
  store.scrapeRuns.push(run)
  await writeStore(store)
  return run
}

export async function updateScrapeRun(id: string, patch: Partial<ScrapeRun>): Promise<ScrapeRun> {
  const store = await readStore()
  const idx = store.scrapeRuns.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`ScrapeRun not found: ${id}`)
  store.scrapeRuns[idx] = { ...store.scrapeRuns[idx], ...patch }
  await writeStore(store)
  return store.scrapeRuns[idx]
}

export async function saveCrawledPage(input: Omit<CrawledPage, 'id'>): Promise<CrawledPage> {
  const store = await readStore()
  const page: CrawledPage = { id: crypto.randomUUID(), ...input }
  store.crawledPages.push(page)
  await writeStore(store)
  return page
}

export async function saveExtractedRosterEntries(
  inputs: Omit<ExtractedRosterEntry, 'id'>[],
): Promise<ExtractedRosterEntry[]> {
  const store = await readStore()
  const entries: ExtractedRosterEntry[] = inputs.map(input => ({
    id: crypto.randomUUID(),
    ...input,
  }))
  store.extractedRosterEntries.push(...entries)
  await writeStore(store)
  return entries
}

export async function getExtractedEntriesForTeam(teamId: string): Promise<ExtractedRosterEntry[]> {
  const store = await readStore()
  return store.extractedRosterEntries.filter(e => e.teamId === teamId)
}

export async function getExtractedEntriesByIds(ids: string[]): Promise<ExtractedRosterEntry[]> {
  const store = await readStore()
  const idSet = new Set(ids)
  return store.extractedRosterEntries.filter(e => idSet.has(e.id))
}

export async function updateExtractedEntryStatus(
  id: string,
  status: ExtractedRosterEntry['status'],
): Promise<void> {
  const store = await readStore()
  const entry = store.extractedRosterEntries.find(e => e.id === id)
  if (entry) {
    entry.status = status
    await writeStore(store)
  }
}

export async function promoteRosterEntries(
  teamId: string,
  extractedEntryIds: string[],
): Promise<{
  promotedCount: number
  peopleCreated: number
  membershipsCreatedOrUpdated: number
  reviewItemsCreated: number
}> {
  const store = await readStore()
  const idSet = new Set(extractedEntryIds)
  const entries = store.extractedRosterEntries.filter(
    e => idSet.has(e.id) && e.teamId === teamId && e.status === 'extracted',
  )

  let promotedCount = 0
  let peopleCreated = 0
  let membershipsCreatedOrUpdated = 0
  let reviewItemsCreated = 0

  const now = new Date().toISOString()

  for (const entry of entries) {
    const norm = normalizeName(entry.fullName)

    // Find all people with the same normalized name that have memberships on this team
    const matchingPeople = store.people.filter(p => {
      if (p.normalizedName !== norm) return false
      return store.teamMemberships.some(m => m.personId === p.id && m.teamId === teamId)
    })

    if (matchingPeople.length > 1) {
      // Conflict: multiple people with same name on same team
      store.reviewItems.push({
        id: crypto.randomUUID(),
        teamId,
        type: 'promotion_conflict',
        title: `Promotion conflict: "${entry.fullName}"`,
        description: `Multiple people (${matchingPeople.length}) with normalized name "${norm}" already exist on this team.`,
        relatedExtractedEntryId: entry.id,
        status: 'open',
        priority: 'high',
        createdAt: now,
      })
      reviewItemsCreated++
      continue
    }

    // Find or create person (match by normalizedName globally)
    let person: Person | undefined = matchingPeople[0]
    if (!person) {
      // Check all people with this normalized name (may exist without team membership)
      person = store.people.find(p => p.normalizedName === norm)
    }

    if (!person) {
      // Split name for firstName/lastName best-effort
      const parts = entry.fullName.trim().split(/\s+/)
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ') || undefined
      person = {
        id: crypto.randomUUID(),
        canonicalName: entry.fullName,
        normalizedName: norm,
        firstName,
        lastName,
        createdAt: now,
      }
      store.people.push(person)
      peopleCreated++
    }

    // Find or create/update TeamMembership
    const existingMembership = store.teamMemberships.find(
      m => m.personId === person!.id && m.teamId === teamId,
    )

    const { start: seasonStart, end: seasonEnd } = extractSeasonYears(entry.seasonYear)

    if (existingMembership) {
      // Fill in missing fields, append new bioUrls/sourceUrls
      if (!existingMembership.classLabel && entry.classLabel) {
        existingMembership.classLabel = entry.classLabel
      }
      if (!existingMembership.hometown && entry.hometown) {
        existingMembership.hometown = entry.hometown
      }
      if (!existingMembership.highSchool && entry.highSchool) {
        existingMembership.highSchool = entry.highSchool
      }
      if (entry.bioUrl && !existingMembership.bioUrls.includes(entry.bioUrl)) {
        existingMembership.bioUrls.push(entry.bioUrl)
      }
      if (!existingMembership.sourceUrls.includes(entry.sourceUrl)) {
        existingMembership.sourceUrls.push(entry.sourceUrl)
      }
      existingMembership.confidence = Math.max(
        existingMembership.confidence,
        entry.extractionConfidence,
      )
      // Expand roster year range across seasons
      if (seasonStart !== undefined) {
        existingMembership.rosterStartYear =
          existingMembership.rosterStartYear === undefined
            ? seasonStart
            : Math.min(existingMembership.rosterStartYear, seasonStart)
      }
      if (seasonEnd !== undefined) {
        existingMembership.rosterEndYear =
          existingMembership.rosterEndYear === undefined
            ? seasonEnd
            : Math.max(existingMembership.rosterEndYear, seasonEnd)
      }
      existingMembership.updatedAt = now
      membershipsCreatedOrUpdated++
    } else {
      const membership: TeamMembership = {
        id: crypto.randomUUID(),
        personId: person.id,
        teamId,
        rosterStartYear: seasonStart,
        rosterEndYear: seasonEnd,
        classLabel: entry.classLabel,
        hometown: entry.hometown,
        highSchool: entry.highSchool,
        bioUrls: entry.bioUrl ? [entry.bioUrl] : [],
        sourceUrls: [entry.sourceUrl],
        confidence: entry.extractionConfidence,
        createdAt: now,
        updatedAt: now,
      }
      store.teamMemberships.push(membership)
      membershipsCreatedOrUpdated++
    }

    entry.status = 'promoted'
    promotedCount++
  }

  await writeStore(store)
  return { promotedCount, peopleCreated, membershipsCreatedOrUpdated, reviewItemsCreated }
}

export async function rejectRosterEntries(entryIds: string[]): Promise<number> {
  const store = await readStore()
  const idSet = new Set(entryIds)
  let count = 0
  for (const entry of store.extractedRosterEntries) {
    if (idSet.has(entry.id) && entry.status === 'extracted') {
      entry.status = 'rejected'
      count++
    }
  }
  await writeStore(store)
  return count
}

export async function getPeopleForTeam(teamId: string): Promise<Person[]> {
  const store = await readStore()
  const memberships = store.teamMemberships.filter(m => m.teamId === teamId)
  const personIds = new Set(memberships.map(m => m.personId))
  return store.people.filter(p => personIds.has(p.id))
}

export async function getTeamMembershipsForTeam(teamId: string): Promise<TeamMembership[]> {
  const store = await readStore()
  return store.teamMemberships.filter(m => m.teamId === teamId)
}

export async function getReviewItemsForTeam(teamId: string): Promise<ReviewItem[]> {
  const store = await readStore()
  return store.reviewItems.filter(r => r.teamId === teamId)
}

export async function addReviewItem(
  input: Omit<ReviewItem, 'id' | 'createdAt'>,
): Promise<ReviewItem> {
  const store = await readStore()
  const item: ReviewItem = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  }
  store.reviewItems.push(item)
  await writeStore(store)
  return item
}

// ── Historical Import ─────────────────────────────────────────────────────────

export async function createHistoricalImportRun(
  input: Omit<HistoricalImportRun, 'id'>,
): Promise<HistoricalImportRun> {
  const store = await readStore()
  const run: HistoricalImportRun = { id: crypto.randomUUID(), ...input }
  store.historicalImportRuns.push(run)
  await writeStore(store)
  return run
}

export async function updateHistoricalImportRun(
  id: string,
  patch: Partial<HistoricalImportRun>,
): Promise<HistoricalImportRun> {
  const store = await readStore()
  const idx = store.historicalImportRuns.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`HistoricalImportRun not found: ${id}`)
  store.historicalImportRuns[idx] = { ...store.historicalImportRuns[idx], ...patch }
  await writeStore(store)
  return store.historicalImportRuns[idx]
}

export async function saveHistoricalSeasonResult(
  input: Omit<HistoricalSeasonResult, 'id'>,
): Promise<HistoricalSeasonResult> {
  const store = await readStore()
  const result: HistoricalSeasonResult = { id: crypto.randomUUID(), ...input }
  store.historicalSeasonResults.push(result)
  await writeStore(store)
  return result
}

export async function updateHistoricalSeasonResult(
  id: string,
  patch: Partial<HistoricalSeasonResult>,
): Promise<HistoricalSeasonResult> {
  const store = await readStore()
  const idx = store.historicalSeasonResults.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`HistoricalSeasonResult not found: ${id}`)
  store.historicalSeasonResults[idx] = { ...store.historicalSeasonResults[idx], ...patch }
  await writeStore(store)
  return store.historicalSeasonResults[idx]
}

export async function getHistoricalImportRunsForTeam(teamId: string): Promise<HistoricalImportRun[]> {
  const store = await readStore()
  return store.historicalImportRuns.filter(r => r.teamId === teamId)
}

export async function getLatestHistoricalImportRunForTeam(
  teamId: string,
): Promise<HistoricalImportRun | undefined> {
  const runs = await getHistoricalImportRunsForTeam(teamId)
  if (!runs.length) return undefined
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}

export async function getHistoricalSeasonResultsForRun(runId: string): Promise<HistoricalSeasonResult[]> {
  const store = await readStore()
  return store.historicalSeasonResults.filter(r => r.historicalImportRunId === runId)
}

export async function getHistoricalSeasonResultById(
  id: string,
): Promise<HistoricalSeasonResult | undefined> {
  const store = await readStore()
  return store.historicalSeasonResults.find(r => r.id === id)
}

// ── Enrichment ────────────────────────────────────────────────────────────────

export async function getPersonEnrichment(
  personId: string,
  teamId: string,
): Promise<PersonEnrichment | undefined> {
  const store = await readStore()
  return store.personEnrichments.find(e => e.personId === personId && e.teamId === teamId)
}

export async function upsertPersonEnrichment(input: {
  personId: string
  teamId: string
  currentRole?: string
  currentCompany?: string
  industry?: string
  city?: string
  state?: string
  country?: string
  email?: string
  linkedinUrl?: string
  personalWebsiteUrl?: string
  notes?: string
  relationshipStatus?: PersonEnrichment['relationshipStatus']
  verificationStatus?: PersonEnrichment['verificationStatus']
  sourceUrls?: string[]
}): Promise<PersonEnrichment> {
  const store = await readStore()
  const now = new Date().toISOString()
  const idx = store.personEnrichments.findIndex(
    e => e.personId === input.personId && e.teamId === input.teamId,
  )
  if (idx !== -1) {
    const existing = store.personEnrichments[idx]
    const mergedSourceUrls = Array.from(
      new Set([...existing.sourceUrls, ...(input.sourceUrls ?? [])]),
    )
    store.personEnrichments[idx] = {
      ...existing,
      ...(input.currentRole !== undefined ? { currentRole: input.currentRole } : {}),
      ...(input.currentCompany !== undefined ? { currentCompany: input.currentCompany } : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
      ...(input.personalWebsiteUrl !== undefined ? { personalWebsiteUrl: input.personalWebsiteUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.relationshipStatus !== undefined ? { relationshipStatus: input.relationshipStatus } : {}),
      verificationStatus: input.verificationStatus ?? existing.verificationStatus,
      sourceUrls: mergedSourceUrls,
      updatedAt: now,
    }
    await writeStore(store)
    return store.personEnrichments[idx]
  }
  const enrichment: PersonEnrichment = {
    id: crypto.randomUUID(),
    personId: input.personId,
    teamId: input.teamId,
    currentRole: input.currentRole,
    currentCompany: input.currentCompany,
    industry: input.industry,
    city: input.city,
    state: input.state,
    country: input.country,
    email: input.email,
    linkedinUrl: input.linkedinUrl,
    personalWebsiteUrl: input.personalWebsiteUrl,
    notes: input.notes,
    relationshipStatus: input.relationshipStatus ?? 'not_started',
    verificationStatus: input.verificationStatus ?? 'unverified',
    sourceUrls: Array.from(new Set(input.sourceUrls ?? [])),
    createdAt: now,
    updatedAt: now,
  }
  store.personEnrichments.push(enrichment)
  await writeStore(store)
  return enrichment
}

export async function getEnrichmentSourcesForPerson(
  personId: string,
  teamId: string,
): Promise<EnrichmentSource[]> {
  const store = await readStore()
  return store.enrichmentSources.filter(s => s.personId === personId && s.teamId === teamId)
}

export async function addEnrichmentSource(
  input: Omit<EnrichmentSource, 'id' | 'createdAt'>,
): Promise<EnrichmentSource> {
  const store = await readStore()
  const source: EnrichmentSource = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  }
  store.enrichmentSources.push(source)
  await writeStore(store)
  return source
}

export async function deleteEnrichmentSource(id: string): Promise<boolean> {
  const store = await readStore()
  const before = store.enrichmentSources.length
  store.enrichmentSources = store.enrichmentSources.filter(s => s.id !== id)
  if (store.enrichmentSources.length < before) {
    await writeStore(store)
    return true
  }
  return false
}

// ── Network publication ────────────────────────────────────────────────────────

export async function publishMembershipToNetwork(
  teamId: string,
  personId: string,
  role: 'captain' | 'staff' | 'admin',
): Promise<boolean> {
  const store = await readStore()
  const idx = store.teamMemberships.findIndex(
    m => m.teamId === teamId && m.personId === personId,
  )
  if (idx === -1) return false
  store.teamMemberships[idx] = {
    ...store.teamMemberships[idx],
    publishedToNetwork: true,
    publishedAt: new Date().toISOString(),
    publishedByRole: role,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return true
}

export async function unpublishMembershipFromNetwork(
  teamId: string,
  personId: string,
): Promise<boolean> {
  const store = await readStore()
  const idx = store.teamMemberships.findIndex(
    m => m.teamId === teamId && m.personId === personId,
  )
  if (idx === -1) return false
  store.teamMemberships[idx] = {
    ...store.teamMemberships[idx],
    publishedToNetwork: false,
    publishedAt: undefined,
    publishedByRole: undefined,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return true
}

export async function getPublishedPeopleForTeam(teamId: string): Promise<{
  person: Person
  membership: TeamMembership
}[]> {
  const store = await readStore()
  const publishedMemberships = store.teamMemberships.filter(
    m => m.teamId === teamId && m.publishedToNetwork === true,
  )
  return publishedMemberships.map(membership => {
    const person = store.people.find(p => p.id === membership.personId)
    if (!person) return null
    return { person, membership }
  }).filter((r): r is { person: Person; membership: TeamMembership } => r !== null)
}

// ── Alumni self-service (safe fields only) ────────────────────────────────────

export type AlumniSafeFields = Pick<
  PersonEnrichment,
  'currentRole' | 'currentCompany' | 'industry' | 'city' | 'state' | 'country' |
  'additionalLocations' | 'inTown' |
  'alumniBio' | 'helpTopics' | 'contactPreference' | 'visibleToPlayers' |
  'homeCourse' | 'noHomeCourse' | 'handicap' | 'favoriteCourses' | 'favoritePennGolfMemory' | 'interests' |
  'email' | 'phone' | 'linkedinUrl' | 'photoUrl' |
  'openToGolfRounds' | 'openToCoffee' | 'openToMentorship' | 'openToWarmIntroductions'
>

export async function updatePersonEnrichmentSafeFields(
  personId: string,
  teamId: string,
  fields: Partial<AlumniSafeFields>,
): Promise<PersonEnrichment | null> {
  const now = new Date().toISOString()
  return mutateStore(store => {
  const idx = store.personEnrichments.findIndex(
    e => e.personId === personId && e.teamId === teamId,
  )
  if (idx !== -1) {
    store.personEnrichments[idx] = {
      ...store.personEnrichments[idx],
      ...(fields.currentRole !== undefined ? { currentRole: fields.currentRole } : {}),
      ...(fields.currentCompany !== undefined ? { currentCompany: fields.currentCompany } : {}),
      ...(fields.industry !== undefined ? { industry: fields.industry } : {}),
      ...(fields.city !== undefined ? { city: fields.city } : {}),
      ...(fields.state !== undefined ? { state: fields.state } : {}),
      ...(fields.country !== undefined ? { country: fields.country } : {}),
      ...(fields.additionalLocations !== undefined ? { additionalLocations: fields.additionalLocations } : {}),
      // 'in' check (not !== undefined) so a deliberate clear — the caller
      // sets fields.inTown = undefined when the user empties the form —
      // actually wipes the stored trip instead of being silently dropped.
      ...('inTown' in fields ? { inTown: fields.inTown } : {}),
      ...(fields.alumniBio !== undefined ? { alumniBio: fields.alumniBio } : {}),
      ...(fields.helpTopics !== undefined ? { helpTopics: fields.helpTopics } : {}),
      ...(fields.contactPreference !== undefined ? { contactPreference: fields.contactPreference } : {}),
      ...(fields.visibleToPlayers !== undefined ? { visibleToPlayers: fields.visibleToPlayers } : {}),
      ...(fields.homeCourse !== undefined ? { homeCourse: fields.homeCourse } : {}),
      ...(fields.noHomeCourse !== undefined ? { noHomeCourse: fields.noHomeCourse } : {}),
      ...(fields.handicap !== undefined ? { handicap: fields.handicap } : {}),
      ...(fields.favoriteCourses !== undefined ? { favoriteCourses: fields.favoriteCourses } : {}),
      ...(fields.favoritePennGolfMemory !== undefined ? { favoritePennGolfMemory: fields.favoritePennGolfMemory } : {}),
      ...(fields.interests !== undefined ? { interests: fields.interests } : {}),
      ...(fields.email !== undefined ? { email: fields.email } : {}),
      ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
      ...(fields.linkedinUrl !== undefined ? { linkedinUrl: fields.linkedinUrl } : {}),
      ...(fields.photoUrl !== undefined ? { photoUrl: fields.photoUrl } : {}),
      ...(fields.openToGolfRounds !== undefined ? { openToGolfRounds: fields.openToGolfRounds } : {}),
      ...(fields.openToCoffee !== undefined ? { openToCoffee: fields.openToCoffee } : {}),
      ...(fields.openToMentorship !== undefined ? { openToMentorship: fields.openToMentorship } : {}),
      ...(fields.openToWarmIntroductions !== undefined ? { openToWarmIntroductions: fields.openToWarmIntroductions } : {}),
      updatedAt: now,
    }
    return store.personEnrichments[idx]
  }
  // No enrichment record yet — create one with safe fields only
  const enrichment: PersonEnrichment = {
    id: crypto.randomUUID(),
    personId,
    teamId,
    currentRole: fields.currentRole,
    currentCompany: fields.currentCompany,
    industry: fields.industry,
    city: fields.city,
    state: fields.state,
    country: fields.country,
    additionalLocations: fields.additionalLocations,
    inTown: fields.inTown,
    alumniBio: fields.alumniBio,
    helpTopics: fields.helpTopics,
    contactPreference: fields.contactPreference,
    visibleToPlayers: fields.visibleToPlayers,
    homeCourse: fields.homeCourse,
    noHomeCourse: fields.noHomeCourse,
    handicap: fields.handicap,
    favoriteCourses: fields.favoriteCourses,
    favoritePennGolfMemory: fields.favoritePennGolfMemory,
    interests: fields.interests,
    email: fields.email,
    phone: fields.phone,
    linkedinUrl: fields.linkedinUrl,
    photoUrl: fields.photoUrl,
    openToGolfRounds: fields.openToGolfRounds,
    openToCoffee: fields.openToCoffee,
    openToMentorship: fields.openToMentorship,
    openToWarmIntroductions: fields.openToWarmIntroductions,
    verificationStatus: 'unverified',
    sourceUrls: [],
    createdAt: now,
    updatedAt: now,
  }
  store.personEnrichments.push(enrichment)
  return enrichment
  })
}

// ── Player → Alumni requests ──────────────────────────────────────────────────

export async function createPlayerAlumniRequest(input: {
  teamId: string
  alumniPersonId: string
  fromName: string
  fromEmail?: string
  purpose: PlayerAlumniRequest['purpose']
  context?: string
  additionalContext?: string
  message: string
}): Promise<PlayerAlumniRequest> {
  const store = await readStore()
  const now = new Date().toISOString()
  const request: PlayerAlumniRequest = {
    id: crypto.randomUUID(),
    teamId: input.teamId,
    alumniPersonId: input.alumniPersonId,
    fromName: input.fromName.trim(),
    fromEmail: input.fromEmail?.trim() || undefined,
    purpose: input.purpose,
    context: input.context?.trim() || undefined,
    additionalContext: input.additionalContext?.trim() || undefined,
    message: input.message.trim(),
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  }
  store.playerAlumniRequests.push(request)
  await writeStore(store)
  return request
}

export async function getRequestsForAlumni(
  teamId: string,
  alumniPersonId: string,
): Promise<PlayerAlumniRequest[]> {
  const store = await readStore()
  return store.playerAlumniRequests.filter(
    r => r.teamId === teamId && r.alumniPersonId === alumniPersonId,
  )
}

export async function getRequestsForTeam(teamId: string): Promise<PlayerAlumniRequest[]> {
  const store = await readStore()
  return store.playerAlumniRequests.filter(r => r.teamId === teamId)
}

export async function updatePlayerAlumniRequestStatus(
  requestId: string,
  status: PlayerAlumniRequest['status'],
): Promise<PlayerAlumniRequest | null> {
  return respondToPlayerAlumniRequest({ requestId, status })
}

export async function respondToPlayerAlumniRequest(input: {
  requestId: string
  status: PlayerAlumniRequest['status']
  responseMessage?: string
  suggestedPersonId?: string
  suggestedPersonName?: string
}): Promise<PlayerAlumniRequest | null> {
  const store = await readStore()
  const idx = store.playerAlumniRequests.findIndex(r => r.id === input.requestId)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const current = store.playerAlumniRequests[idx]
  const respondedStatuses = new Set(['accepted', 'declined', 'suggested', 'responded'])
  store.playerAlumniRequests[idx] = {
    ...current,
    status: input.status,
    responseMessage: input.responseMessage?.trim() || current.responseMessage,
    suggestedPersonId: input.suggestedPersonId || current.suggestedPersonId,
    suggestedPersonName: input.suggestedPersonName || current.suggestedPersonName,
    respondedAt: respondedStatuses.has(input.status) ? (current.respondedAt ?? now) : current.respondedAt,
    closedAt: input.status === 'closed' ? (current.closedAt ?? now) : current.closedAt,
    updatedAt: now,
  }
  await writeStore(store)
  return store.playerAlumniRequests[idx]
}

// ── Clubhouse Gatherings ──────────────────────────────────────────────────────

export async function createClubhouseGathering(
  input: Omit<ClubhouseGathering, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ClubhouseGathering> {
  const store = await readStore()
  const now = new Date().toISOString()
  const gathering: ClubhouseGathering = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  }
  store.clubhouseGatherings.push(gathering)
  await writeStore(store)
  return gathering
}

export async function getClubhouseGatheringsForTeam(
  teamId: string,
  type?: ClubhouseGathering['type'],
): Promise<ClubhouseGathering[]> {
  const store = await readStore()
  return store.clubhouseGatherings.filter(
    g => g.teamId === teamId && (type === undefined || g.type === type) && g.status !== 'closed',
  )
}

export async function getClubhouseGatheringById(id: string): Promise<ClubhouseGathering | undefined> {
  const store = await readStore()
  return store.clubhouseGatherings.find(g => g.id === id)
}

export async function updateClubhouseGathering(
  id: string,
  patch: Partial<Omit<ClubhouseGathering, 'id' | 'teamId' | 'createdAt'>>,
): Promise<ClubhouseGathering | null> {
  const store = await readStore()
  const idx = store.clubhouseGatherings.findIndex(g => g.id === id)
  if (idx === -1) return null
  store.clubhouseGatherings[idx] = {
    ...store.clubhouseGatherings[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return store.clubhouseGatherings[idx]
}

// ── Season Updates ────────────────────────────────────────────────────────────

export async function createSeasonUpdate(
  input: Omit<SeasonUpdate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<SeasonUpdate> {
  const store = await readStore()
  const now = new Date().toISOString()
  const update: SeasonUpdate = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  }
  store.seasonUpdates.push(update)
  await writeStore(store)
  return update
}

export async function getSeasonUpdatesForTeam(teamId: string): Promise<SeasonUpdate[]> {
  const store = await readStore()
  return store.seasonUpdates
    .filter(u => u.teamId === teamId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateSeasonUpdate(
  id: string,
  patch: Partial<Omit<SeasonUpdate, 'id' | 'teamId' | 'createdAt'>>,
): Promise<SeasonUpdate | null> {
  const store = await readStore()
  const idx = store.seasonUpdates.findIndex(u => u.id === id)
  if (idx === -1) return null
  store.seasonUpdates[idx] = {
    ...store.seasonUpdates[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return store.seasonUpdates[idx]
}

export async function deleteSeasonUpdate(id: string): Promise<boolean> {
  const store = await readStore()
  const before = store.seasonUpdates.length
  store.seasonUpdates = store.seasonUpdates.filter(u => u.id !== id)
  if (store.seasonUpdates.length === before) return false
  await writeStore(store)
  return true
}

export async function createClubhouseGatheringRequest(input: {
  gatheringId: string
  teamId: string
  fromAccountId?: string
  fromName: string
  fromEmail?: string
  note?: string
}): Promise<ClubhouseGatheringRequest> {
  const store = await readStore()
  const now = new Date().toISOString()
  const req: ClubhouseGatheringRequest = {
    id: crypto.randomUUID(),
    gatheringId: input.gatheringId,
    teamId: input.teamId,
    fromAccountId: input.fromAccountId,
    fromName: input.fromName.trim(),
    fromEmail: input.fromEmail?.trim() || undefined,
    note: input.note?.trim() || undefined,
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  }
  store.clubhouseGatheringRequests.push(req)
  await writeStore(store)
  return req
}

export async function getSiteContent(slot: string): Promise<string | undefined> {
  const store = await readStore()
  return store.siteContent?.[slot]
}

export async function getAllSiteContent(): Promise<Record<string, string>> {
  const store = await readStore()
  return { ...(store.siteContent ?? {}) }
}

export async function setSiteContent(slot: string, value: string): Promise<void> {
  const store = await readStore()
  if (!store.siteContent) store.siteContent = {}
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    delete store.siteContent[slot]
  } else {
    store.siteContent[slot] = trimmed
  }
  await writeStore(store)
}

export async function getRequestsForGathering(gatheringId: string): Promise<ClubhouseGatheringRequest[]> {
  const store = await readStore()
  return store.clubhouseGatheringRequests.filter(r => r.gatheringId === gatheringId)
}

export async function updateClubhouseGatheringRequestStatus(
  requestId: string,
  status: ClubhouseGatheringRequest['status'],
): Promise<ClubhouseGatheringRequest | null> {
  const store = await readStore()
  const idx = store.clubhouseGatheringRequests.findIndex(r => r.id === requestId)
  if (idx === -1) return null
  const now = new Date().toISOString()
  store.clubhouseGatheringRequests[idx] = {
    ...store.clubhouseGatheringRequests[idx],
    status,
    respondedAt: status !== 'requested' ? now : store.clubhouseGatheringRequests[idx].respondedAt,
    updatedAt: now,
  }
  await writeStore(store)
  return store.clubhouseGatheringRequests[idx]
}

// ── Profile Claim Requests ────────────────────────────────────────────────────

export async function createProfileClaimRequest(input: {
  teamId: string
  memberId: string
  personId?: string
  requesterName: string
  requesterEmail: string
  requesterAccountId?: string
  pennGolfYears?: string
  note?: string
}): Promise<ClubhouseProfileClaimRequest> {
  const store = await readStore()
  const now = new Date().toISOString()
  const claim: ClubhouseProfileClaimRequest = {
    id: crypto.randomUUID(),
    teamId: input.teamId,
    memberId: input.memberId,
    personId: input.personId,
    requesterName: input.requesterName.trim(),
    requesterEmail: input.requesterEmail.trim().toLowerCase(),
    requesterAccountId: input.requesterAccountId,
    pennGolfYears: input.pennGolfYears?.trim() || undefined,
    note: input.note?.trim() || undefined,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  store.profileClaimRequests.push(claim)
  await writeStore(store)
  return claim
}

export async function getProfileClaimRequestById(
  id: string,
): Promise<ClubhouseProfileClaimRequest | undefined> {
  const store = await readStore()
  return store.profileClaimRequests.find(r => r.id === id)
}

export async function getProfileClaimRequestsForTeam(
  teamId: string,
): Promise<ClubhouseProfileClaimRequest[]> {
  const store = await readStore()
  return store.profileClaimRequests.filter(r => r.teamId === teamId)
}

export async function updateProfileClaimRequestStatus(
  id: string,
  status: ClubhouseProfileClaimRequest['status'],
): Promise<ClubhouseProfileClaimRequest | null> {
  return mutateStore(store => {
  const idx = store.profileClaimRequests.findIndex(r => r.id === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  store.profileClaimRequests[idx] = {
    ...store.profileClaimRequests[idx],
    status,
    respondedAt: now,
    updatedAt: now,
  }
  if (status === 'approved') {
    const claim = store.profileClaimRequests[idx]
    const memberIdx = store.teamMemberships.findIndex(
      m => m.personId === claim.memberId && m.teamId === claim.teamId,
    )
    if (memberIdx !== -1) {
      store.teamMemberships[memberIdx] = {
        ...store.teamMemberships[memberIdx],
        memberStatus: 'verified',
        updatedAt: now,
      }
    }
  }
  return store.profileClaimRequests[idx]
  })
}

// ── Accounts (Google sign-in) ────────────────────────────────────────────────

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  const store = await readStore()
  return store.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())
}

export async function getAccountByGoogleSub(googleSub: string): Promise<Account | undefined> {
  const store = await readStore()
  return store.accounts.find((a) => a.googleSub === googleSub)
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const store = await readStore()
  return store.accounts.find((a) => a.id === id)
}

export async function upsertAccount(input: {
  email: string
  googleSub: string
  name?: string
  image?: string
  teamId: string
}): Promise<Account> {
  const store = await readStore()
  const now = new Date().toISOString()
  const idx = store.accounts.findIndex((a) => a.googleSub === input.googleSub)
  if (idx !== -1) {
    store.accounts[idx] = {
      ...store.accounts[idx],
      email: input.email,
      name: input.name ?? store.accounts[idx].name,
      image: input.image ?? store.accounts[idx].image,
      updatedAt: now,
    }
    await writeStore(store)
    return store.accounts[idx]
  }
  const account: Account = {
    id: crypto.randomUUID(),
    email: input.email,
    googleSub: input.googleSub,
    name: input.name,
    image: input.image,
    teamId: input.teamId,
    createdAt: now,
    updatedAt: now,
  }
  store.accounts.push(account)
  await writeStore(store)
  return account
}

/** Flip publishedToNetwork=true on every membership for this person on the
 * given team. Used by the captain claim-approval handler so parent/affiliate
 * memberships (which start unpublished) appear in lists after approval. */
export async function publishMembershipsForPerson(
  personId: string,
  teamId: string,
): Promise<void> {
  const store = await readStore()
  let touched = false
  for (let i = 0; i < store.teamMemberships.length; i++) {
    const m = store.teamMemberships[i]
    if (m.personId !== personId || m.teamId !== teamId) continue
    if (m.publishedToNetwork) continue
    store.teamMemberships[i] = {
      ...m,
      publishedToNetwork: true,
      publishedAt: new Date().toISOString(),
      publishedByRole: 'captain',
      updatedAt: new Date().toISOString(),
    }
    touched = true
  }
  if (touched) await writeStore(store)
}

export async function linkAccountToPerson(
  accountId: string,
  personId: string,
): Promise<Account | null> {
  const store = await readStore()
  // Disallow linking the same personId to two different accounts.
  const conflict = store.accounts.find(
    (a) => a.linkedPersonId === personId && a.id !== accountId,
  )
  if (conflict) return null
  const idx = store.accounts.findIndex((a) => a.id === accountId)
  if (idx === -1) return null
  store.accounts[idx] = {
    ...store.accounts[idx],
    linkedPersonId: personId,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return store.accounts[idx]
}

// ── Clubhouse Moments ────────────────────────────────────────────────────────

export async function getMomentsForTeam(
  teamId: string,
  opts: { includePending?: boolean } = {},
): Promise<ClubhouseMoment[]> {
  const store = await readStore()
  return store.moments
    .filter((m) => {
      if (m.teamId !== teamId) return false
      if (m.status === 'removed') return false
      if (m.status === 'pending' && !opts.includePending) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createMoment(input: {
  teamId: string
  postedByAccountId: string
  postedByPersonId?: string
  postedByName: string
  caption: string
  photoUrl: string
  mediaType?: 'image' | 'video'
  audience?: 'public' | 'locker-room'
  taggedPersonIds?: string[]
}): Promise<ClubhouseMoment> {
  const store = await readStore()
  const moment: ClubhouseMoment = {
    id: crypto.randomUUID(),
    teamId: input.teamId,
    postedByAccountId: input.postedByAccountId,
    postedByPersonId: input.postedByPersonId,
    postedByName: input.postedByName,
    caption: input.caption.trim(),
    photoUrl: input.photoUrl.trim(),
    mediaType: input.mediaType ?? 'image',
    audience: input.audience ?? 'public',
    taggedPersonIds: input.taggedPersonIds ?? [],
    status: 'published',
    createdAt: new Date().toISOString(),
  }
  store.moments.unshift(moment)
  await writeStore(store)
  return moment
}

/**
 * Toggle the "Captain's Pick" featured flag on a Moment. Reversible: calling
 * again clears it. Returns the updated Moment, or null if not found.
 * Gated at the API layer by requireCaptain — this function does no auth check.
 */
export async function toggleMomentFeatured(
  momentId: string,
  byName: string,
): Promise<ClubhouseMoment | null> {
  return mutateStore(store => {
    const idx = store.moments.findIndex(m => m.id === momentId)
    if (idx === -1) return null
    const current = store.moments[idx]
    if (current.featuredAt) {
      // Unfeature
      store.moments[idx] = { ...current, featuredAt: undefined, featuredByName: undefined }
    } else {
      // Feature
      store.moments[idx] = {
        ...current,
        featuredAt: new Date().toISOString(),
        featuredByName: byName,
      }
    }
    return store.moments[idx]
  })
}

export async function deleteMoment(
  momentId: string,
  byAccountId: string,
): Promise<boolean> {
  // Only the poster can soft-delete their own moment (admin removal is a
  // separate path that doesn't go through this fn).
  const store = await readStore()
  const idx = store.moments.findIndex((m) => m.id === momentId)
  if (idx === -1) return false
  if (store.moments[idx].postedByAccountId !== byAccountId) return false
  store.moments[idx] = { ...store.moments[idx], status: 'removed' }
  await writeStore(store)
  return true
}

// ── Moment Comments ─────────────────────────────────────────────────────────

export async function getCommentsForMoment(
  momentId: string,
): Promise<MomentComment[]> {
  const store = await readStore()
  return store.momentComments
    .filter(c => c.momentId === momentId && c.status === 'published')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createMomentComment(input: {
  momentId: string
  teamId: string
  fromAccountId: string
  fromPersonId?: string
  fromName: string
  body: string
  parentCommentId?: string
}): Promise<MomentComment> {
  const store = await readStore()
  // Flatten: a reply to a reply re-anchors to the original top-level
  // parent so the tree never gets deeper than one level.
  let parentId = input.parentCommentId
  if (parentId) {
    const parent = store.momentComments.find(c => c.id === parentId)
    if (parent?.parentCommentId) parentId = parent.parentCommentId
  }
  const comment: MomentComment = {
    id: `mcm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    momentId: input.momentId,
    teamId: input.teamId,
    fromAccountId: input.fromAccountId,
    fromPersonId: input.fromPersonId,
    fromName: input.fromName,
    body: input.body,
    parentCommentId: parentId,
    status: 'published',
    createdAt: new Date().toISOString(),
  }
  store.momentComments.push(comment)
  await writeStore(store)
  return comment
}

export async function deleteMomentComment(
  commentId: string,
  byAccountId: string,
): Promise<boolean> {
  const store = await readStore()
  const idx = store.momentComments.findIndex(c => c.id === commentId)
  if (idx === -1) return false
  if (store.momentComments[idx].fromAccountId !== byAccountId) return false
  store.momentComments[idx] = { ...store.momentComments[idx], status: 'removed' }
  await writeStore(store)
  return true
}

// ── Moment Reactions ────────────────────────────────────────────────────────

export async function getReactionsForMoment(
  momentId: string,
): Promise<MomentReaction[]> {
  const store = await readStore()
  return store.momentReactions.filter(r => r.momentId === momentId)
}

/**
 * Toggle a reaction: if the (account, moment, emoji) tuple exists, remove
 * it; otherwise create it. Returns { reaction, removed } so the caller
 * can update the UI without a second round-trip.
 */
export async function toggleMomentReaction(input: {
  momentId: string
  teamId: string
  fromAccountId: string
  emoji: string
}): Promise<{ reaction: MomentReaction | null; removed: boolean }> {
  return mutateStore(store => {
  const existingIdx = store.momentReactions.findIndex(
    r =>
      r.momentId === input.momentId &&
      r.fromAccountId === input.fromAccountId &&
      r.emoji === input.emoji,
  )
  if (existingIdx !== -1) {
    store.momentReactions.splice(existingIdx, 1)
    return { reaction: null, removed: true }
  }
  const reaction: MomentReaction = {
    id: `mrx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    momentId: input.momentId,
    teamId: input.teamId,
    fromAccountId: input.fromAccountId,
    emoji: input.emoji,
    createdAt: new Date().toISOString(),
  }
  store.momentReactions.push(reaction)
  return { reaction, removed: false }
  })
}

export async function unlinkAccount(accountId: string): Promise<Account | null> {
  const store = await readStore()
  const idx = store.accounts.findIndex((a) => a.id === accountId)
  if (idx === -1) return null
  store.accounts[idx] = {
    ...store.accounts[idx],
    linkedPersonId: undefined,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return store.accounts[idx]
}

// ── Open Requests ─────────────────────────────────────────────────────────────
//
// Member-posted "I'm in town and want to play / grab coffee" notes.
// Auto-closing happens implicitly via tripIsActive — we hide rows whose
// endDate is in the past from the read paths. Rows persist so the member
// can see them in "Your Requests" and reopen by clearing endDate.

function openRequestIsLive(req: Pick<OpenRequest, 'status' | 'endDate'>): boolean {
  if (req.status !== 'open') return false
  if (req.endDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (req.endDate < today) return false
  }
  return true
}

export async function getOpenRequestsForTeam(
  teamId: string,
  intents?: OpenRequestIntent[],
): Promise<OpenRequest[]> {
  const store = await readStore()
  const intentSet = intents ? new Set(intents) : null
  return store.openRequests
    .filter(r => r.teamId === teamId && openRequestIsLive(r))
    .filter(r => (intentSet ? intentSet.has(r.intent) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getOpenRequestsForAccount(
  accountId: string,
): Promise<OpenRequest[]> {
  const store = await readStore()
  return store.openRequests
    .filter(r => r.fromAccountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createOpenRequest(input: {
  teamId: string
  fromAccountId: string
  fromPersonId?: string
  fromName: string
  intent: OpenRequestIntent
  city?: string
  state?: string
  startDate?: string
  endDate?: string
  note: string
  guestFeesOffered?: boolean
}): Promise<OpenRequest> {
  const store = await readStore()
  const now = new Date().toISOString()
  const req: OpenRequest = {
    id: `orq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    teamId: input.teamId,
    fromAccountId: input.fromAccountId,
    fromPersonId: input.fromPersonId,
    fromName: input.fromName,
    intent: input.intent,
    city: input.city,
    state: input.state,
    startDate: input.startDate,
    endDate: input.endDate,
    note: input.note,
    guestFeesOffered: input.guestFeesOffered === true,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
  store.openRequests.unshift(req)
  await writeStore(store)
  return req
}

export async function closeOpenRequest(
  id: string,
  byAccountId: string,
): Promise<boolean> {
  const store = await readStore()
  const idx = store.openRequests.findIndex(r => r.id === id)
  if (idx === -1) return false
  if (store.openRequests[idx].fromAccountId !== byAccountId) return false
  store.openRequests[idx] = {
    ...store.openRequests[idx],
    status: 'closed',
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return true
}

// ── Career Posts (Asks & Offers) ──────────────────────────────────────────────

export async function createCareerPost(
  input: Omit<CareerPost, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CareerPost> {
  const store = await readStore()
  const now = new Date().toISOString()
  const post: CareerPost = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  }
  store.careerPosts.push(post)
  await writeStore(store)
  return post
}

export async function getCareerPostsForTeam(teamId: string): Promise<CareerPost[]> {
  const store = await readStore()
  return store.careerPosts
    .filter((p) => p.teamId === teamId && p.status === 'open')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateCareerPost(
  id: string,
  patch: Partial<Omit<CareerPost, 'id' | 'teamId' | 'createdAt'>>,
): Promise<CareerPost | null> {
  const store = await readStore()
  const idx = store.careerPosts.findIndex((p) => p.id === id)
  if (idx === -1) return null
  store.careerPosts[idx] = {
    ...store.careerPosts[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
  return store.careerPosts[idx]
}

// ── Team News (Penn Athletics ingestion) ──────────────────────────────────────

export async function upsertTeamNewsItems(
  teamId: string,
  items: Array<Omit<TeamNewsItem, 'id' | 'teamId' | 'fetchedAt'>>,
): Promise<{ added: number; updated: number; total: number }> {
  const store = await readStore()
  const existingByUrl = new Map(
    store.teamNewsItems
      .map((i, idx) => ({ i, idx }))
      .filter(({ i }) => i.teamId === teamId)
      .map(({ i, idx }) => [i.sourceUrl, idx] as const),
  )
  const now = new Date().toISOString()
  let added = 0
  let updated = 0
  for (const item of items) {
    if (!item.sourceUrl || !item.title) continue
    const existingIdx = existingByUrl.get(item.sourceUrl)
    if (existingIdx !== undefined) {
      // Refresh title / summary / imageUrl in case the parser produced
      // a better value (e.g. we previously stored an HTML-entity-encoded
      // URL). Don't touch fetchedAt or id.
      const prev = store.teamNewsItems[existingIdx]
      if (
        prev.title !== item.title ||
        prev.summary !== item.summary ||
        prev.imageUrl !== item.imageUrl ||
        prev.publishedAt !== item.publishedAt
      ) {
        store.teamNewsItems[existingIdx] = {
          ...prev,
          title: item.title,
          summary: item.summary,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt ?? prev.publishedAt,
        }
        updated++
      }
      continue
    }
    store.teamNewsItems.push({
      id: crypto.randomUUID(),
      teamId,
      sourceUrl: item.sourceUrl,
      title: item.title,
      summary: item.summary,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt,
      fetchedAt: now,
    })
    added++
  }
  if (added > 0 || updated > 0) await writeStore(store)
  const total = store.teamNewsItems.filter(i => i.teamId === teamId).length
  return { added, updated, total }
}

export async function getRecentTeamNewsItems(
  teamId: string,
  limit = 8,
): Promise<TeamNewsItem[]> {
  const store = await readStore()
  return store.teamNewsItems
    .filter(i => i.teamId === teamId)
    .sort((a, b) => {
      const aTs = a.publishedAt ?? a.fetchedAt
      const bTs = b.publishedAt ?? b.fetchedAt
      return bTs.localeCompare(aTs)
    })
    .slice(0, limit)
}

// ── Digest send tracking ──────────────────────────────────────────────────────

export async function getAllLinkedAccountsForTeam(teamId: string): Promise<Account[]> {
  const store = await readStore()
  return store.accounts.filter(a => a.teamId === teamId && a.linkedPersonId)
}

/**
 * Founder-only role override updater. Writes manualCaptain + manualBadges
 * on the Account row; getBadgesForAccount() picks them up automatically.
 * Returns the patched account or null if not found.
 */
export async function updateAccountRoles(
  accountId: string,
  patch: {
    manualCaptain?: boolean
    manualBadges?: ('founding-member' | 'member' | 'parent')[]
  },
): Promise<Account | null> {
  const store = await readStore()
  const idx = store.accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return null
  const next: Account = { ...store.accounts[idx] }
  if (patch.manualCaptain !== undefined) {
    if (patch.manualCaptain === true) next.manualCaptain = true
    else delete next.manualCaptain
  }
  if (patch.manualBadges !== undefined) {
    // De-dup and validate ids defensively.
    const allowed = new Set(['founding-member', 'member', 'parent'])
    const cleaned = Array.from(
      new Set(patch.manualBadges.filter(b => allowed.has(b))),
    ) as ('founding-member' | 'member' | 'parent')[]
    if (cleaned.length === 0) delete next.manualBadges
    else next.manualBadges = cleaned
  }
  next.updatedAt = new Date().toISOString()
  store.accounts[idx] = next
  await writeStore(store)
  return next
}

export async function stampDigestSent(accountId: string): Promise<void> {
  const store = await readStore()
  const idx = store.accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return
  store.accounts[idx] = {
    ...store.accounts[idx],
    lastDigestSentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
}

// ── Chat ──────────────────────────────────────────────────────────────────────

/** Sort + JSON-encode a member set for direct-chat dedupe. */
function memberSetKey(ids: string[]): string {
  return [...ids].sort().join('|')
}

export async function createChatConversation(input: {
  teamId: string
  type: 'direct' | 'group'
  name?: string
  memberAccountIds: string[]
  createdByAccountId: string
}): Promise<ChatConversation> {
  const store = await readStore()
  const now = new Date().toISOString()

  // Idempotent direct: return existing thread for the same exact 2-member set.
  if (input.type === 'direct') {
    const wantKey = memberSetKey(input.memberAccountIds)
    const existing = store.chatConversations.find(
      c =>
        c.teamId === input.teamId &&
        c.type === 'direct' &&
        c.memberAccountIds.length === input.memberAccountIds.length &&
        memberSetKey(c.memberAccountIds) === wantKey,
    )
    if (existing) return existing
  }

  const convo: ChatConversation = {
    id: crypto.randomUUID(),
    teamId: input.teamId,
    type: input.type,
    name: input.name?.trim() || undefined,
    memberAccountIds: input.memberAccountIds,
    createdByAccountId: input.createdByAccountId,
    lastMessageAt: now,
    createdAt: now,
  }
  store.chatConversations.push(convo)
  await writeStore(store)
  return convo
}

export async function listChatConversationsForAccount(
  accountId: string,
  teamId: string,
): Promise<ChatConversation[]> {
  const store = await readStore()
  return store.chatConversations
    .filter(c => c.teamId === teamId && c.memberAccountIds.includes(accountId))
    .sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt))
}

export async function getChatConversationById(
  id: string,
): Promise<ChatConversation | undefined> {
  const store = await readStore()
  return store.chatConversations.find(c => c.id === id)
}

export async function listChatMessages(
  conversationId: string,
  since?: string,
  limit = 100,
): Promise<ChatMessage[]> {
  const store = await readStore()
  let msgs = store.chatMessages.filter(m => m.conversationId === conversationId)
  if (since) msgs = msgs.filter(m => m.createdAt > since)
  msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  if (msgs.length > limit) msgs = msgs.slice(msgs.length - limit)
  return msgs
}

export async function createChatMessage(input: {
  conversationId: string
  teamId: string
  fromAccountId: string
  fromName: string
  body: string
}): Promise<ChatMessage | null> {
  const store = await readStore()
  const convoIdx = store.chatConversations.findIndex(c => c.id === input.conversationId)
  if (convoIdx === -1) return null
  const now = new Date().toISOString()
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId: input.conversationId,
    teamId: input.teamId,
    fromAccountId: input.fromAccountId,
    fromName: input.fromName,
    body: input.body,
    createdAt: now,
    // Sender has read their own message by definition.
    readByAccountIds: [input.fromAccountId],
  }
  store.chatMessages.push(msg)
  // Bump parent in the same write so list-sort by activity stays consistent.
  store.chatConversations[convoIdx] = {
    ...store.chatConversations[convoIdx],
    lastMessageAt: now,
  }
  await writeStore(store)
  return msg
}

export async function markChatConversationRead(
  conversationId: string,
  accountId: string,
): Promise<void> {
  const store = await readStore()
  let dirty = false
  for (let i = 0; i < store.chatMessages.length; i++) {
    const m = store.chatMessages[i]
    if (m.conversationId !== conversationId) continue
    if (m.readByAccountIds.includes(accountId)) continue
    store.chatMessages[i] = {
      ...m,
      readByAccountIds: [...m.readByAccountIds, accountId],
    }
    dirty = true
  }
  if (dirty) await writeStore(store)
}

// ── Billing (Stripe) ──────────────────────────────────────────────────────────

export async function setAccountStripeCustomerId(
  accountId: string,
  stripeCustomerId: string,
): Promise<void> {
  const store = await readStore()
  const idx = store.accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return
  if (store.accounts[idx].stripeCustomerId === stripeCustomerId) return
  store.accounts[idx] = {
    ...store.accounts[idx],
    stripeCustomerId,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
}

export async function getAccountByStripeCustomerId(
  stripeCustomerId: string,
): Promise<Account | undefined> {
  const store = await readStore()
  return store.accounts.find(a => a.stripeCustomerId === stripeCustomerId)
}

export async function updateAccountSubscription(
  accountId: string,
  subscription: NonNullable<Account['subscription']> | null,
): Promise<void> {
  const store = await readStore()
  const idx = store.accounts.findIndex(a => a.id === accountId)
  if (idx === -1) return
  store.accounts[idx] = {
    ...store.accounts[idx],
    subscription: subscription ?? undefined,
    updatedAt: new Date().toISOString(),
  }
  await writeStore(store)
}

export async function recordDonation(
  input: Omit<Donation, 'id' | 'createdAt'>,
): Promise<Donation> {
  const store = await readStore()
  // Idempotent on stripeCheckoutSessionId so retried webhooks don't double-count.
  const existing = store.donations.find(
    d => d.stripeCheckoutSessionId === input.stripeCheckoutSessionId,
  )
  if (existing) return existing
  const donation: Donation = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  store.donations.push(donation)
  await writeStore(store)
  return donation
}

export async function listRecentDonations(
  teamId: string,
  limit = 20,
): Promise<Donation[]> {
  const store = await readStore()
  return store.donations
    .filter(d => d.teamId === teamId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function getDonationTotalForTeam(teamId: string): Promise<{
  count: number
  totalCents: number
  recurringCount: number
}> {
  const store = await readStore()
  const donations = store.donations.filter(d => d.teamId === teamId)
  const totalCents = donations.reduce((s, d) => s + d.amountCents, 0)
  const recurringCount = store.accounts.filter(
    a => a.teamId === teamId && a.subscription?.status === 'active',
  ).length
  return {
    count: donations.length,
    totalCents,
    recurringCount,
  }
}

// ── Notifications (in-app bell) ────────────────────────────────────────────────
//
// One JSON blob holds everyone's notifications, so every account is capped to
// the newest N rows on write. All writes go through mutateStore (the
// optimistic-concurrency path) because the bell is a concurrent surface:
// a member can be reading their notifications while a broadcast lands.

/** Max notifications retained per account. Older rows are dropped on insert. */
const NOTIFICATIONS_PER_ACCOUNT_CAP = 50

/**
 * Append a notification for one recipient, then trim that account back to the
 * newest NOTIFICATIONS_PER_ACCOUNT_CAP rows. Returns the created row.
 */
export async function addNotification(input: {
  accountId: string
  type: AppNotification['type']
  title: string
  body: string
  href?: string
}): Promise<AppNotification> {
  const now = new Date().toISOString()
  const notification: AppNotification = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    accountId: input.accountId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: now,
  }
  return mutateStore(store => {
    store.notifications.push(notification)
    // Trim this account to the newest CAP rows (keep other accounts intact).
    const mine = store.notifications
      .filter(n => n.accountId === input.accountId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (mine.length > NOTIFICATIONS_PER_ACCOUNT_CAP) {
      const keep = new Set(mine.slice(0, NOTIFICATIONS_PER_ACCOUNT_CAP).map(n => n.id))
      store.notifications = store.notifications.filter(
        n => n.accountId !== input.accountId || keep.has(n.id),
      )
    }
    return notification
  })
}

/** A recipient's notifications, newest first, plus an unread count. */
export async function getNotificationsForAccount(
  accountId: string,
  limit = NOTIFICATIONS_PER_ACCOUNT_CAP,
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const store = await readStore()
  const mine = store.notifications
    .filter(n => n.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unreadCount = mine.filter(n => !n.readAt).length
  return { notifications: mine.slice(0, limit), unreadCount }
}

/**
 * Mark one notification (by id) or ALL of this account's notifications read.
 * Strictly scoped: a caller can never mark another account's rows read —
 * the id path also checks ownership. Returns how many rows were updated.
 */
export async function markNotificationsRead(
  accountId: string,
  opts: { id?: string; all?: boolean },
): Promise<number> {
  const now = new Date().toISOString()
  return mutateStore(store => {
    let updated = 0
    for (let i = 0; i < store.notifications.length; i++) {
      const n = store.notifications[i]
      if (n.accountId !== accountId) continue
      if (!opts.all && n.id !== opts.id) continue
      if (n.readAt) continue
      store.notifications[i] = { ...n, readAt: now }
      updated++
    }
    return updated
  })
}

// ── Push subscriptions (Web Push) ──────────────────────────────────────────────

/** All push subscriptions for an account (one per installed device/browser). */
export async function getPushSubscriptionsForAccount(
  accountId: string,
): Promise<PushSubscriptionRecord[]> {
  const store = await readStore()
  return store.pushSubscriptions.filter(s => s.accountId === accountId)
}

/**
 * Store a push subscription for an account, deduped by endpoint. If the same
 * endpoint already exists we refresh its keys + owner rather than adding a
 * second row (the same browser re-subscribing after a key rotation).
 */
export async function addPushSubscription(input: {
  accountId: string
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<PushSubscriptionRecord> {
  const now = new Date().toISOString()
  return mutateStore(store => {
    const idx = store.pushSubscriptions.findIndex(s => s.endpoint === input.endpoint)
    if (idx !== -1) {
      store.pushSubscriptions[idx] = {
        ...store.pushSubscriptions[idx],
        accountId: input.accountId,
        keys: input.keys,
      }
      return store.pushSubscriptions[idx]
    }
    const record: PushSubscriptionRecord = {
      id: `psub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      accountId: input.accountId,
      endpoint: input.endpoint,
      keys: input.keys,
      createdAt: now,
    }
    store.pushSubscriptions.push(record)
    return record
  })
}

/**
 * Remove a push subscription by endpoint. Scoped to the caller's account so a
 * member can't delete someone else's subscription. Returns true if removed.
 */
export async function removePushSubscription(
  accountId: string,
  endpoint: string,
): Promise<boolean> {
  return mutateStore(store => {
    const before = store.pushSubscriptions.length
    store.pushSubscriptions = store.pushSubscriptions.filter(
      s => !(s.accountId === accountId && s.endpoint === endpoint),
    )
    return store.pushSubscriptions.length < before
  })
}

/**
 * Prune dead subscriptions by endpoint, regardless of owner. Called when a
 * push send returns 404/410 (Gone) — the subscription no longer exists at the
 * push service, so we drop it everywhere.
 */
export async function prunePushSubscriptionsByEndpoints(
  endpoints: string[],
): Promise<number> {
  if (endpoints.length === 0) return 0
  const dead = new Set(endpoints)
  return mutateStore(store => {
    const before = store.pushSubscriptions.length
    store.pushSubscriptions = store.pushSubscriptions.filter(s => !dead.has(s.endpoint))
    return before - store.pushSubscriptions.length
  })
}

// ── Idea Submissions ──────────────────────────────────────────────────────────

const IDEA_SUBMISSIONS_CAP = 200

/**
 * Record an idea submitted via /suggest. Capped to the newest 200 rows
 * (oldest are dropped on write to keep the single JSON blob bounded).
 * Uses mutateStore for safe concurrent writes.
 */
export async function addIdeaSubmission(input: {
  accountId?: string
  name: string
  email?: string
  message: string
}): Promise<IdeaSubmission> {
  const now = new Date().toISOString()
  const submission: IdeaSubmission = {
    id: `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    accountId: input.accountId,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    message: input.message.trim(),
    createdAt: now,
  }
  return mutateStore(store => {
    store.ideaSubmissions.unshift(submission)
    if (store.ideaSubmissions.length > IDEA_SUBMISSIONS_CAP) {
      store.ideaSubmissions = store.ideaSubmissions.slice(0, IDEA_SUBMISSIONS_CAP)
    }
    return submission
  })
}

// ── Team Questions ─────────────────────────────────────────────────────────────

const TEAM_QUESTIONS_CAP = 500

/**
 * Record a question from an approved member to the current team.
 * Capped to the newest 500 rows. Uses mutateStore.
 */
export async function addTeamQuestion(input: {
  askerAccountId: string
  askerName: string
  askerGradYear?: string
  question: string
  targets?: { personId: string; name: string }[]
}): Promise<TeamQuestion> {
  const now = new Date().toISOString()
  const q: TeamQuestion = {
    id: `tq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    askerAccountId: input.askerAccountId,
    askerName: input.askerName.trim(),
    askerGradYear: input.askerGradYear?.trim() || undefined,
    question: input.question.trim(),
    targets: input.targets && input.targets.length > 0 ? input.targets : undefined,
    createdAt: now,
    status: 'open',
    answers: [],
  }
  return mutateStore(store => {
    store.teamQuestions.unshift(q)
    if (store.teamQuestions.length > TEAM_QUESTIONS_CAP) {
      store.teamQuestions = store.teamQuestions.slice(0, TEAM_QUESTIONS_CAP)
    }
    return q
  })
}

/**
 * Append an answer to an existing question and mark it answered.
 * Returns null if the question is not found.
 */
export async function addTeamQuestionAnswer(
  questionId: string,
  input: {
    responderAccountId: string
    responderName: string
    body: string
  },
): Promise<TeamQuestion | null> {
  const now = new Date().toISOString()
  const answer: TeamQuestionAnswer = {
    id: `tqa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    responderAccountId: input.responderAccountId,
    responderName: input.responderName.trim(),
    body: input.body.trim(),
    createdAt: now,
  }
  return mutateStore(store => {
    const idx = store.teamQuestions.findIndex(q => q.id === questionId)
    if (idx === -1) return null
    store.teamQuestions[idx] = {
      ...store.teamQuestions[idx],
      status: 'answered',
      answers: [...store.teamQuestions[idx].answers, answer],
    }
    return store.teamQuestions[idx]
  })
}

/**
 * Set the answersTeamQuestions opt-in/out flag on an account.
 * undefined and true both mean opted-in; false means opted-out.
 */
export async function setAnswersTeamQuestions(
  accountId: string,
  value: boolean,
): Promise<Account | null> {
  return mutateStore(store => {
    const idx = store.accounts.findIndex(a => a.id === accountId)
    if (idx === -1) return null
    const next: Account = { ...store.accounts[idx] }
    if (value) delete next.answersTeamQuestions
    else next.answersTeamQuestions = false
    next.updatedAt = new Date().toISOString()
    store.accounts[idx] = next
    return next
  })
}

/**
 * Set whether an account follows the current team (new season updates notify
 * followers). undefined and true both mean following; false means unfollowed.
 */
export async function setFollowsTeam(
  accountId: string,
  value: boolean,
): Promise<Account | null> {
  return mutateStore(store => {
    const idx = store.accounts.findIndex(a => a.id === accountId)
    if (idx === -1) return null
    const next: Account = { ...store.accounts[idx] }
    if (value) delete next.followsTeam
    else next.followsTeam = false
    next.updatedAt = new Date().toISOString()
    store.accounts[idx] = next
    return next
  })
}

const ALUMNI_SPOTLIGHTS_CAP = 200
const SPOTLIGHT_NOMINATIONS_CAP = 200

/** Feature an alum as the spotlight. Newest first, capped. */
export async function createSpotlight(input: {
  personId: string
  name: string
  headline?: string
  blurb: string
  featuredByAccountId: string
}): Promise<AlumniSpotlight> {
  const s: AlumniSpotlight = {
    id: `spot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    personId: input.personId,
    name: input.name.trim(),
    headline: input.headline?.trim() || undefined,
    blurb: input.blurb.trim(),
    featuredByAccountId: input.featuredByAccountId,
    featuredAt: new Date().toISOString(),
  }
  return mutateStore(store => {
    store.alumniSpotlights.unshift(s)
    if (store.alumniSpotlights.length > ALUMNI_SPOTLIGHTS_CAP) {
      store.alumniSpotlights = store.alumniSpotlights.slice(0, ALUMNI_SPOTLIGHTS_CAP)
    }
    return s
  })
}

/** All spotlights, newest first. */
export async function getSpotlights(): Promise<AlumniSpotlight[]> {
  const store = await readStore()
  return [...store.alumniSpotlights].sort((a, b) => b.featuredAt.localeCompare(a.featuredAt))
}

/** Record a member's nomination for who to spotlight next. Newest first, capped. */
export async function addSpotlightNomination(input: {
  nomineeName: string
  reason?: string
  byAccountId: string
  byName: string
}): Promise<SpotlightNomination> {
  const n: SpotlightNomination = {
    id: `snom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    nomineeName: input.nomineeName.trim(),
    reason: input.reason?.trim() || undefined,
    byAccountId: input.byAccountId,
    byName: input.byName.trim(),
    createdAt: new Date().toISOString(),
  }
  return mutateStore(store => {
    store.spotlightNominations.unshift(n)
    if (store.spotlightNominations.length > SPOTLIGHT_NOMINATIONS_CAP) {
      store.spotlightNominations = store.spotlightNominations.slice(0, SPOTLIGHT_NOMINATIONS_CAP)
    }
    return n
  })
}

const TRAVEL_STOPS_CAP = 100
const HOST_OFFERS_CAP = 500

/** Founder posts a team travel stop. Newest-created first, capped. */
export async function createTravelStop(input: {
  teamId: string
  eventName: string
  locationText: string
  startDate: string
  endDate?: string
  note?: string
}): Promise<TeamTravelStop> {
  const stop: TeamTravelStop = {
    id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    teamId: input.teamId,
    eventName: input.eventName.trim(),
    locationText: input.locationText.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  return mutateStore(store => {
    store.teamTravelStops.unshift(stop)
    if (store.teamTravelStops.length > TRAVEL_STOPS_CAP) {
      store.teamTravelStops = store.teamTravelStops.slice(0, TRAVEL_STOPS_CAP)
    }
    return stop
  })
}

/** All travel stops for a team (newest-created first). */
export async function getTravelStops(teamId: string): Promise<TeamTravelStop[]> {
  const store = await readStore()
  return store.teamTravelStops.filter(s => s.teamId === teamId)
}

/** Delete a travel stop and any host offers attached to it. */
export async function deleteTravelStop(id: string): Promise<boolean> {
  return mutateStore(store => {
    const before = store.teamTravelStops.length
    store.teamTravelStops = store.teamTravelStops.filter(s => s.id !== id)
    store.travelHostOffers = store.travelHostOffers.filter(o => o.travelStopId !== id)
    return store.teamTravelStops.length < before
  })
}

/** An alum offers to host the team at a stop. Returns null if the stop is gone. */
export async function addTravelHostOffer(input: {
  travelStopId: string
  byAccountId: string
  byName: string
  byLocation?: string
  message?: string
}): Promise<TravelHostOffer | null> {
  const offer: TravelHostOffer = {
    id: `host_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    travelStopId: input.travelStopId,
    byAccountId: input.byAccountId,
    byName: input.byName.trim(),
    byLocation: input.byLocation?.trim() || undefined,
    message: input.message?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  return mutateStore(store => {
    if (!store.teamTravelStops.some(s => s.id === input.travelStopId)) return null
    store.travelHostOffers.unshift(offer)
    if (store.travelHostOffers.length > HOST_OFFERS_CAP) {
      store.travelHostOffers = store.travelHostOffers.slice(0, HOST_OFFERS_CAP)
    }
    return offer
  })
}

/** Host offers for a given travel stop (newest first). */
export async function getHostOffersForStop(travelStopId: string): Promise<TravelHostOffer[]> {
  const store = await readStore()
  return store.travelHostOffers.filter(o => o.travelStopId === travelStopId)
}

/** Flip the community-updates mute on an account. Returns the patched row. */
export async function setMutedCommunityNotifications(
  accountId: string,
  muted: boolean,
): Promise<Account | null> {
  return mutateStore(store => {
    const idx = store.accounts.findIndex(a => a.id === accountId)
    if (idx === -1) return null
    const next: Account = { ...store.accounts[idx] }
    if (muted) next.mutedCommunityNotifications = true
    else delete next.mutedCommunityNotifications
    next.updatedAt = new Date().toISOString()
    store.accounts[idx] = next
    return next
  })
}
