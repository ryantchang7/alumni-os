import type { APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'

const BASE = ''

export async function getTeam(request: APIRequestContext, teamSlug: string) {
  const res = await request.get(`${BASE}/api/teams?slug=${encodeURIComponent(teamSlug)}`)
  expect(res.status(), `getTeam(${teamSlug})`).toBe(200)
  return res.json()
}

export async function runCurrentRosterExtraction(
  request: APIRequestContext,
  teamSlug: string,
  url: string,
) {
  const res = await request.post(`${BASE}/api/scrape/roster-run`, {
    data: { teamSlug, url },
  })
  expect(res.status(), `runCurrentRosterExtraction(${teamSlug})`).toBe(200)
  return res.json()
}

export async function getRosterEntries(request: APIRequestContext, teamSlug: string) {
  const res = await request.get(
    `${BASE}/api/roster/entries?teamSlug=${encodeURIComponent(teamSlug)}`,
  )
  expect(res.status(), `getRosterEntries(${teamSlug})`).toBe(200)
  return res.json() as Promise<{ id: string; fullName: string; status: string; extractionConfidence: number }[]>
}

export async function promoteEntries(
  request: APIRequestContext,
  teamSlug: string,
  entryIds: string[],
) {
  const res = await request.post(`${BASE}/api/roster/promote`, {
    data: { teamSlug, entryIds },
  })
  expect(res.status(), `promoteEntries(${teamSlug})`).toBe(200)
  return res.json()
}

export async function promoteAllExtractedEntries(request: APIRequestContext, teamSlug: string) {
  const entries = await getRosterEntries(request, teamSlug)
  const extractedIds = entries.filter(e => e.status === 'extracted').map(e => e.id)
  if (extractedIds.length === 0) return { promotedCount: 0 }
  return promoteEntries(request, teamSlug, extractedIds)
}

export async function getProfiles(request: APIRequestContext, teamSlug: string) {
  const res = await request.get(
    `${BASE}/api/alumni/profiles?teamSlug=${encodeURIComponent(teamSlug)}`,
  )
  expect(res.status(), `getProfiles(${teamSlug})`).toBe(200)
  return res.json() as Promise<{
    profiles: { personId: string; canonicalName: string; enrichmentStatus: string }[]
  }>
}

export async function getProfileByName(
  request: APIRequestContext,
  teamSlug: string,
  name: string,
) {
  const data = await getProfiles(request, teamSlug)
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return data.profiles.find(
    p => p.canonicalName.toLowerCase().replace(/[^a-z0-9]/g, '') === norm,
  )
}

export async function upsertEnrichment(
  request: APIRequestContext,
  teamSlug: string,
  personId: string,
  enrichment: Record<string, unknown>,
) {
  const res = await request.post(`${BASE}/api/alumni/enrichment`, {
    data: { teamSlug, personId, enrichment },
  })
  expect(res.status(), `upsertEnrichment(${personId})`).toBe(200)
  return res.json()
}

export async function addEnrichmentSource(
  request: APIRequestContext,
  teamSlug: string,
  personId: string,
  source: { url: string; sourceType: string; title?: string; notes?: string },
) {
  const res = await request.post(`${BASE}/api/alumni/enrichment/sources`, {
    data: { teamSlug, personId, ...source },
  })
  expect(res.status(), `addEnrichmentSource(${personId})`).toBe(200)
  return res.json()
}

export async function getReadiness(request: APIRequestContext, teamSlug: string) {
  const res = await request.get(
    `${BASE}/api/demo/readiness?teamSlug=${encodeURIComponent(teamSlug)}`,
  )
  expect(res.status(), `getReadiness(${teamSlug})`).toBe(200)
  return res.json()
}
