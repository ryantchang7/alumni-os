import { NextRequest, NextResponse, after } from 'next/server'
import { auth } from '@/auth'
import { requireApprovedMember } from '@/lib/auth/guards'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { isExampleGathering, isHiddenGathering, isExpiredExampleGathering } from '@/lib/seed-data/example-gatherings'
import { gatheringSortKey, isPastGathering } from '@/lib/gatherings/date'
import { getApprovalState } from '@/lib/access/approval'
import type { ClubhouseGathering } from '@/lib/store/types'
import type { NotifyMode } from '@/lib/gatherings/nearby'

const VALID_TYPES = ['round', 'coffee', 'drinks', 'dinner', 'event'] as const
const VALID_AUDIENCES = ['players', 'alumni', 'both'] as const
const VALID_VIBES = ['casual', 'competitive', 'career', 'social', 'formal'] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

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
  // Member-written content — approved members only; empty for everyone else.
  const approval = await getApprovalState()
  if (!approval.approved) return NextResponse.json({ gatherings: [] })

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

  // Chronological, not alphabetical. gatheringSortKey prefers dateISO and
  // guards the yearless-dateText trap; unparseable dates sort last.
  const sorted = gatherings
    .sort((a, b) => gatheringSortKey(a) - gatheringSortKey(b))
    .map(g => ({
      ...g,
      isExample: isExampleGathering(g.id, g.isExample),
      // Computed, never stored: a gathering becomes past on its own as the
      // day rolls over. Callers that only want one side pass ?when=.
      isPast: isPastGathering(g),
    }))
    .filter(g => !isExpiredExampleGathering(g))

  // ?when=upcoming (the default board) | played (the record) | all
  const when = request.nextUrl.searchParams.get('when')
  const filtered =
    when === 'upcoming' ? sorted.filter(g => !g.isPast)
    : when === 'played' ? sorted.filter(g => g.isPast && !g.isExample).reverse()
    : sorted

  return NextResponse.json({ gatherings: filtered })
}

export async function POST(request: NextRequest) {
  // Member-only — only an approved (linked) account can host.
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only, claim your card to host.' },
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
  const dateISO = typeof body.dateISO === 'string' ? body.dateISO.trim().slice(0, 10) : ''
  const audience = body.audience as string

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!hostName) return NextResponse.json({ error: 'hostName required' }, { status: 400 })
  if (!dateText) return NextResponse.json({ error: 'dateText required' }, { status: 400 })
  if (dateISO && !ISO_DATE.test(dateISO)) {
    return NextResponse.json({ error: 'dateISO must be YYYY-MM-DD' }, { status: 400 })
  }
  if (!VALID_AUDIENCES.includes(audience as (typeof VALID_AUDIENCES)[number])) {
    return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
  }

  const { getTeamBySlug, createClubhouseGathering } = await import('@/lib/store/local-store')
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const vibe = VALID_VIBES.includes(body.vibe as (typeof VALID_VIBES)[number])
    ? (body.vibe as (typeof VALID_VIBES)[number])
    : undefined

  // Founder-only: seed a labeled "Example" gathering so the rooms show what
  // they're for before real ones exist. Members can never post examples —
  // the flag is ignored for everyone else. Examples age out after their date.
  const viewerEmail = (session.user?.email ?? '').toLowerCase().trim()
  const isExample = body.isExample === true && FOUNDER_EMAILS.has(viewerEmail)

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
    dateISO: dateISO || undefined,
    timeText: typeof body.timeText === 'string' ? body.timeText.trim().slice(0, 80) : undefined,
    capacity: typeof body.capacity === 'number' ? body.capacity : undefined,
    audience: audience as (typeof VALID_AUDIENCES)[number],
    vibe,
    imageUrl: cleanUrl(body.imageUrl),
    mapsUrl: cleanUrl(body.mapsUrl),
    status: 'open',
    ...(isExample ? { isExample: true } : {}),
  })

  // Tell the people who could actually show up. Without this you could host a
  // round and nobody would hear about it unless they happened to open the site.
  // Mirrors the nearby-request fan-out: match on home state, else city text.
  //
  // Runs after the response so the host is not left waiting on a fan-out of
  // dozens of emails, and still completes, unlike a bare floating promise.
  //
  // Examples never notify. They are seeded in batches and would otherwise mail
  // the whole roster about a round that is not real.
  // Who hears about it is the host's call. Default stays 'nearby', which is
  // what every round did before this was a choice.
  const notifyMode: NotifyMode =
    body.notifyMode === 'invite' || body.notifyMode === 'quiet' ? body.notifyMode : 'nearby'
  const inviteBookIds = Array.isArray(body.inviteBookIds)
    ? (body.inviteBookIds as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 60)
    : []

  if (!isExample && notifyMode !== 'quiet') {
    const hostAccountId = session.accountId
    after(() => notifyNearbyMembers(gathering, hostAccountId, notifyMode, inviteBookIds))
  }

  return NextResponse.json({ gathering }, { status: 201 })
}

/**
 * In-app bell + web push + email to approved members in the same place.
 *
 * Never throws: a notification failure must not fail the post itself, or the
 * host sees an error for a round that was actually created.
 */
