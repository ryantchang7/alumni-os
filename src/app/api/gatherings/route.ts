import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireApprovedMember } from '@/lib/auth/guards'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { isExampleGathering, isHiddenGathering, isExpiredExampleGathering } from '@/lib/seed-data/example-gatherings'

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

  // Chronological, not alphabetical — parse the human dateText; unparseable
  // dates sort last (they're usually vague like "Championship Weekend").
  const sortKey = (d: string) => {
    const t = Date.parse(d)
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
  }
  const sorted = gatherings
    .sort((a, b) => sortKey(a.dateText) - sortKey(b.dateText))
    .map(g => ({ ...g, isExample: isExampleGathering(g.id, g.isExample) }))
    .filter(g => !isExpiredExampleGathering(g))
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

  // Cap free-text fields with .slice(N) before they're persisted into the
  // single JSON blob (truncate, don't reject). type/audience/vibe are
  // enum-checked and image/maps URLs are validated separately.
  const teamSlug = typeof body.teamSlug === 'string' ? body.teamSlug : 'penn-mens-golf'
  const type = body.type as string
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''
  const hostName = typeof body.hostName === 'string' ? body.hostName.trim().slice(0, 160) : ''
  const dateText = typeof body.dateText === 'string' ? body.dateText.trim().slice(0, 160) : ''
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
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 800) : undefined,
    hostPersonId: typeof body.hostPersonId === 'string' ? body.hostPersonId : undefined,
    hostName,
    city: typeof body.city === 'string' ? body.city.trim().slice(0, 160) : undefined,
    state: typeof body.state === 'string' ? body.state.trim().slice(0, 40) : undefined,
    venue: typeof body.venue === 'string' ? body.venue.trim().slice(0, 200) : undefined,
    dateText,
    timeText: typeof body.timeText === 'string' ? body.timeText.trim().slice(0, 80) : undefined,
    capacity: typeof body.capacity === 'number' ? body.capacity : undefined,
    audience: audience as (typeof VALID_AUDIENCES)[number],
    vibe,
    imageUrl: cleanUrl(body.imageUrl),
    mapsUrl: cleanUrl(body.mapsUrl),
    status: 'open',
  })

  return NextResponse.json({ gathering }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  // Only the host who created it (or a founder) can take a gathering down.
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { getClubhouseGatheringById, updateClubhouseGathering } = await import('@/lib/store/local-store')
  const gathering = await getClubhouseGatheringById(id)
  if (!gathering) return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })

  const isHost = !!gathering.hostPersonId && gathering.hostPersonId === gate.session.linkedPersonId
  const isFounder = FOUNDER_EMAILS.has(gate.email)
  if (!isHost && !isFounder) {
    return NextResponse.json({ error: 'Only the host can remove this gathering.' }, { status: 403 })
  }

  // Soft-delete by closing it: the GET above filters out `status === 'closed'`,
  // so it drops off The Course / 19th Hole / Clubhouse immediately, and it's
  // reversible if needed.
  await updateClubhouseGathering(id, { status: 'closed' })
  return NextResponse.json({ ok: true })
}
