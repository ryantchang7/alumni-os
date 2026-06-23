import { NextResponse } from 'next/server'
import {
  getTeamBySlug,
  getExtractedEntriesForTeam,
  getPeopleForTeam,
  readStore,
} from '@/lib/store/local-store'
import { buildAgentSummary } from '@/lib/agent/build-agent-summary'
import { requireFounder } from '@/lib/auth/guards'

export async function GET(request: Request) {
  // Builder-only tooling (sole caller: /builder/agent). Exposes internal roster
  // + enrichment counts → founder-gated.
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')

  if (!teamSlug) {
    return NextResponse.json({ error: 'Missing required query param: teamSlug' }, { status: 400 })
  }

  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })
  }

  const [entries, people, store] = await Promise.all([
    getExtractedEntriesForTeam(team.id),
    getPeopleForTeam(team.id),
    readStore(),
  ])

  const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
  const verifiedEnrichments = enrichments.filter(
    e =>
      e.verificationStatus === 'manually_verified' || e.verificationStatus === 'source_backed',
  ).length

  const counts = {
    extractedEntries: entries.length,
    extractedPending: entries.filter(e => e.status === 'extracted').length,
    promotedEntries: entries.filter(e => e.status === 'promoted').length,
    people: people.length,
    seasonsWithEntries: new Set(entries.map(e => e.seasonYear).filter(Boolean)).size,
    enrichedProfiles: enrichments.length,
    verifiedEnrichments,
  }

  const agentSummary = buildAgentSummary(
    { slug: team.slug, websiteUrl: team.websiteUrl },
    counts,
  )

  return NextResponse.json({ team, counts, agentSummary })
}
