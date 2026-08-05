import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireApprovedMember } from '@/lib/auth/guards'
import type { CareerPostSector } from '@/lib/store/types'

const VALID_SECTORS: CareerPostSector[] = [
  'finance',
  'consulting',
  'real-estate',
  'law',
  'technology',
  'startups',
  'sports',
  'medicine',
  'media',
  'public-service',
  'other',
]

const VALID_KINDS = ['ask', 'offer'] as const

const HEADLINE_MAX = 120
const BODY_MAX = 600

export async function GET(request: NextRequest) {
  const g = await requireApprovedMember()
  if (!g.ok) return g.response

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const kindFilter = searchParams.get('kind') as (typeof VALID_KINDS)[number] | null

  const { getTeamBySlug, getCareerPostsForTeam } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ posts: [] })

  let posts = await getCareerPostsForTeam(team.id)
  if (kindFilter && VALID_KINDS.includes(kindFilter)) {
    posts = posts.filter((p) => p.kind === kindFilter)
  }
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only, claim your card to post.' },
      { status: 403 },
    )
  }

  // Career Room asks/offers are alumni-to-alumni networking. Parents and
  // affiliates can read the room but can't post.
  const { readStore } = await import('@/lib/store/local-store')
  const store = await readStore()
  const membership = store.teamMemberships.find(
    m => m.personId === session.linkedPersonId,
  )
  if (membership?.memberRole === 'parent') {
    return NextResponse.json(
      { error: 'Career Room posts are open to alumni and current players only.' },
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
  const kind = body.kind as string
  const sector = body.sector as string
  const headline = typeof body.headline === 'string' ? body.headline.trim() : ''
  const bodyText = typeof body.body === 'string' ? body.body.trim() : undefined
  const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : ''

  if (!VALID_KINDS.includes(kind as (typeof VALID_KINDS)[number])) {
    return NextResponse.json({ error: 'kind must be "ask" or "offer"' }, { status: 400 })
  }
  if (!VALID_SECTORS.includes(sector as CareerPostSector)) {
    return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
  }
  if (!headline) return NextResponse.json({ error: 'headline required' }, { status: 400 })
  if (headline.length > HEADLINE_MAX) {
    return NextResponse.json({ error: `headline > ${HEADLINE_MAX} chars` }, { status: 400 })
  }
  if (bodyText && bodyText.length > BODY_MAX) {
    return NextResponse.json({ error: `body > ${BODY_MAX} chars` }, { status: 400 })
  }
  if (!contactEmail || !contactEmail.includes('@')) {
    return NextResponse.json({ error: 'contactEmail required' }, { status: 400 })
  }

  const { getTeamBySlug, createCareerPost } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const post = await createCareerPost({
    teamId: team.id,
    kind: kind as 'ask' | 'offer',
    sector: sector as CareerPostSector,
    headline,
    body: bodyText,
    postedByAccountId: session.accountId,
    postedByPersonId: session.linkedPersonId ?? undefined,
    postedByName: session.user?.name ?? 'Penn Golf Member',
    contactEmail,
    status: 'open',
  })

  return NextResponse.json({ post }, { status: 201 })
}
