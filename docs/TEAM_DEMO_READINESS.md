# Alumni OS — Team Demo Readiness Checklist

## Status: Demo Ready

This checklist confirms what is working and what is intentionally mock in the current demo build.

## Product Flow
- [x] Clean landing page (/) with hero, pipeline visualization, trust columns
- [x] App home (/app) — orients new users in under 30 seconds
- [x] Builder flow: /builder → /builder/new → /builder/discovery → /builder/run → /builder/review → /builder/graph
- [x] Player flow: /player → /player/search → /player/alumni/[id] → /player/outreach/[id]
- [x] Relationship tracker (/player/relationships) with mock status data
- [x] Review layer: /review → /review/candidates → /review/sources
- [x] Mock login (/login) with 4 demo user personas
- [x] Original Penn Golf demo routes preserved (/teams/penn-mens-golf/*)

## Data & Trust
- [x] All demo alumni data is fictionalized (no real Penn Golf alumni identified)
- [x] No private data, login-gated scraping, or LinkedIn fetching
- [x] No email addresses scraped or stored
- [x] Trust language clear throughout: sources, confidence, review status always visible
- [x] "Demo only" labels on appropriate pages
- [x] Human review before graph promotion — review queue exists and is clear

## Real vs Mock Labels
- [x] /builder/discovery labeled "Real Discovery Preview" — actually fetches public URLs
- [x] Agent run labeled "Demo run" — animated demo, not real pipeline
- [x] Discovery preview clearly states "no data is saved"
- [x] Outreach drafts are static templates, not AI-generated

## Components
- [x] Search works (live query filters mock data)
- [x] Sort works (5 sort options on search page)
- [x] Outreach studio: purpose/channel/tone selection, 3 variants, scam check panel
- [x] Review queue: tabbed by category, item cards with risk flags and actions
- [x] Scraper center: 4 tabs with discovered pages, roster, normalized people, candidates

## Known Mock Limitations
- Approve/reject buttons in review queue are UI-only (no state change)
- FilterSidebar filters are UI-only decorations
- Discovery API requires a live network connection to fetch real pages
- Outreach drafts are template-based, not AI-personalized
- Login stores persona in localStorage only, no session persistence
