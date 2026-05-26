# Manual QA Guide

## Setup

```bash
cd ~/Desktop/alumni-os
npm run store:reset
npm run seed:penn-team
npm run dev
```

## Real Data Only Check

Run before any manual testing to verify no mock data has leaked into production routes:

```bash
npm run test:no-mock-leak
```

Expected: 1 passed, 0 failed — "No mock-data imports or fictional alumni names found in serious app routes."

Also verify manually:
```bash
grep -rn "mock-data" src/app/builder src/app/player src/app/teams/penn-mens-golf src/app/api --include="*.ts" --include="*.tsx"
```

Expected: no results.

## Builder Route Tests

### Team Workspace
http://localhost:3000/builder/workspace?teamSlug=penn-mens-golf

Expected: Header shows Penn Men's Golf team info. Recommended action panel appears. Checklist shows team-created as complete, others as missing/warning. Workflow cards link to all 6 steps. No mock alumni names.

### Roster Debugger
http://localhost:3000/builder/debug-roster?teamSlug=penn-mens-golf

Expected: Enter https://pennathletics.com/sports/mens-golf/roster and click Extract. Should find exactly 8 players. High confidence entries show green checkmarks. Save button saves to team and links to promote page. **seasonYear should now be auto-inferred (e.g. "2025-26") and visible on saved entries.**

### Historical Import
http://localhost:3000/builder/history?teamSlug=penn-mens-golf

Expected: Form shows roster URL. Click "Start Historical Import". Rows should update one at a time — never freeze on "pending". Failed seasons show "failed" with a note. When done, shows "Import complete" with 4 CTAs.

If a season fails: it shows as "failed" and the remaining seasons continue processing.

### Promote Entries
http://localhost:3000/builder/promote?teamSlug=penn-mens-golf

Expected: Shows all extracted entries. Promoted/rejected rows are disabled (no checkbox). "Select all high-confidence" button selects >=80% entries. Promote and reject work and update the table. Promoted rows cannot be rejected (already filtered).

### People & Sources
http://localhost:3000/builder/people?teamSlug=penn-mens-golf

Expected: Shows promoted people with class, hometown, high school, confidence. "Sources →" link in each row goes to the person detail page showing evidence. Only real Penn roster names after extraction.

### Graph Quality
http://localhost:3000/builder/quality?teamSlug=penn-mens-golf

Expected: Quality score 0-100 with color (green >=80, amber 60-79, red <60). Stats grid. Season coverage table. Duplicate candidates panel (empty if no duplicates). Incomplete records panel.

### Graph Output
http://localhost:3000/builder/graph?teamSlug=penn-mens-golf

Expected:
- **Before promotion**: Shows "No promoted people yet" empty state with links to Extract Roster, Promote Entries, Team Workspace. No mock alumni.
- **After promotion**: Shows real people table. Quality strip shows score with link to quality page. CTAs include promote, view people, quality.
- **Without teamSlug**: Shows "Choose a team to view the alumni graph." with link to workspace. No mock alumni.

## Player Route Tests

### Player Dashboard
http://localhost:3000/player

Expected:
- **Before promotion**: Shows "No alumni data yet" with links to workspace, debug-roster, promote.
- **After promotion**: Shows real alumni organized into sections (High Confidence, Needs Enrichment, All). Only real Penn roster names (Hayden Adams, Arjun Caprihan, Ryan Chang, Henry Chen, Max Fonseca, Owen Hayes, Wesley Hu, Kayden Wang). No fake company/career data.

### Player Search
http://localhost:3000/player/search

Expected:
- Search over real names, hometown, highSchool, classLabel.
- Filters: class label, status.
- Sort: Name A→Z, High Confidence First, Needs Enrichment First.
- Shows real count (e.g. "Showing 8 alumni").
- No mock alumni names, no "demo" filter tags.

### Player Alumni Profile
http://localhost:3000/player/alumni/{real-personId}

Expected: Shows real person data — name, Penn Golf years, class, hometown, highSchool, confidence, extracted evidence table, source URLs, missing fields notice. No fake career, company, LinkedIn, bio text. Draft Outreach button goes to outreach page.

### Player Outreach
http://localhost:3000/player/outreach/{real-personId}

Expected:
- **Before enrichment**: Amber notice "This draft uses only verified roster data." Templates use only real facts (name, Penn Golf years, hometown/highSchool if known). No fake companies, roles, LinkedIn URLs.
- **After verified enrichment**: Notice updates to "This draft can reference verified career details." Templates for career_advice and mentorship include role/company if verificationStatus is source_backed or manually_verified. Verified Facts sidebar shows career fields with verification pill.

