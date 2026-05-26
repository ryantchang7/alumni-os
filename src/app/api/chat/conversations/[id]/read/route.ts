/**
 * Mark a conversation as read for the requester. Membership-gated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getChatConversationById,
  markChatConversationRead,
} from '@/lib/store/local-store'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const { id } = await params
  const convo = await getChatConversationById(id)
  if (!convo) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }
  if (!convo.memberAccountIds.includes(session.accountId)) {
    return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 })
  }
  await markChatConversationRead(id, session.accountId)
  return NextResponse.json({ ok: true })
}
