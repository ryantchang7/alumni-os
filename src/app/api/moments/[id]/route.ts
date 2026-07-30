/**
 * Take down one of your own Moments (public wall or Locker Room) — in case
 * it was posted by mistake. Author-only soft-delete (status → 'removed');
 * admin/founder moderation is a separate path.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteMoment, updateMoment } from '@/lib/store/local-store'

interface Ctx {
  params: Promise<{ id: string }>
}

/** Edit your own Moment — caption and/or tags. Poster-only. */
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
  const patch: { caption?: string; taggedBookIds?: string[] } = {}
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
  if (patch.caption === undefined && patch.taggedBookIds === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }
  const updated = await updateMoment(id, session.accountId, patch)
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