### Player Relationships
http://localhost:3000/player/relationships

Expected: Shows real alumni count, enriched profiles count, and contacted/replied/met count. Info box explains enrichment layer. "Outreach Activity" panel lists alumni with contacted/replied/met status. No mock relationship cards.

## Manual Enrichment

### Flow
1. Extract current roster and promote all entries.
2. Open http://localhost:3000/builder/enrich?teamSlug=penn-mens-golf
   - Expected: List of promoted people with enrichment status (all "None" initially). Filter tabs work. Edit links present.
3. Click "Edit →" for Ryan Chang.
   - Expected: Two-column page with read-only "Roster facts" panel and editable enrichment form. Amber warning: "Only save facts you have verified or manually entered."
4. Fill in: Current Role = "Student Athlete", Current Company = "University of Pennsylvania", City = "Philadelphia", Verification Status = "Manually verified", add source URL.
5. Click Save.
   - Expected: "Saved!" flash appears. Data persists on page reload.
6. Return to /builder/enrich?teamSlug=penn-mens-golf.
   - Expected: Ryan Chang now shows "Student Athlete at University of Pennsylvania, Philadelphia" summary. Verification pill shows "Verified" (emerald).
7. Open http://localhost:3000/player/alumni/{ryanPersonId}
   - Expected: "Career & Contact" card appears with:
     - Emerald "Manually verified" pill
     - Current Role: Student Athlete
     - Current Company: University of Pennsylvania
     - Location: Philadelphia
     - "Add enrichment in Builder →" link
8. Open http://localhost:3000/player/outreach/{ryanPersonId}
   - Expected: Notice says "This draft can reference verified career details." Polished career_advice template references University of Pennsylvania. Verified Facts sidebar shows role/company.
9. Verify Hayden Adams profile (/player/alumni/{haydenPersonId}):
   - Expected: Shows "Roster-only profile — no career or contact enrichment yet."
10. Open http://localhost:3000/player/relationships
    - Expected: enrichedCount = 1, outreach activity panel shows Ryan if you've set relationshipStatus.

### API smoke tests for enrichment

```bash
# GET enrichment for Ryan (use real personId from profiles list)
curl -s "http://localhost:3000/api/alumni/enrichment?teamSlug=penn-mens-golf&personId={ryanPersonId}" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['enrichment'])"

# POST enrichment
curl -s -X POST "http://localhost:3000/api/alumni/enrichment" \
  -H "Content-Type: application/json" \
  -d '{"teamSlug":"penn-mens-golf","personId":"{ryanPersonId}","enrichment":{"currentRole":"Student Athlete","currentCompany":"University of Pennsylvania","verificationStatus":"manually_verified","sourceUrls":["https://pennathletics.com/sports/mens-golf/roster"]}}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['enrichment']['verificationStatus'])"

# GET profile — verify enrichment appears in profiles list
curl -s "http://localhost:3000/api/alumni/profiles?teamSlug=penn-mens-golf" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); ryan=[p for p in d['profiles'] if 'Ryan' in p['canonicalName']][0]; print(ryan.get('enrichmentStatus'), ryan.get('enrichment',{}).get('currentRole','—'))"
# Expected: verified Student Athlete
```

## Teams Route Tests

### Teams Dashboard
http://localhost:3000/teams/penn-mens-golf

Expected: Real stats (extracted entries, people promoted, seasons covered, quality score). Workflow links to builder pages. No fake alumni stats (alumniMapped, verifiedProfiles, openToGolf, etc.). No mock alumni names.

### Teams Search
http://localhost:3000/teams/penn-mens-golf/search

Expected: Redirects to /player/search.

### Teams Alumni Profile
http://localhost:3000/teams/penn-mens-golf/alumni/{id}

Expected: Redirects to /player/alumni/{id}.

### Teams Outreach
http://localhost:3000/teams/penn-mens-golf/outreach/{id}

Expected: Redirects to /player/outreach/{id}.

### Teams Agent/Review/Scraper (Legacy)
http://localhost:3000/teams/penn-mens-golf/agent
http://localhost:3000/teams/penn-mens-golf/review
http://localhost:3000/teams/penn-mens-golf/scraper

Expected: All show "Legacy Demo" amber notice with links to the real builder workflow. No mock pipeline data, no fictional alumni.

## API Smoke Tests

After reset + seed + extraction + promotion, verify:

