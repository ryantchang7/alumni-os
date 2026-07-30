/**
 * DELETE /api/chat/conversations/[id] — delete a conversation (and all its
 * messages) for everyone in it. Participants only.
 */

import { NextResponse } from 'next/server'
import { requireApprovedMember } from '@/lib/auth/guards'
import { deleteChatConversation } from '@/lib/store/local-store'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireApprovedMember()
  if (!gate.ok) return gate.response
  const accountId = gate.session.accountId
  if (!accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const { id } = await params
  const deleted = await deleteChatConversation(id, accountId)
  if (!deleted) {
    return NextResponse.json(
      { error: 'Conversation not found, or you are not in it.' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true })
}
