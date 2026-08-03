/**
 * Edit or delete one of your own chat messages.
 *
 * Sender-only, enforced in the store layer (updateChatMessage /
 * deleteChatMessage compare fromAccountId against the session). Delete is a
 * soft delete: the bubble stays as a tombstone so the other person's thread
 * doesn't silently reshuffle around them.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateChatMessage, deleteChatMessage } from '@/lib/store/local-store'

const BODY_MAX = 4000

interface Ctx {
  params: Promise<{ messageId: string }>
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { messageId } = await ctx.params
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  if (!body) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  if (body.length > BODY_MAX) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }
  const updated = await updateChatMessage(messageId, session.accountId, body)
  if (!updated) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  return NextResponse.json({ message: updated })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { messageId } = await ctx.params
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const ok = await deleteChatMessage(messageId, session.accountId)
  if (!ok) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
