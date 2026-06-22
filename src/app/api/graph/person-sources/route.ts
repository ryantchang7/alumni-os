import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { getTeamBySlug, getTeamMembershipsForTeam, getExtractedEntriesForTeam, readStore } from '@/lib/store/local-store'

export async function GET(request: Request) {
  const g = await requireFounder()
  if (!g.ok) return g.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug')
  const personId = searchParams.get('personId')

  if (!teamSlug) return NextResponse.json({ error: 'Missing teamSlug' }, { status: 400 })
  if (!personId) return NextResponse.json({ error: 'Missing personId' }, { status: 400 })

  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  const store = await readStore()
  const person = store.people.find(p => p.id === personId)
  if (!person) return NextResponse.json({ error: `Person not found: ${personId}` }, { status: 404 })

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === personId)

  const allEntries = await getExtractedEntriesForTeam(team.id)
  const relatedEntries = allEntries.filter(e => {
    const norm = e.fullName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    return norm === person.normalizedName
  })

  return NextResponse.json({ person, membership, entries: relatedEntries })
}