```bash
# Should return 8 real profiles, no fake companies
curl -s "http://localhost:3000/api/alumni/profiles?teamSlug=penn-mens-golf" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(p['canonicalName'], p['status']) for p in d['profiles']]"

# Person detail — use a real personId from the profiles list
curl -s "http://localhost:3000/api/alumni/profiles/{personId}?teamSlug=penn-mens-golf" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['person']['canonicalName'], 'entries:', len(d['extractedEntries']))"

# Current roster extraction should set seasonYear automatically
curl -s -X POST "http://localhost:3000/api/scrape/roster-run" \
  -H "Content-Type: application/json" \
  -d '{"teamSlug":"penn-mens-golf","url":"https://pennathletics.com/sports/mens-golf/roster"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('seasonYear:', d['entries'][0]['seasonYear'])"
# Expected: seasonYear = "2025-26" (or current season)
```

## Automated Tests

```bash
# Full test suite (includes mock leak test + build)
npm run test:all

# Individual tests
npm run test:seasons       # 21 tests (includes inferSeasonFromTitle)
npm run test:roster
npm run test:pipeline
npm run test:historical-pipeline
npm run test:graph-quality
npm run test:demo-readiness
npm run test:enrichment    # enrichment pipeline tests
npm run test:no-mock-leak  # must pass: 0 violations

# Live roster test (network dependent — run separately)
npm run test:live-rosters

# Build check
npm run build

# Architecture boundary check (should only show API routes + server components)
grep -rn "from 'fs\|from \"fs\|fs/promises\|local-store" src/app --include="*.tsx" --include="*.ts"
```

## Post-Extraction Real Data Checklist

After running `npm run store:reset && npm run seed:penn-team && npm run dev`:

1. `GET /api/demo/readiness?teamSlug=penn-mens-golf`
   - people = 0, extractedEntries = 0, recommendedNextAction.id = "extract-roster"

2. `POST /api/scrape/roster-run` with penn-mens-golf URL
   - entries = 8 real names (Hayden Adams, Arjun Caprihan, Ryan Chang, Henry Chen, Max Fonseca, Owen Hayes, Wesley Hu, Kayden Wang)
   - **each entry has seasonYear set (e.g. "2025-26")**
   - no fictional names (no William Hartley, Carter Brennan, etc.)

3. `GET /api/roster/entries?teamSlug=penn-mens-golf`
   - 8 entries, all status "extracted", all with seasonYear

4. After promote: `GET /api/demo/readiness`
   - people = 8, seasonsWithEntries = 1, recommendedNextAction.id = "import-historical"

5. `GET /api/alumni/profiles?teamSlug=penn-mens-golf`
   - 8 profiles with real names only
   - no currentRole, no currentCompany, no industry (these are not in the real data)
   - missingFields populated where appropriate

6. Browser checks (no mock data visible anywhere):
   - /builder/workspace?teamSlug=penn-mens-golf — real stats
   - /player — real people or honest empty state
   - /player/search — real search results
   - /builder/graph?teamSlug=penn-mens-golf — real people or empty state (never mock alumni)
   - /teams/penn-mens-golf — real dashboard stats

## E2E Browser Testing (Playwright)

### Setup

```bash
npx playwright install chromium   # install browser once
npm run test:e2e                  # run full E2E suite (headless)
npm run test:e2e:ui               # interactive Playwright UI
npm run test:e2e:headed           # headed Chrome
npm run test:e2e:debug            # step-through debugger
```

The webServer is managed automatically — Playwright starts `npm run dev` and waits for port 3000 before running tests. Set `reuseExistingServer: true` means a running dev server will be reused.

### Demo Reset

Before any QA session that needs a clean slate:

```bash
npm run store:reset               # wipe data/alumni-os.json
npm run seed:penn-team            # create Penn Men's Golf team
npm run seed:demo-promoted        # promote Ryan Chang + Hayden Adams
```

Or from a test script:

```bash
npm run test:e2e                  # beforeAll hooks call reset+seed automatically
```

### Test Specs

| Spec | Coverage |
|------|----------|
| `workspace.spec.ts` | Workspace readiness checklist, nav links, no fake alumni |
| `enrichment.spec.ts` | Enrich list, edit form save/persist, verified status display |
| `player-outreach.spec.ts` | Player search, profile verified enrichment, outreach draft facts |
| `unverified-enrichment.spec.ts` | Unverified warning badge, polished template gate, enrich list status |
| `error-states.spec.ts` | Bad slugs, bad person IDs — no crash, error state visible |
| `extract-promote.spec.ts` | Live Penn roster extraction → save → promote → people count |

### data-testid Reference

