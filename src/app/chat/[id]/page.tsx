import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import {
  getChatConversationById,
  listChatMessages,
  readStore,
} from '@/lib/store/local-store'
import ChatThreadClient from './ChatThreadClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChatThreadPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.accountId) {
    redirect('/login?next=/chat')
  }
  if (!session.linkedPersonId) {
    redirect('/account/setup')
  }

  const { id } = await params
  const convo = await getChatConversationById(id)
  if (!convo) notFound()
  if (!convo.memberAccountIds.includes(session.accountId)) notFound()

  const initialMessages = await listChatMessages(id)
  const store = await readStore()
  const accountById = new Map(store.accounts.map(a => [a.id, a]))
  const personById = new Map(store.people.map(p => [p.id, p]))

  const otherNames = convo.memberAccountIds
    .filter(aid => aid !== session.accountId)
    .map(aid => {
      const acct = accountById.get(aid)
      const person = acct?.linkedPersonId ? personById.get(acct.linkedPersonId) : undefined
      return person?.canonicalName ?? acct?.name ?? 'Member'
    })

  const title =
    convo.type === 'group'
      ? convo.name?.trim() || otherNames.join(', ')
      : otherNames[0] ?? 'Direct message'

  return (
    <ChatThreadClient
      conversationId={convo.id}
      title={title}
      subtitle={
        convo.type === 'group'
          ? `Group · ${convo.memberAccountIds.length} members`
          : 'Direct message'
      }
      currentAccountId={session.accountId}
      initialMessages={initialMessages}
    />
  )
}
