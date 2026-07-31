/**
 * Take down one of your own Moments (public wall or Locker Room) — in case
 * it was posted by mistake. Author-only soft-delete (status → 'removed');
 * admin/founder moderation is a separate path.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteMoment, updateMoment } from '@/lib/store/local-store'
import { FOUNDER_EMAILS } from '@/lib/badges'

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

/** Edit your own Moment — caption, tags, and/or media (photos + videos,
 *  max 8, min 1). Poster-only; the founder can also edit any post. */
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
    media?: { url: string; type: 'image' | 'video' }[]
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
  if (patch.caption === undefined && patch.taggedBookIds === undefined && patch.media === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }
  const viewerEmail = (session.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(viewerEmail)
  const updated = await updateMoment(id, session.accountId, patch, isFounder)
  if (!updated) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  return NextResponse.json({ moment: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const ok = await deleteMoment(id, session.accountId)
  if (!ok) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
