/**
 * Who hears about a gathering, and the sending itself.
 *
 * Lifted out of the POST route unchanged so an existing gathering can be
 * announced later without a second copy of this logic. Ryan needed to
 * post the NYC happy hour quietly, look at it, and then tell the club,
 * which the product could not do: notification only ever fired on
 * create, so the choice was mail everyone immediately or never.
 *
 * One copy, two callers: POST /api/gatherings on create, and
 * POST /api/internal/announce-gathering afterwards.
 */

import { ClubhouseGathering } from '@/lib/store/types'
import type { NotifyMode } from '@/lib/gatherings/nearby'

/**
 * In-app bell + web push + email to approved members in the same place.
 *
 * Never throws: a notification failure must not fail the post itself, or the
 * host sees an error for a round that was actually created.
 */
export async function notifyNearbyMembers(
  gathering: ClubhouseGathering,
  hostAccountId: string,
  mode: NotifyMode = 'nearby',
  inviteBookIds: string[] = [],
): Promise<void> {
  try {
    const { readStore } = await import('@/lib/store/local-store')
    const { notifyMany } = await import('@/lib/notifications/notify')
    const { selectNearbyRecipients, placeLabel, TYPE_LABEL } = await import('@/lib/gatherings/nearby')

    const store = await readStore()
    let recipients: typeof store.accounts
    // 'nearby' may widen to the whole club while the club is small; the email
    // says something different when it does, so the mode travels with it.
    let reach: 'nearby' | 'everyone' = 'nearby'
    if (mode === 'invite') {
      // Named guests only. Book ids are not store person ids, so resolve them
      // by name the same way the tee-sheet picker does.
      const { getMemberById } = await import('@/lib/member-book/data')
      const { normalizeName } = await import('@/lib/member-book/bridge')
      const wanted = new Set<string>()
      for (const id of inviteBookIds) {
        const entry = getMemberById(id)
        if (!entry) continue
        const target = normalizeName(entry.displayName)
        const person = store.people.find(pp => normalizeName(pp.canonicalName) === target)
        if (person) wanted.add(person.id)
      }
      recipients = store.accounts.filter(
        a => a.linkedPersonId && wanted.has(a.linkedPersonId) && a.id !== hostAccountId,
      )
    } else {
      const picked = selectNearbyRecipients({
        accounts: store.accounts,
        enrichments: store.personEnrichments,
        memberships: store.teamMemberships,
        gathering,
        hostAccountId,
      })
      recipients = picked.recipients
      reach = picked.reach
    }
    console.log(
      `[gatherings] "${gathering.title}" (${mode}/${reach}) in ${gathering.city ?? ''} ${gathering.state ?? ''}: notifying ${recipients.length}`,
    )
    if (recipients.length === 0) return

    const placeText = placeLabel(gathering)
    const typeLabel = TYPE_LABEL[gathering.type] ?? 'a round'
    const href = gathering.type === 'round' ? '/the-course' : '/19th-hole'

    await notifyMany(
      recipients.map(a => a.id),
      {
        type: 'new_round',
        title: `${gathering.hostName} is hosting ${typeLabel} in ${placeText}`,
        body: [gathering.dateText, gathering.timeText, gathering.venue].filter(Boolean).join(' · '),
        href,
      },
    )

    const withEmail = recipients.filter(a => a.email)
    if (withEmail.length === 0) return

    const { sendEmailBatch } = await import('@/lib/email/send')
    const { renderNewRoundEmail } = await import('@/lib/email/templates')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://penngolfclubhouse.com'
    const url = `${baseUrl}${href}`
    await sendEmailBatch(
      withEmail.map(a => {
        const { subject, html } = renderNewRoundEmail({
          recipientFirstName: a.name?.split(' ')[0] ?? null,
          hostName: gathering.hostName,
          title: gathering.title,
          typeLabel,
          placeText,
          venue: gathering.venue ?? null,
          dateText: gathering.dateText,
          timeText: gathering.timeText ?? null,
          description: gathering.description ?? null,
          imageUrl: gathering.imageUrl ?? null,
          clubWide: mode === 'nearby' && reach === 'everyone',
          url,
        })
        return { to: a.email, subject, html }
      }),
    )
  } catch (err) {
    console.warn('[gatherings] nearby notify failed (non-fatal):', err)
  }
}