| Selector | Location |
|----------|----------|
| `[data-testid="workspace-ready"]` | `/builder/workspace` — readiness card |
| `[data-testid="recommended-action"]` | `/builder/workspace` — top action banner |
| `[data-testid="readiness-checklist"]` | `/builder/workspace` — checklist panel |
| `[data-testid="workflow-steps"]` | `/builder/workspace` — workflow step list |
| `[data-testid="roster-url-input"]` | `/builder/debug-roster` — URL text input |
| `[data-testid="roster-extract-submit"]` | `/builder/debug-roster` — Extract button |
| `[data-testid="roster-results"]` | `/builder/debug-roster` — results container |
| `[data-testid="roster-save-button"]` | `/builder/debug-roster` — Save button |
| `[data-testid="promote-table"]` | `/builder/promote` — entries table |
| `[data-testid="select-high-confidence-button"]` | `/builder/promote` — auto-select button |
| `[data-testid="promote-selected-button"]` | `/builder/promote` — promote action |
| `[data-testid="enrich-list"]` | `/builder/enrich` — people table |
| `[data-testid="enrich-edit-form"]` | `/builder/enrich/[personId]` — edit form |
| `[data-testid="enrichment-save-button"]` | `/builder/enrich/[personId]` — save button |
| `[data-testid="enrichment-source-form"]` | `/builder/enrich/[personId]` — add source form |
| `[data-testid="enrichment-source-add-button"]` | `/builder/enrich/[personId]` — add source submit |
| `[data-testid="roster-truth-panel"]` | `/builder/enrich/[personId]` — truth panel |
| `[data-testid="player-profile"]` | `/player/alumni/[id]` — full profile container |
| `[data-testid="career-contact-card"]` | `/player/alumni/[id]` — enrichment card |
| `[data-testid="outreach-draft-preview"]` | `/player/outreach/[id]` — draft text |
| `[data-testid="verified-facts-panel"]` | `/player/outreach/[id]` — verified facts |

### Authoring New Tests

- Always call `resetAndSeedPennTeam()`, `resetSeedAndPromoteDemoPeople()`, or `resetSeedAndAgentDemo()` in `beforeAll`
- Use `getProfileByName(request, TEAM_SLUG, 'Ryan Chang')` to get dynamic personId
- `FAKE_ALUMNI_NAMES` from `test-data.ts` must never appear in any page body
- Live extraction tests must use `test.skip()` if the external site is unreachable

### Agent `data-testid` reference

| Selector | Location |
|---|---|
| `[data-testid="agent-roster-url-input"]` | `/builder/agent` — roster URL input |
| `[data-testid="agent-run-extraction-button"]` | `/builder/agent` — run extraction button |
| `[data-testid="agent-roster-results"]` | `/builder/agent` — extracted rows panel |
| `[data-testid="agent-add-to-graph-button"]` | `/builder/agent` — approval checkpoint button |
| `[data-testid="agent-timeline"]` | `/builder/agent` — 8-step progress timeline |

---

## Agent-First Demo Flow

This is the primary demo path for showing the product to new users.

### Setup

```bash
cd "/Users/ryanchang/Desktop/AI Projects/alumni-os"
npm run store:reset
npm run seed:agent-demo
npm run dev -- --port 4000
```

### Manual flow

1. Open `/builder/agent?teamSlug=penn-mens-golf`
2. Confirm timeline shows "Team selected" and "Site checked" as Complete
3. Confirm Ryan Chang and Hayden Adams appear in the roster rows panel with status "pending"
4. Confirm the approval copy says rows are not in the graph yet
5. Click **Add high-confidence rows to graph**
6. Confirm success state ("Added to graph")
7. Open `/builder/people?teamSlug=penn-mens-golf`
8. Confirm Ryan Chang and Hayden Adams are now people
9. Open `/builder/enrich?teamSlug=penn-mens-golf`
10. Click Ryan Chang → add verified profile details (role, company, source URL)
11. Open `/player/search`
12. Search for a name — confirm Ryan appears
13. Open Ryan profile — confirm verified details show with source badge
14. Open Ryan outreach — confirm the draft may reference verified company/role
15. Open Hayden outreach — confirm no company/role is invented (no enrichment = no career facts)

### Expected result

The demo should feel like one guided agent run. The roster URL is pre-populated. The user clicks one button to extract, sees real names, approves them, and the graph is built. Advanced tools are visible but not required. No fictional alumni appear at any point.

## Known Limitations

- Store is local JSON — resets on `npm run store:reset`
- Live scraping depends on Penn Athletics website availability
- Historical import makes real HTTP requests to public roster pages
- No auth, no deployment — local dev only
- Enrichment is manual-entry only — no LinkedIn scraping, no AI APIs, no automated career data
- Email and LinkedIn fields are stored as-is; no verification or scraping
- Relationship tracking is basic (status field) — no email sending, no CRM integration
- Relationship tracking is not yet implemented
