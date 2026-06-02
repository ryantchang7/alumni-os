import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isExampleGathering, isHiddenGathering } from '@/lib/seed-data/example-gatherings'

const VALID_TYPES = ['round', 'coffee', 'drinks', 'dinner', 'event'] as const
const VALID_AUDIENCES = ['players', 'alumni', 'both'] as const
const VALID_VIBES = ['casual', 'competitive', 'career', 'social', 'formal'] as const

/** Normalize a pasted link — prefix https:// when missing, validate, else drop. */
function cleanUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const v = raw.trim()
  if (!v) return undefined
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    return new URL(withScheme).toString()
  } catch {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const typeFilter = searchParams.get('type') as (typeof VALID_TYPES)[number] | null

  const { readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ gatherings: [] })

  const store = await readStore()
  let gatherings = store.clubhouseGatherings.filter(
    g => g.teamId === team.id && g.status !== 'closed' && !isHiddenGathering(g.id),
  )
  if (typeFilter && VALID_TYPES.includes(typeFilter)) {
    gatherings = gatherings.filter(g => g.type === typeFilter)
  }

  const sorted = gatherings
    .sort((a, b) => a.dateText.localeCompare(b.dateText))
    .map(g => ({ ...g, isExample: isExampleGathering(g.id, g.isExample) }))
  return NextResponse.json({ gatherings: sorted })
}

export async function POST(request: NextRequest) {
  // Member-only — only an approved (linked) account can host.
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card to host.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const teamSlug = typeof body.teamSlug === 'string' ? body.teamSlug : 'penn-mens-golf'
  const type = body.type as string
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const hostName = typeof body.hostName === 'string' ? body.hostName.trim() : ''
  const dateText = typeof body.dateText === 'string' ? body.dateText.trim() : ''
  const audience = body.audience as string

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!hostName) return NextResponse.json({ error: 'hostName required' }, { status: 400 })
  if (!dateText) return NextResponse.json({ error: 'dateText required' }, { status: 400 })
  if (!VALID_AUDIENCES.includes(audience as (typeof VALID_AUDIENCES)[number])) {
    return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
  }

  const { getTeamBySlug, createClubhouseGathering } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const vibe = VALID_VIBES.includes(body.vibe as (typeof VALID_VIBES)[number])
    ? (body.vibe as (typeof VALID_VIBES)[number])
    : undefined

  const gathering = await createClubhouseGathering({
    teamId: team.id,
    type: type as (typeof VALID_TYPES)[number],
    title,
    description: typeof body.description === 'string' ? body.description.trim() : undefined,
    hostPersonId: typeof body.hostPersonId === 'string' ? body.hostPersonId : undefined,
    hostName,
    city: typeof body.city === 'string' ? body.city.trim() : undefined,
    state: typeof body.state === 'string' ? body.state.trim() : undefined,
    venue: typeof body.venue === 'string' ? body.venue.trim() : undefined,
    dateText,
    timeText: typeof body.timeText === 'string' ? body.timeText.trim() : undefined,
    capacity: typeof body.capacity === 'number' ? body.capacity : undefined,
    audience: audience as (typeof VALID_AUDIENCES)[number],
    vibe,
    imageUrl: cleanUrl(body.imageUrl),
    mapsUrl: cleanUrl(body.mapsUrl),
    status: 'open',
  })

  return NextResponse.json({ gathering }, { status: 201 })
}
