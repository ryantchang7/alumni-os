import { NextResponse } from 'next/server'
import { validateCrawlTarget } from '@/lib/scraping/guards'
import { createTeam, readStore, getTeamBySlug } from '@/lib/store/local-store'
import { requireFounder } from '@/lib/auth/guards'

export async function POST(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { schoolName, teamName, sport, gender, websiteUrl } = (body ?? {}) as Record<string, unknown>

  if (!schoolName || !teamName || !sport || !gender || !websiteUrl) {
    return NextResponse.json(
      { error: 'Missing required fields: schoolName, teamName, sport, gender, websiteUrl' },
      { status: 400 },
    )
  }

  const validation = validateCrawlTarget(String(websiteUrl))
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 422 })
  }

  const team = await createTeam({
    schoolName: String(schoolName),
    teamName: String(teamName),
    sport: String(sport),
    gender: String(gender),
    websiteUrl: String(websiteUrl),
  })

  return NextResponse.json(team)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    const store = await readStore()
    return NextResponse.json(store.teams)
  }

  const team = await getTeamBySlug(slug)
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }
  return NextResponse.json(team)
}
