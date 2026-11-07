'use client'

/**
 * Your Era — the teammates whose roster years overlapped yours: who is here
 * (one-tap hello via chat) and who is missing (one-tap invite) — plus Your
 * People, for the members that cannot reach.
 *
 * Roster overlap was the only personal thing on /player, so a Penn alum who
 * plays golf but never played for Penn saw an empty page: no era, no
 * teammates, nothing. Since that door opened they are the fastest-growing
 * kind of member. Your People matches them on the course they play, the
 * city they live in and the work they do, which is what they actually share
 * with the room. It renders for everyone, under the era list when there is
 * one.
 *
 * The invite used to be a link to /invite, which is an alphabetical list of
 * every unclaimed member. So the loop broke exactly where it was working: a
 * member had just picked out one specific teammate, and was then sent to a
 * 370-name page to find them again. The button now sends the invite from
 * here, naming the sender and the seasons the two of them shared.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import RespondButton from './RespondButton'
import { shareInvite } from '@/lib/invite/share'

interface EraTeammate {
  personId: string
  name: string
  photoUrl: string | null
  classLabel: string | null
  overlapStart: number
  overlapEnd: number
  claimed: boolean
  accountId: string | null
  bookId: string | null
}

interface Neighbour {
  personId: string
  name: string
  photoUrl: string | null
  reason: string
  score: number
  accountId: string | null
  bookId: string | null
}

interface EraResponse {
  eraLabel: string | null
  hereCount: number
  viewerName: string | null
  /** The viewer's own program. Profile links 404 on the wrong one. */
  teamSlug: string | null
  teammates: EraTeammate[]
  neighbours?: Neighbour[]
  /** False when the viewer's own card has no course, city, industry or
   *  state on it, so they match nobody and there is nothing to show them
   *  except the reason why. */
  viewerHasMatchableCard?: boolean
}

const SHOW_MAX = 8

function overlapText(t: EraTeammate): string {
  return t.overlapStart === t.overlapEnd
    ? `Played together in ${t.overlapStart}`
    : `Played together ${t.overlapStart}–${String(t.overlapEnd).slice(2)}`
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name
}

/** Open with the thing the two of them actually have in common, so the
 *  first message is not "hi". */
function helloKickoff(n: Neighbour): string {
  const f = firstName(n.name)
  if (n.reason.startsWith('Plays out of ')) {
    return `Hey ${f}, saw we both play out of ${n.reason.slice(13)}. `
  }
  if (n.reason.startsWith('In ')) {
    return `Hey ${f}, saw you are in ${n.reason.slice(3)} too. `
  }
  return `Hey ${f}, saw you in the Clubhouse. `
}

