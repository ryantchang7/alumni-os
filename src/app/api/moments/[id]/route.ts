/**
 * Take down one of your own Moments (public wall or Locker Room) — in case
 * it was posted by mistake. Author-only soft-delete (status → 'removed');
 * admin/founder moderation is a separate path.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  deleteMoment,
  updateMoment,
  getAccountById,
  readStore,
} from '@/lib/store/local-store'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { canSeeLockerRoomForAccount } from '@/lib/access/locker-room'
import { resolveTaggedAccountIds } from '@/lib/moments/tagging'
import { notifyMany } from '@/lib/notifications/notify'

interface Ctx {
  params: Promise<{ id: string }>
}

function isValidMediaUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    return url.length <= 1024
  } catch {
    return false
  }
}

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i

/** Edit your own Moment — caption, tags, media (max 8, min 1), and/or
 *  audience. Poster-only; the founder can also edit any post. Newly
 *  tagged members get a personal notification (public moments only). */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const patch: {
    caption?: string
    taggedBookIds?: string[]
    taggedPersonIds?: string[]
    media?: { url: string; type: 'image' | 'video' }[]
    audience?: 'public' | 'locker-room'
  } = {}
  if (typeof body.caption === 'string') {
    const caption = body.caption.trim()
    if (!caption) return NextResponse.json({ error: 'caption required' }, { status: 400 })
    if (caption.length > 800) return NextResponse.json({ error: 'caption too long' }, { status: 400 })
    patch.caption = caption
  }
  if (Array.isArray(body.taggedBookIds)) {
    patch.taggedBookIds = (body.taggedBookIds as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .slice(0, 20)
  }
  if (Array.isArray(body.taggedPersonIds)) {
    patch.taggedPersonIds = (body.taggedPersonIds as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .slice(0, 20)
  }
  // Media edits replace the whole list (same validation as POST /api/moments).
  if (Array.isArray(body.media)) {
    const sniffType = (url: string): 'image' | 'video' =>
      VIDEO_EXT_RE.test(url) ? 'video' : 'image'
    const media = (body.media as unknown[])
      .map((m) => {
        if (!m || typeof m !== 'object') return null
        const url = typeof (m as { url?: unknown }).url === 'string' ? (m as { url: string }).url.trim() : ''
        if (!url || !isValidMediaUrl(url)) return null
        const rawType = (m as { type?: unknown }).type
        const type: 'image' | 'video' =
          rawType === 'video' || rawType === 'image' ? rawType : sniffType(url)
        return { url, type }
      })
      .filter((m): m is { url: string; type: 'image' | 'video' } => m !== null)
      .slice(0, 8)
    if (media.length === 0) {
      return NextResponse.json(
        { error: 'A moment needs at least one photo or video.' },
        { status: 400 },
      )
    }
    patch.media = media
  }
  if (body.audience === 'public' || body.audience === 'locker-room') {
    patch.audience = body.audience
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const viewerEmail = (session.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(viewerEmail)

  // Snapshot before the write — needed for the audience check and the
  // newly-tagged diff below.
  const before = await readStore()
  const existing = before.moments.find(m => m.id === id)
  if (!existing) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  if (patch.audience === 'locker-room' && existing.audience !== 'locker-room') {
    const account = await getAccountById(session.accountId)
    if (!account || !canSeeLockerRoomForAccount(account, before, existing.teamId)) {
      return NextResponse.json(
        { error: 'Locker Room posts are for current players and alumni only.' },
        { status: 403 },
      )
    }
  }

  const updated = await updateMoment(id, session.accountId, patch, isFounder)
  if (!updated) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }

  // Newly tagged members get the same personal ping POST sends — but only
  // the diff, and never for locker-room posts (existence leak). Additive;
  // never blocks the edit.
  if (
    (patch.taggedBookIds !== undefined || patch.taggedPersonIds !== undefined) &&
    updated.audience === 'public'
  ) {
    try {
      const oldIds = resolveTaggedAccountIds(
        before,
        existing.taggedPersonIds ?? [],
        existing.taggedBookIds ?? [],
      )
      const newIds = resolveTaggedAccountIds(
        before,
        updated.taggedPersonIds ?? [],
        updated.taggedBookIds ?? [],
      )
      const added = [...newIds].filter(aid => !oldIds.has(aid))
      if (added.length > 0) {
        const posterFirst = updated.postedByName.split(/\s+/)[0]
        await notifyMany(
          added,
          {
            type: 'new_moment',
            title: `${posterFirst} tagged you in a Moment`,
            body: updated.caption.slice(0, 120),
            href: '/moments',
          },
          { excludeAccountId: session.accountId },
        )
      }
    } catch (e) {
      console.warn('[moment-edit-notify] tag diff notify failed:', e)
    }
  }

  return NextResponse.json({ moment: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const viewerEmail = (session.user?.email ?? '').toLowerCase().trim()
  const ok = await deleteMoment(id, session.accountId, FOUNDER_EMAILS.has(viewerEmail))
  if (!ok) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
