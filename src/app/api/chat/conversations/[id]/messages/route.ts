/**
 * Messages within a chat conversation. Membership-gated.
 * GET supports ?since=ISO for delta polling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getChatConversationById,
  listChatMessages,
  createChatMessage,
  getAccountById,
  readStore,
} from '@/lib/store/local-store'
import { notifyMany } from '@/lib/notifications/notify'

const BODY_MIN = 1
const BODY_MAX = 4000

interface RouteParams {
  params: Promise<{ id: string }>
}

async function gate(req: NextRequest, params: RouteParams['params']) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return { error: NextResponse.json({ error: 'Approved members only' }, { status: 403 }) }
  }
  const { id } = await params
  const convo = await getChatConversationById(id)
  if (!convo) {
    return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) }
  }
  if (!convo.memberAccountIds.includes(session.accountId)) {
    return { error: NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 }) }
  }
  return { session, convo }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const g = await gate(req, params)
  if ('error' in g) return g.error
  const since = req.nextUrl.searchParams.get('since') ?? undefined
  const messages = await listChatMessages(g.convo.id, since)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const g = await gate(req, params)
  if ('error' in g) return g.error

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = typeof body.body === 'string' ? body.body.trim() : ''
  if (raw.length < BODY_MIN) {
    return NextResponse.json({ error: 'Message body required' }, { status: 400 })
  }
  if (raw.length > BODY_MAX) {
    return NextResponse.json({ error: `Message too long (max ${BODY_MAX})` }, { status: 400 })
  }

  // Snapshot sender name from the linked person.
  const account = await getAccountById(g.session.accountId!)
  const store = await readStore()
  const person = account?.linkedPersonId
    ? store.people.find(p => p.id === account.linkedPersonId)
    : undefined
  const fromName = person?.canonicalName ?? account?.name ?? 'Penn Golf Member'

  const message = await createChatMessage({
    conversationId: g.convo.id,
    teamId: g.convo.teamId,
    fromAccountId: g.session.accountId!,
    fromName,
    body: raw,
  })
  if (!message) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }

  // Notify the other participants. Type 'request' (personal — ignores the
  // community mute). Additive; notifyMany swallows its own errors.
  await notifyMany(
    g.convo.memberAccountIds,
    {
      type: 'request',
      title: `New message from ${fromName}`,
      body: raw.slice(0, 120),
      href: `/chat/${g.convo.id}`,
    },
    { excludeAccountId: g.session.accountId! },
  )

  return NextResponse.json({ message }, { status: 201 })
}