export default function YourEraSection({ approved }: { approved: boolean }) {
  const [data, setData] = useState<EraResponse | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, true>>({})

  async function invite(t: EraTeammate) {
    const result = await shareInvite(
      {
        name: t.name,
        bookId: t.bookId,
        overlapStart: t.overlapStart,
        overlapEnd: t.overlapEnd,
      },
      data?.viewerName,
    )
    // Marked only on a real hand-off. A cancelled share sheet should leave
    // the button offering to try again, not claiming it is done.
    if (result !== 'manual') setSent(s => ({ ...s, [t.bookId ?? t.personId]: true }))
    setToast(
      result === 'shared'
        ? `Invite ready for ${firstName(t.name)}`
        : result === 'copied'
          ? 'Message copied, paste it wherever you two talk'
          : 'Could not open your share sheet',
    )
    setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    if (!approved) return
    fetch('/api/player/your-era', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setData(d))
      .catch(() => setData(null))
  }, [approved])

  if (!approved || !data) return null

  const hasEra = data.teammates.length > 0
  const neighbours = data.neighbours ?? []
  const hasNeighbours = neighbours.length > 0
  // Nothing to say and nothing to ask for: stay silent, as before.
  if (!hasEra && !hasNeighbours && data.viewerHasMatchableCard !== false) return null

  const shown = data.teammates.slice(0, SHOW_MAX)
  const missingCount = data.teammates.length - data.hereCount

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="pb-8"
      data-testid="your-era-section"
    >
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a1628] text-white text-[12.5px] font-medium px-5 py-2.5 rounded-full shadow-lg max-w-[88vw] text-center"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
      {hasEra && (
      <>
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <Users className="w-4 h-4 text-[#c8a84b] self-center" />
        <h2 className="text-base font-semibold text-[#0a1628]">Your Era</h2>
        {data.eraLabel && (
          <p className="text-[12px] text-ink-muted italic ml-1">
           On the roster with you, {data.eraLabel}
          </p>
        )}
      </div>
      <p className="text-[12.5px] text-[#3d4a5c] mb-3">
        {data.hereCount > 0 ? (
          <>
            <span className="font-semibold text-[#0a1628]">{data.hereCount}</span>{' '}
            {data.hereCount === 1 ? 'is' : 'are'} in the Clubhouse
            {missingCount > 0 && (
              <>
                {' '}&middot; {missingCount} {missingCount === 1 ? 'is' : 'are'} still missing. {' '}
                <Link href="/invite" className="text-[#990000] hover:underline font-medium">
                  pull them in
                </Link>
              </>
            )}
            .
          </>
        ) : (
          <>
            None of them are in yet. {' '}
            <Link href="/invite" className="text-[#990000] hover:underline font-medium">
              be the one who pulls them in
            </Link>
            .
          </>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shown.map(t => (
          <div
            key={t.personId}
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-4 py-3.5 flex flex-col"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <MemberAvatar photoUrl={t.photoUrl} name={t.name} size={40} />
              <div className="min-w-0">
                <Link
                  href={
                    t.bookId
                      ? `/member-book/${encodeURIComponent(t.bookId)}`
                      : `/player/alumni/${encodeURIComponent(t.personId)}?teamSlug=${encodeURIComponent(data.teamSlug ?? 'penn-mens-golf')}`
                  }
                  className="block text-[#0a1628] text-[14.5px] leading-snug truncate hover:underline font-heading"
                >
                  {t.name}
                </Link>
                <p className="text-[11px] text-ink-muted truncate">
                  {overlapText(t)}
                  {t.classLabel ? ` · ${t.classLabel}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-2">
              {t.claimed && t.accountId ? (
                <RespondButton
                  targetAccountId={t.accountId}
                  label="Say hello"
                  kickoff={`Hey ${firstName(t.name)}, saw you in the Clubhouse, been a while. `}
                  bgColor="#0a1628"
                  className="w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => invite(t)}
                  className="inline-flex w-full items-center justify-center text-[11.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-2 rounded-lg border border-[#0a1628]/25 text-[#3d4a5c] hover:bg-[#0a1628] hover:text-white transition-colors"
                >
                  {sent[t.bookId ?? t.personId] ? 'Invite sent' : 'Not in yet, invite'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.teammates.length > SHOW_MAX && (
        <p className="text-[11.5px] text-ink-muted mt-2.5">
          + {data.teammates.length - SHOW_MAX} more from your era in the{' '}
          <Link href="/member-book" className="text-[#990000] hover:underline">
            Member Book
          </Link>
          .
        </p>
      )}
      </>
      )}

      {/* Your People — the match for everyone the roster cannot place. */}
      {hasNeighbours && (
        <div className={hasEra ? 'mt-8 pt-7 border-t border-[rgba(180,168,150,0.4)]' : ''}>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <MapPin className="w-4 h-4 text-[#c8a84b] self-center" />
            <h2 className="text-base font-semibold text-[#0a1628]">Your People</h2>
            <p className="text-[12px] text-ink-muted italic ml-1">
              Not by roster year, by where you play, live and work
            </p>
          </div>
          <p className="text-[12.5px] text-[#3d4a5c] mb-3">
            <span className="font-semibold text-[#0a1628]">{neighbours.length}</span>{' '}
            {neighbours.length === 1 ? 'member has' : 'members have'} something in
            common with your card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {neighbours.slice(0, SHOW_MAX).map(n => (
              <div
                key={n.personId}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-4 py-3.5 flex flex-col"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                data-testid="your-people-card"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <MemberAvatar photoUrl={n.photoUrl} name={n.name} size={40} />
                  <div className="min-w-0">
                    <Link
                      href={
                        n.bookId
                          ? `/member-book/${encodeURIComponent(n.bookId)}`
                          : `/player/alumni/${encodeURIComponent(n.personId)}?teamSlug=${encodeURIComponent(data.teamSlug ?? 'penn-mens-golf')}`
                      }
                      className="block text-[#0a1628] text-[14.5px] leading-snug truncate hover:underline font-heading"
                    >
                      {n.name}
                    </Link>
                    <p className="text-[11px] text-ink-muted truncate">{n.reason}</p>
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  {n.accountId && (
                    <RespondButton
                      targetAccountId={n.accountId}
                      label="Say hello"
                      kickoff={helloKickoff(n)}
                      bgColor="#0a1628"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {neighbours.length > SHOW_MAX && (
            <p className="text-[11.5px] text-ink-muted mt-2.5">
              + {neighbours.length - SHOW_MAX} more in the{' '}
              <Link href="/member-map" className="text-[#990000] hover:underline">
                Member Map
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {/* Nothing matched because nothing was filled in. Say so plainly
          rather than rendering an empty page. */}
      {!hasEra && !hasNeighbours && data.viewerHasMatchableCard === false && (
        <div
          className="bg-white border border-[#c8a84b]/40 rounded-xl px-5 py-5"
          style={{ boxShadow: '0 1px 3px rgba(200,168,75,0.14)' }}
          data-testid="your-people-empty"
        >
          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
            <MapPin className="w-4 h-4 text-[#c8a84b] self-center" />
            <h2 className="text-base font-semibold text-[#0a1628]">Your People</h2>
          </div>
          <p className="text-[13px] text-[#3d4a5c] leading-relaxed max-w-[62ch]">
            We match members on the course they play, the city they live in and
            the work they do. Your card has none of those yet, so there is
            nobody to show you.
          </p>
          <Link
            href="/member-book"
            className="inline-block mt-3 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline"
          >
            Fill in your card &rarr;
          </Link>
        </div>
      )}
    </motion.section>
  )
}
