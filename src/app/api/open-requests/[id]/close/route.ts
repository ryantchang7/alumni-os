/**
 * Owner-only close for an Open Request. Closing soft-flips status to
 * 'closed' so it disappears from the public strips but stays in the
 * member's own request history.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { closeOpenRequest } from '@/lib/store/local-store'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const ok = await closeOpenRequest(id, session.accountId)
  if (!ok) {
    return NextResponse.json(
      { error: 'Not found or not yours' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true })
}
