# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: player-outreach.spec.ts >> Player outreach >> player search shows Ryan via verified enrichment search
- Location: e2e/player-outreach.spec.ts:30:7

# Error details

```
Error: getProfiles(penn-mens-golf)

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1   | import type { APIRequestContext } from '@playwright/test'
  2   | import { expect } from '@playwright/test'
  3   | 
  4   | const BASE = ''
  5   | 
  6   | export async function getTeam(request: APIRequestContext, teamSlug: string) {
  7   |   const res = await request.get(`${BASE}/api/teams?slug=${encodeURIComponent(teamSlug)}`)
  8   |   expect(res.status(), `getTeam(${teamSlug})`).toBe(200)
  9   |   return res.json()
  10  | }
  11  | 
  12  | export async function runCurrentRosterExtraction(
  13  |   request: APIRequestContext,
  14  |   teamSlug: string,
  15  |   url: string,
  16  | ) {
  17  |   const res = await request.post(`${BASE}/api/scrape/roster-run`, {
  18  |     data: { teamSlug, url },
  19  |   })
  20  |   expect(res.status(), `runCurrentRosterExtraction(${teamSlug})`).toBe(200)
  21  |   return res.json()
  22  | }
  23  | 
  24  | export async function getRosterEntries(request: APIRequestContext, teamSlug: string) {
  25  |   const res = await request.get(
  26  |     `${BASE}/api/roster/entries?teamSlug=${encodeURIComponent(teamSlug)}`,
  27  |   )
  28  |   expect(res.status(), `getRosterEntries(${teamSlug})`).toBe(200)
  29  |   return res.json() as Promise<{ id: string; fullName: string; status: string; extractionConfidence: number }[]>
  30  | }
  31  | 
  32  | export async function promoteEntries(
  33  |   request: APIRequestContext,
  34  |   teamSlug: string,
  35  |   entryIds: string[],
  36  | ) {
  37  |   const res = await request.post(`${BASE}/api/roster/promote`, {
  38  |     data: { teamSlug, entryIds },
  39  |   })
  40  |   expect(res.status(), `promoteEntries(${teamSlug})`).toBe(200)
  41  |   return res.json()
  42  | }
  43  | 
  44  | export async function promoteAllExtractedEntries(request: APIRequestContext, teamSlug: string) {
  45  |   const entries = await getRosterEntries(request, teamSlug)
  46  |   const extractedIds = entries.filter(e => e.status === 'extracted').map(e => e.id)
  47  |   if (extractedIds.length === 0) return { promotedCount: 0 }
  48  |   return promoteEntries(request, teamSlug, extractedIds)
  49  | }
  50  | 
  51  | export async function getProfiles(request: APIRequestContext, teamSlug: string) {
  52  |   const res = await request.get(
  53  |     `${BASE}/api/alumni/profiles?teamSlug=${encodeURIComponent(teamSlug)}`,
  54  |   )
> 55  |   expect(res.status(), `getProfiles(${teamSlug})`).toBe(200)
      |                                                    ^ Error: getProfiles(penn-mens-golf)
  56  |   return res.json() as Promise<{
  57  |     profiles: { personId: string; canonicalName: string; enrichmentStatus: string }[]
  58  |   }>
  59  | }
  60  | 
  61  | export async function getProfileByName(
  62  |   request: APIRequestContext,
  63  |   teamSlug: string,
  64  |   name: string,
  65  | ) {
  66  |   const data = await getProfiles(request, teamSlug)
  67  |   const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  68  |   return data.profiles.find(
  69  |     p => p.canonicalName.toLowerCase().replace(/[^a-z0-9]/g, '') === norm,
  70  |   )
  71  | }
  72  | 
  73  | export async function upsertEnrichment(
  74  |   request: APIRequestContext,
  75  |   teamSlug: string,
  76  |   personId: string,
  77  |   enrichment: Record<string, unknown>,
  78  | ) {
  79  |   const res = await request.post(`${BASE}/api/alumni/enrichment`, {
  80  |     data: { teamSlug, personId, enrichment },
  81  |   })
  82  |   expect(res.status(), `upsertEnrichment(${personId})`).toBe(200)
  83  |   return res.json()
  84  | }
  85  | 
  86  | export async function addEnrichmentSource(
  87  |   request: APIRequestContext,
  88  |   teamSlug: string,
  89  |   personId: string,
  90  |   source: { url: string; sourceType: string; title?: string; notes?: string },
  91  | ) {
  92  |   const res = await request.post(`${BASE}/api/alumni/enrichment/sources`, {
  93  |     data: { teamSlug, personId, ...source },
  94  |   })
  95  |   expect(res.status(), `addEnrichmentSource(${personId})`).toBe(200)
  96  |   return res.json()
  97  | }
  98  | 
  99  | export async function getReadiness(request: APIRequestContext, teamSlug: string) {
  100 |   const res = await request.get(
  101 |     `${BASE}/api/demo/readiness?teamSlug=${encodeURIComponent(teamSlug)}`,
  102 |   )
  103 |   expect(res.status(), `getReadiness(${teamSlug})`).toBe(200)
  104 |   return res.json()
  105 | }
  106 | 
```