async function notifyNearbyMembers(
  gathering: ClubhouseGathering,
  hostAccountId: string,
  mode: NotifyMode = 'nearby',
  inviteBookIds: string[] = [],
): Promise<void> {
  try {
    const { readStore } = await import('@/lib/store/local-store')
    const { notifyMany } = await import('@/lib/notifications/notify')
    const { selectNearbyRecipients, placeLabel, TYPE_LABEL } = await import('@/lib/gatherings/nearby')

    const store = await readStore()
    let recipients
    if (mode === 'invite') {
      // Named guests only. Book ids are not store person ids, so resolve them
      // by name the same way the tee-sheet picker does.
      const { getMemberById } = await import('@/lib/member-book/data')
      const { normalizeName } = await import('@/lib/member-book/bridge')
      const wanted = new Set<string>()
      for (const id of inviteBookIds) {
        const entry = getMemberById(id)
        if (!entry) continue
        const target = normalizeName(entry.displayName)
        const person = store.people.find(pp => normalizeName(pp.canonicalName) === target)
        if (person) wanted.add(person.id)
      }
      recipients = store.accounts.filter(
        a => a.linkedPersonId && wanted.has(a.linkedPersonId) && a.id !== hostAccountId,
      )
    } else {
      recipients = selectNearbyRecipients({
        accounts: store.accounts,
        enrichments: store.personEnrichments,
        memberships: store.teamMemberships,
        gathering,
        hostAccountId,
      })
    }
    console.log(
      `[gatherings] "${gathering.title}" (${mode}) in ${gathering.city ?? ''} ${gathering.state ?? ''}: notifying ${recipients.length}`,
    )
    if (recipients.length === 0) return

    const placeText = placeLabel(gathering)
    const typeLabel = TYPE_LABEL[gathering.type] ?? 'a round'
    const href = gathering.type === 'round' ? '/the-course' : '/19th-hole'

    await notifyMany(
      recipients.map(a => a.id),
      {
        type: 'new_round',
        title: `${gathering.hostName} is hosting ${typeLabel} in ${placeText}`,
        body: [gathering.dateText, gathering.timeText, gathering.venue].filter(Boolean).join(' · '),
        href,
      },
    )

    const withEmail = recipients.filter(a => a.email)
    if (withEmail.length === 0) return

    const { sendEmailBatch } = await import('@/lib/email/send')
    const { renderNewRoundEmail } = await import('@/lib/email/templates')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
    const url = `${baseUrl}${href}`
    await sendEmailBatch(
      withEmail.map(a => {
        const { subject, html } = renderNewRoundEmail({
          recipientFirstName: a.name?.split(' ')[0] ?? null,
          hostName: gathering.hostName,
          title: gathering.title,
          typeLabel,
          placeText,
          venue: gathering.venue ?? null,
          dateText: gathering.dateText,
          timeText: gathering.timeText ?? null,
          description: gathering.description ?? null,
          url,
        })
        return { to: a.email, subject, html }
      }),
    )
  } catch (err) {
    console.warn('[gatherings] nearby notify failed (non-fatal):', err)
  }
}

/**
 * PATCH /api/gatherings?id=... — the host fixes their own round.
 *
 * Without this the only way to correct a wrong date or course was to delete
 * and re-post, which throws away the whole tee sheet along with it.
 * Host or founder only; every field is optional.
 */
export async function PATCH(request: NextRequest) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { getClubhouseGatheringById, updateClubhouseGathering } = await import('@/lib/store/local-store')
  const existing = await getClubhouseGatheringById(id)
  if (!existing) return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })

  const isHost = !!existing.hostPersonId && existing.hostPersonId === gate.session.linkedPersonId
  const isFounder = FOUNDER_EMAILS.has(gate.email)
  if (!isHost && !isFounder) {
    return NextResponse.json({ error: 'Only the host can edit this.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  const str = (k: string, max: number) => {
    if (typeof body[k] === 'string') patch[k] = (body[k] as string).trim().slice(0, max)
  }
  str('title', 160)
  str('description', 800)
  str('city', 160)
  str('state', 40)
  str('venue', 200)
  str('dateText', 160)
  if (typeof body.dateISO === 'string') {
    const v = body.dateISO.trim()
    if (v && !ISO_DATE.test(v)) {
      return NextResponse.json({ error: 'dateISO must be YYYY-MM-DD' }, { status: 400 })
    }
    patch.dateISO = v || undefined
  }
  str('timeText', 80)
  str('hostName', 160)
  if (typeof body.capacity === 'number') patch.capacity = body.capacity
  if (VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) patch.type = body.type
  if (VALID_AUDIENCES.includes(body.audience as (typeof VALID_AUDIENCES)[number])) patch.audience = body.audience
  if (VALID_VIBES.includes(body.vibe as (typeof VALID_VIBES)[number])) patch.vibe = body.vibe
  if (['open', 'full', 'closed'].includes(body.status as string)) patch.status = body.status
  if (typeof body.mapsUrl === 'string') patch.mapsUrl = cleanUrl(body.mapsUrl)
  if (typeof body.imageUrl === 'string') patch.imageUrl = cleanUrl(body.imageUrl)

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }
  if (patch.title === '') return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
  if (patch.dateText === '') return NextResponse.json({ error: 'dateText cannot be empty' }, { status: 400 })

  const updated = await updateClubhouseGathering(id, patch)
  if (!updated) return NextResponse.json({ error: 'Gathering not found' }, { status: 404 })
  return NextResponse.json({ gathering: updated })
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
