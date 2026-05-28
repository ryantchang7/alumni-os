/**
 * Soft-delete one of your own Moment comments. Only the comment author
 * can delete; admin removal is a separate path.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteMomentComment } from '@/lib/store/local-store'

interface Ctx {
  params: Promise<{ id: string; commentId: string }>
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { commentId } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const ok = await deleteMomentComment(commentId, session.accountId)
  if (!ok) {
    return NextResponse.json(
      { error: 'Not found or not yours' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true })
}
