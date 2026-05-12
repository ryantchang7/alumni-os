# Alumni OS — Product Roadmap

## What Is Built (Phase 1 + 1.5)

### Phase 1 — Mock Demo (Complete)
- Full Next.js 16 App Router project with TypeScript and Tailwind v4
- 10 fictionalized alumni profiles with rich mock data
- Routes: /, /teams/penn-mens-golf, /teams/penn-mens-golf/search, /teams/penn-mens-golf/alumni/[id], /teams/penn-mens-golf/outreach/[id], /teams/penn-mens-golf/agent, /teams/penn-mens-golf/review, /teams/penn-mens-golf/scraper, /teams/new
- 21 custom components + 15 shadcn/ui components
- Premium design system: Penn Athletic Clubhouse aesthetic
- Animated pipeline reveal, agent finding feed, stat count-ups

### Phase 1.5 — Clean Product Structure (Complete)
- /login — Mock login with 4 demo user cards
- /app — Product home with mode selection
- /builder, /builder/new, /builder/run, /builder/review, /builder/graph — Builder flow
- /player, /player/search, /player/alumni/[id], /player/outreach/[id], /player/relationships — Player flow
- /review, /review/candidates, /review/sources — Review flow
- Updated NavBar with clear mode navigation

### Phase 2 — Real Discovery Preview Kernel (Complete)
- /api/discovery/preview — POST endpoint that fetches a public team website and returns discovered pages + roster extraction preview
- /builder/discovery — Real discovery preview UI using the API
- src/lib/scraping/ — Scraping library: types, guards, normalize-url, fetch-page, classify-page, discover-team-pages, extract-roster
- No data persistence. Public pages only. Human review required.

## What Is Still Mock
- All alumni profile data is fictionalized
- All scraper/pipeline output (discovered pages, crawled pages, roster entries) is static mock data
- Agent run is an animated demo, not a real pipeline
- Review queue items are mock, approve/reject buttons are UI-only
- Outreach drafts use static templates, not AI generation
- FilterSidebar filters are UI-only
- Login is mock, no real authentication

## Next Phases

### Phase 3 — Crawl Selected Pages
- After discovery preview, let user select roster pages to crawl
- POST /api/discovery/crawl?url=... to fetch and extract roster from a specific discovered page
- Show extracted roster entries before saving

### Phase 4 — Supabase Persistence
- Add Supabase project
- Schema: teams, discovery_runs, discovered_pages, roster_entries, normalized_people, identity_candidates, review_items
- Save discovery preview and crawl results
- No auth yet — team-scoped by URL slug

### Phase 5 — Normalize People
- Deduplicate roster entries across seasons into canonical person records
- Name normalization (nicknames, suffixes, middle names)
- Class year estimation from season coverage
- Source count per person

### Phase 6 — Profile Candidate Workflow
- Cross-reference normalized people against public sources (LinkedIn public profiles, company bios, news)
- Confidence scoring for identity matches
- Hold low-confidence matches in review queue

### Phase 7 — Auth and Team Access
- Supabase Auth: email magic link or Google OAuth
- Team-scoped access: builder, player, reviewer roles
- Invite system for current players and coaches

### Phase 8 — Alumni Claim / Edit / Opt-Out
- Alumni receive invite link
- Can claim profile, correct details, set relationship preferences
- Can hide contact info or opt out entirely
- Contact paths replace scraped data

### Phase 9 — Send to First Real Team
- Harden trust layer (robots.txt, rate limiting, source attribution)
- Coach and team captain onboarding flow
- Real outreach (email or LinkedIn) with full audit trail
- Penn Golf as first live deployment

## What Not to Build Yet
- Real email sending
- LinkedIn scraping or profile fetching
- AI API calls for name normalization or hook generation
- Multi-school production infrastructure
- Payments or subscription management
- Mobile app
