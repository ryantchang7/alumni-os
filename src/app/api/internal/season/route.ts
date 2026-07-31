import { NextResponse } from 'next/server'
import { requireFounder } from '@/lib/auth/guards'
import { canPostSeasonUpdates } from '@/lib/auth/season-posters'
import {
  getTeamBySlug,
  getSeasonUpdatesForTeam,
  createSeasonUpdate,
  updateSeasonUpdate,
  deleteSeasonUpdate,
  readStore,
} from '@/lib/store/local-store'
import { detectStoreBackend } from '@/lib/launch/persistence-check'
import { fetchLinkPreview } from '@/lib/link-preview/fetch-link-preview'
import { notifyMany } from '@/lib/notifications/notify'
import type { SeasonUpdate } from '@/lib/store/types'

const VALID_KINDS = new Set<SeasonUpdate['kind']>(['qualifying', 'tournament', 'stat', 'note'])

type PreviewFields = Pick<SeasonUpdate, 'previewImageUrl' | 'previewTitle' | 'previewDescription'>

/** Manual image wins; otherwise auto-pull the link's Open Graph preview. */
async function resolvePreview(linkUrl: string | undefined, manualImage: string | undefined): Promise<PreviewFields> {
  if (manualImage) return { previewImageUrl: manualImage, previewTitle: undefined, previewDescription: undefined }
  if (linkUrl) {
    const p = await fetchLinkPreview(linkUrl)
    return { previewImageUrl: p.imageUrl, previewTitle: p.title, previewDescription: p.description }
  }
  return { previewImageUrl: undefined, previewTitle: undefined, previewDescription: undefined }
}

function cleanUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const v = raw.trim()
  if (!v) return undefined
  // Be forgiving — accept a bare domain/path and prefix https://.
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    return new URL(withScheme).toString()
  } catch {
    return undefined
  }
}

export async function GET(request: Request) {
  const gate = await canPostSeasonUpdates()
  if (!gate.ok) return NextResponse.json({ error: 'Not authorized' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  const updates = await getSeasonUpdatesForTeam(team.id)
  // Surface whether writes will actually survive a cold start, so the editor
  // can warn instead of silently dropping updates into /tmp on Vercel.
  const persistence = detectStoreBackend()
  return NextResponse.json({ team, updates, persistence })
}

export async function POST(request: Request) {
  const gate = await canPostSeasonUpdates()
  if (!gate.ok) return NextResponse.json({ error: 'Not authorized' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const teamSlug = typeof body.teamSlug === 'string' ? body.teamSlug : 'penn-mens-golf'
  const team = await getTeamBySlug(teamSlug)
  if (!team) return NextResponse.json({ error: `Team not found: ${teamSlug}` }, { status: 404 })

  const kind = body.kind as SeasonUpdate['kind']
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const dateText = typeof body.dateText === 'string' ? body.dateText.trim() : ''

  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json({ error: 'kind must be qualifying, tournament, stat, or note' }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!dateText) return NextResponse.json({ error: 'dateText required' }, { status: 400 })

  const linkUrl = cleanUrl(body.linkUrl)
  const preview = await resolvePreview(linkUrl, cleanUrl(body.previewImageUrl))

  const update = await createSeasonUpdate({
    teamId: team.id,
    kind,
    title,
    dateText,
    body: typeof body.body === 'string' && body.body.trim() ? body.body.trim() : undefined,
    linkUrl,
    linkLabel: typeof body.linkLabel === 'string' && body.linkLabel.trim() ? body.linkLabel.trim() : undefined,
    ...preview,
  })

  // Notify everyone following the team (approved members who haven't unfollowed).
  try {
    const store = await readStore()
    const followerIds = store.accounts
      .filter(a => a.linkedPersonId && a.followsTeam !== false)
      .map(a => a.id)
    if (followerIds.length > 0) {
      await notifyMany(
        followerIds,
        {
          type: 'team_update',
          title: `Team update: ${title}`,
          body: update.body ? `${dateText} — ${update.body.slice(0, 80)}${update.body.length > 80 ? '…' : ''}` : dateText,
          href: '/team/updates',
        },
        // Don't notify the founder for their own post (consistent with the
        // other fan-outs). Safe if accountId is undefined — exclusion no-ops.
        { excludeAccountId: gate.accountId ?? undefined },
      )
    }
  } catch (err) {
    console.warn('[season] follower notify failed (non-fatal):', err)
  }

  return NextResponse.json({ update }, { status: 201 })
}

export async function PATCH(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Partial<Omit<SeasonUpdate, 'id' | 'teamId' | 'createdAt'>> = {}
  if (body.kind !== undefined) {
    if (!VALID_KINDS.has(body.kind as SeasonUpdate['kind'])) {
      return NextResponse.json({ error: 'invalid kind' }, { status: 400 })
    }
    patch.kind = body.kind as SeasonUpdate['kind']
  }
  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    patch.title = body.title.trim()
  }
  if (typeof body.dateText === 'string') {
    if (!body.dateText.trim()) return NextResponse.json({ error: 'dateText cannot be empty' }, { status: 400 })
    patch.dateText = body.dateText.trim()
  }
  if (typeof body.body === 'string') patch.body = body.body.trim() || undefined
  if (body.linkUrl !== undefined) patch.linkUrl = cleanUrl(body.linkUrl)
  if (typeof body.linkLabel === 'string') patch.linkLabel = body.linkLabel.trim() || undefined

  // Recompute the preview when the link or the manual image changed.
  const manualImage = cleanUrl(body.previewImageUrl)
  if (body.previewImageUrl !== undefined && manualImage) {
    Object.assign(patch, { previewImageUrl: manualImage, previewTitle: undefined, previewDescription: undefined })
  } else if (body.linkUrl !== undefined) {
    Object.assign(patch, await resolvePreview(patch.linkUrl, undefined))
  } else if (body.previewImageUrl !== undefined && !manualImage) {
    // Founder cleared the custom image — drop the preview image, keep the link.
    Object.assign(patch, { previewImageUrl: undefined, previewTitle: undefined, previewDescription: undefined })
  }

  const update = await updateSeasonUpdate(id, patch)
  if (!update) return NextResponse.json({ error: 'Update not found' }, { status: 404 })

  return NextResponse.json({ update })
}

export async function DELETE(request: Request) {
  const gate = await requireFounder()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const ok = await deleteSeasonUpdate(id)
  if (!ok) return NextResponse.json({ error: 'Update not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
