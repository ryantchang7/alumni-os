/**
 * One invite, sent by a member, in their own words.
 *
 * Thirteen people joined in a day because one alum told three others, in a
 * normal email, who he was and when he played. Nothing in the product asked
 * him to; he just did it. This is that, made one tap.
 *
 * The message therefore has to read like it came from a person. The old copy
 * was "Hey Rich, claim your spot in the Penn Golf Clubhouse, takes 30 sec" and
 * named nobody: an SMS from an unrecognised number with a bare link, which is
 * indistinguishable from spam. Naming the sender and the seasons they shared
 * is the whole difference between a forward and a delete.
 */

/** Where the invite points. Their own card when there is one, else the door. */
export function inviteUrl(bookId?: string | null): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.penngolfclubhouse.com'
  return bookId ? `${origin}/member-book/${encodeURIComponent(bookId)}` : origin
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export interface InviteSubject {
  name: string
  bookId?: string | null
  /** Shared roster years, when the two of them overlapped. */
  overlapStart?: number
  overlapEnd?: number
}

/**
 * Written to be forwarded. Shared years go in when we know them, because
 * "we played together in 1987" is the line that makes it personal and is the
 * one thing a stranger's link can never carry.
 */
export function buildInviteMessage(subject: InviteSubject, fromName?: string | null): string {
  const url = inviteUrl(subject.bookId)
  // Everything after the greeting is a continuation of "Hey Rich, ...", so
  // each clause starts lowercase and the first one in use gets capitalised.
  const clauses: string[] = []
  if (fromName?.trim()) clauses.push(`it's ${fromName.trim()}.`)
  if (subject.overlapStart && subject.overlapEnd) {
    clauses.push(
      subject.overlapStart === subject.overlapEnd
        ? `we were on the roster together in ${subject.overlapStart}.`
        : `we were on the roster together ${subject.overlapStart}-${subject.overlapEnd}.`,
    )
  }
  clauses.push(
    subject.bookId
      ? 'Penn Golf has put every player and alum in one place and your card is already there, it just needs claiming.'
      : 'Penn Golf has put every player and alum in one place, worth a look.',
  )

  // The first clause continues the greeting so it stays lowercase; every
  // clause after it follows a full stop and takes a capital.
  const body = clauses
    .map((c, i) => (i === 0 ? c : c.charAt(0).toUpperCase() + c.slice(1)))
    .join(' ')
  return `Hey ${firstName(subject.name)}, ${body} ${url}`
}

/**
 * Hand the message to whatever the member already sends things with: the
 * share sheet on a phone, an SMS draft on a desktop, the clipboard if both
 * are refused. Never fails loudly — a cancelled share sheet is a decision,
 * not an error.
 */
export async function shareInvite(
  subject: InviteSubject,
  fromName?: string | null,
): Promise<'shared' | 'copied' | 'manual'> {
  const message = buildInviteMessage(subject, fromName)
  const url = inviteUrl(subject.bookId)

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: message, url })
      return 'shared'
    } catch {
      // Cancelled, or the sheet refused the payload. Fall through to copy so
      // the tap is never a dead end.
    }
  }

  try {
    await navigator.clipboard.writeText(message)
    // Offer the SMS draft as well, but only after the copy has landed: on
    // desktop the sms: navigation can tear down the page mid-write.
    if (typeof window !== 'undefined') {
      window.open(`sms:?&body=${encodeURIComponent(message)}`, '_self')
    }
    return 'copied'
  } catch {
    return 'manual'
  }
}
