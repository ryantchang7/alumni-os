/**
 * Chat conversations: list mine + create new (1-on-1 or group).
 *
 * Auth: signed in + linkedPersonId (approved member only).
 * Target members must also be linked + on the same team.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  readStore,
  getTeamBySlug,
  listChatConversationsForAccount,
  createChatConversation,
  getAccountById,
} from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'
const NAME_MAX = 80

export async function GET() {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ conversations: [] })

  const conversations = await listChatConversationsForAccount(session.accountId, team.id)
  const store = await readStore()
  const accountById = new Map(store.accounts.map(a => [a.id, a]))
  const personById = new Map(store.people.map(p => [p.id, p]))

  const enriched = conversations.map(c => {
    const others = c.memberAccountIds
      .filter(id => id !== session.accountId)
      .map(id => {
        const acct = accountById.get(id)
        const person = acct?.linkedPersonId ? personById.get(acct.linkedPersonId) : undefined
        return person?.canonicalName ?? acct?.name ?? 'Unknown'
      })

    const msgs = store.chatMessages.filter(m => m.conversationId === c.id)
    msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const last = msgs[msgs.length - 1]
    const unreadCount = msgs.filter(
      m => !m.readByAccountIds.includes(session.accountId!) && m.fromAccountId !== session.accountId,
    ).length

    const title =
      c.type === 'group'
        ? c.name?.trim() || others.join(', ')
        : others[0] ?? 'Direct message'

    return {
      id: c.id,
      type: c.type,
      title,
      otherMemberNames: others,
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: last?.body.slice(0, 120),
      lastMessageFromName: last?.fromName,
      unreadCount,
    }
  })

  return NextResponse.json({ conversations: enriched })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId || !session.linkedPersonId) {
    return NextResponse.json({ error: 'Approved members only' }, { status: 403 })
  }
  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawIds = Array.isArray(body.memberAccountIds) ? body.memberAccountIds : []
  const targetIds = rawIds
    .filter((x): x is string => typeof x === 'string')
    .filter(id => id !== session.accountId)
  if (targetIds.length === 0) {
    return NextResponse.json({ error: 'Pick at least one member' }, { status: 400 })
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : ''
  const name = rawName ? rawName.slice(0, NAME_MAX) : undefined

  // Verify each target is a linked + same-team account.
  const store = await readStore()
  for (const id of targetIds) {
    const acct = store.accounts.find(a => a.id === id)
    if (!acct || acct.teamId !== team.id || !acct.linkedPersonId) {
      return NextResponse.json(
        { error: 'One or more selected members are not on this team or not approved.' },
        { status: 400 },
      )
    }
  }

  const memberAccountIds = [session.accountId, ...targetIds]
  const type: 'direct' | 'group' = targetIds.length === 1 ? 'direct' : 'group'

  const convo = await createChatConversation({
    teamId: team.id,
    type,
    name: type === 'group' ? name : undefined,
    memberAccountIds,
    createdByAccountId: session.accountId,
  })

  // Bonus: confirm sender's account exists (defensive)
  void (await getAccountById(session.accountId))

  return NextResponse.json({ conversation: convo }, { status: 201 })
}
