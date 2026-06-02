/**
 * Take down one of your own Moments (public wall or Locker Room) — in case
 * it was posted by mistake. Author-only soft-delete (status → 'removed');
 * admin/founder moderation is a separate path.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteMoment } from '@/lib/store/local-store'

interface Ctx {
  params: Promise<{ id: string }>
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
