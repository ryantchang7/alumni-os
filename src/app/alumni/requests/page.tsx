'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'

interface AlumniProfile {
  personId: string
  canonicalName: string
  classLabel?: string
}

interface AlumniRequest {
  id: string
  fromName: string
  purposeKey: string
  purposeLabel: string
  contextKey?: string
  contextLabel?: string
  additionalContext?: string
  message: string
  status: 'requested' | 'seen' | 'accepted' | 'declined' | 'suggested' | 'responded' | 'closed'
  responseMessage?: string
  suggestedPersonId?: string
  suggestedPersonName?: string
  respondedAt?: string
  closedAt?: string
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'New',
  seen: 'Seen',
  accepted: 'Accepted',
  declined: 'Declined politely',
  suggested: 'Suggested another member',
  responded: 'Responded',
  closed: 'Closed',
}

const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-[#0a1628]/10 text-[#0a1628]',
  seen: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-gray-100 text-gray-500',
  suggested: 'bg-amber-50 text-amber-700',
  responded: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-500',
}

const DEFAULT_ACCEPT_MESSAGE = "Happy to help. Send over a few times that work for you and we'll find a time."
const DEFAULT_DECLINE_MESSAGE = "Thanks for reaching out. I'm not able to help right now, but I appreciate the thoughtful note and wish you the best."
const DEFAULT_SUGGEST_PREFIX = "I may not be the best fit here, but I'd suggest reaching out to"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RequestCard({
  req,
  updatingId,
  onUpdate,
  profiles,
}: {
  req: AlumniRequest
  updatingId: string | null
  onUpdate: (
    id: string,
    status: AlumniRequest['status'],
    extra?: { responseMessage?: string; suggestedPersonId?: string; suggestedPersonName?: string }
  ) => void
  profiles: AlumniProfile[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [action, setAction] = useState<null | 'accept' | 'decline' | 'suggest'>(null)
  const [responseText, setResponseText] = useState('')
  const [suggestId, setSuggestId] = useState('')
  const [suggestName, setSuggestName] = useState('')

  const isTerminal = req.status === 'closed' || req.status === 'declined'
  const hasResponded = ['accepted', 'declined', 'suggested', 'responded'].includes(req.status)

  function openAction(a: 'accept' | 'decline' | 'suggest') {
    setAction(a)
    if (a === 'accept') setResponseText(DEFAULT_ACCEPT_MESSAGE)
    if (a === 'decline') setResponseText(DEFAULT_DECLINE_MESSAGE)
    if (a === 'suggest') {
      setResponseText('')
      setSuggestId('')
      setSuggestName('')
    }
  }

  function handleSubmitAction() {
    if (action === 'accept') {
      onUpdate(req.id, 'accepted', { responseMessage: responseText.trim() || undefined })
    } else if (action === 'decline') {
      onUpdate(req.id, 'declined', { responseMessage: responseText.trim() || undefined })
    } else if (action === 'suggest') {
      const name = suggestId
        ? profiles.find(p => p.personId === suggestId)?.canonicalName ?? suggestName
        : suggestName
      const msgBase = name ? `${DEFAULT_SUGGEST_PREFIX} ${name}.` : ''
      const finalMsg = responseText.trim() || msgBase
      onUpdate(req.id, 'suggested', {
        responseMessage: finalMsg || undefined,
        suggestedPersonId: suggestId || undefined,
        suggestedPersonName: name || undefined,
      })
    }
    setAction(null)
  }

  const otherProfiles = profiles.filter(p => p.personId !== req.id)

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-[#0a1628]">{req.fromName}</p>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-500'}`}
            >
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-medium text-[#3a4657] bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
              {req.purposeLabel}
            </span>
            {req.contextLabel && (
              <span className="text-xs text-ink-muted bg-[#f5f2ee] border border-[rgba(180,168,150,0.3)] px-2 py-0.5 rounded-full">
                {req.contextLabel}
              </span>
            )}
            <span className="text-xs text-ink-muted">{formatDate(req.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Additional context note */}
      {req.additionalContext && (
        <div className="mt-3 px-3 py-2.5 bg-[#fbf9f6] border border-[rgba(180,168,150,0.35)] rounded-lg">
          <p className="text-xs text-ink-muted font-medium mb-0.5 uppercase tracking-wide">Additional context</p>
          <p className="text-xs text-[#2d3748] leading-relaxed">{req.additionalContext}</p>
        </div>
      )}

      {/* Message */}
      <div className="mt-3">
        <p
          className={`text-sm text-[#2d3748] leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}
        >
          {req.message}
        </p>
        {req.message.length > 200 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-[#990000] hover:underline mt-1"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Previous response (if already responded) */}
      {req.responseMessage && (
        <div className="mt-3 px-3 py-2.5 bg-[#f0faf5] border border-[#2d6a4f]/20 rounded-lg">
          <p className="text-xs text-[#2d6a4f] font-medium mb-0.5 uppercase tracking-wide">Your response</p>
          <p className="text-xs text-[#2d3748] leading-relaxed italic">&ldquo;{req.responseMessage}&rdquo;</p>
          {req.respondedAt && (
            <p className="text-[11px] text-ink-muted mt-1">{formatDate(req.respondedAt)}</p>
          )}
        </div>
      )}
      {req.suggestedPersonName && !req.responseMessage && (
        <div className="mt-3 px-3 py-2.5 bg-[#fbf9f6] border border-[rgba(180,168,150,0.35)] rounded-lg">
          <p className="text-xs text-ink-muted font-medium mb-0.5">Suggested:</p>
          <p className="text-xs text-[#0a1628] font-semibold">{req.suggestedPersonName}</p>
        </div>
      )}

      {/* Inline action panel */}
      {action && (
        <div className="mt-4 pt-4 border-t border-[rgba(180,168,150,0.25)]">
          {(action === 'accept' || action === 'decline') && (
            <>
              <p className="text-xs font-semibold text-[#0a1628] mb-2">
                {action === 'accept' ? 'Your response to ' : 'Decline note for '}{req.fromName}
              </p>
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full text-sm text-[#0a1628] bg-[#fbf9f6] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-[#0a1628] transition-colors"
              />
              <p className="text-[11px] text-ink-muted mt-1">{responseText.length}/1000</p>
            </>
          )}
          {action === 'suggest' && (
            <>
              <p className="text-xs font-semibold text-[#0a1628] mb-2">Suggest another Penn Golf member</p>
              {otherProfiles.length > 0 && (
                <select
                  value={suggestId}
                  onChange={e => setSuggestId(e.target.value)}
                  className="w-full text-sm text-[#0a1628] bg-[#fbf9f6] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 mb-2 focus:outline-none focus:border-[#0a1628] transition-colors"
                >
                  <option value="">Select a member…</option>
                  {otherProfiles.map(p => (
                    <option key={p.personId} value={p.personId}>
                      {p.canonicalName}{p.classLabel ? ` — ${p.classLabel}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder={suggestId
                  ? `${DEFAULT_SUGGEST_PREFIX} ${profiles.find(p => p.personId === suggestId)?.canonicalName ?? '…'}.`
                  : 'Optional note to the player…'}
                className="w-full text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#fbf9f6] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 resize-none focus:outline-none focus:border-[#0a1628] transition-colors"
              />
            </>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={updatingId === req.id || (action === 'suggest' && !suggestId && !suggestName)}
              onClick={handleSubmitAction}
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
                action === 'decline'
                  ? 'bg-[#f5f2ee] text-[#0a1628] border border-[rgba(180,168,150,0.6)] hover:border-[#0a1628]'
                  : 'bg-[#0a1628] text-white hover:bg-[#0a1628]/85'
              }`}
            >
              {action === 'accept' ? 'Send acceptance' : action === 'decline' ? 'Send decline' : 'Suggest member'}
            </button>
            <button
              type="button"
              onClick={() => setAction(null)}
              className="text-xs text-ink-muted hover:text-[#0a1628] px-3 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!action && !isTerminal && !hasResponded && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(180,168,150,0.25)] flex-wrap">
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => openAction('accept')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#245a41] transition-colors disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => openAction('suggest')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50 bg-white"
          >
            Suggest another member
          </button>
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => openAction('decline')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#8a7f70] text-ink-muted transition-colors disabled:opacity-50 bg-white"
          >
            Decline politely
          </button>
          <div className="ml-auto flex gap-2">
            {req.status === 'requested' && (
              <button
                type="button"
                disabled={updatingId === req.id}
                onClick={() => onUpdate(req.id, 'seen')}
                className="text-xs text-ink-muted hover:text-[#0a1628] transition-colors disabled:opacity-50"
              >
                Mark seen
              </button>
            )}
            <button
              type="button"
              disabled={updatingId === req.id}
              onClick={() => onUpdate(req.id, 'closed')}
              className="text-xs text-ink-muted hover:text-[#0a1628] transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Post-response secondary actions */}
      {!action && hasResponded && req.status !== 'closed' && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[rgba(180,168,150,0.25)]">
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => onUpdate(req.id, 'responded')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] text-[#0a1628] transition-colors disabled:opacity-50 bg-white"
          >
            Mark responded
          </button>
          <button
            type="button"
            disabled={updatingId === req.id}
            onClick={() => onUpdate(req.id, 'closed')}
            className="text-xs text-ink-muted hover:text-[#0a1628] transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

function AlumniRequestsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  const teamSlug = searchParams.get('teamSlug') ?? 'penn-mens-golf'
  // Inbox is bound to the signed-in account, never a URL param.
  const personId = session?.linkedPersonId ?? ''

  const [profiles, setProfiles] = useState<AlumniProfile[]>([])
  const [requests, setRequests] = useState<AlumniRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/player/profiles?teamSlug=${teamSlug}`)
      .then(r => r.json())
      .then(data => setProfiles(
        (data.profiles ?? []).filter((p: AlumniProfile) => p.personId !== personId)
      ))
      .catch(() => setProfiles([]))
  }, [teamSlug, personId])

  useEffect(() => {
    if (!personId) return
    setLoading(true)
    setError(null)
    fetch(`/api/alumni/requests?teamSlug=${teamSlug}&personId=${personId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`)
        return r.json()
      })
      .then(data => {
        setRequests(data.requests ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load requests')
        setLoading(false)
      })
  }, [teamSlug, personId])

  async function handleUpdate(
    requestId: string,
    status: AlumniRequest['status'],
    extra?: { responseMessage?: string; suggestedPersonId?: string; suggestedPersonName?: string },
  ) {
    setUpdatingId(requestId)
    try {
      const res = await fetch('/api/alumni/requests/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSlug, personId, requestId, status, ...extra }),
      })
      if (!res.ok) throw new Error('Update failed')
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? {
                ...r,
                status,
                responseMessage: extra?.responseMessage ?? r.responseMessage,
                suggestedPersonId: extra?.suggestedPersonId ?? r.suggestedPersonId,
                suggestedPersonName: extra?.suggestedPersonName ?? r.suggestedPersonName,
                respondedAt: ['accepted', 'declined', 'suggested', 'responded'].includes(status)
                  ? (r.respondedAt ?? new Date().toISOString())
                  : r.respondedAt,
              }
            : r,
        ),
      )
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedProfile = profiles.find(p => p.personId === personId)

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <Link
            href="/account/profile"
            className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block"
          >
            &larr; Your Profile
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight mt-1">
            Your Clubhouse Inbox
          </h1>
          {selectedProfile ? (
            <p className="text-gray-400 text-sm mt-2">
              {selectedProfile.canonicalName}
              {selectedProfile.classLabel ? ` · ${selectedProfile.classLabel}` : ''}
            </p>
          ) : (
            <p className="text-gray-400 text-sm mt-2">
              Sign in to view notes and intros sent to you.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-4">

          {/* Not signed in */}
          {sessionStatus !== 'loading' && !session && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628] mb-1">Sign in to see your inbox</p>
              <p className="text-xs text-ink-muted mb-4">
                Your inbox holds notes and intros sent to you by other Penn Golf members.
              </p>
              <button
                type="button"
                onClick={() => router.push('/login?next=/alumni/requests')}
                className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {/* Signed in but no linked profile */}
          {sessionStatus === 'authenticated' && session && !personId && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628] mb-1">Claim your profile first</p>
              <p className="text-xs text-ink-muted mb-4">
                Find your card in the Member Book to start receiving messages.
              </p>
              <Link
                href="/account/setup"
                className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Find your card
              </Link>
            </div>
          )}

          {/* Requests list */}
          {personId && (
            <>
              {loading && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm text-ink-muted">Loading requests…</p>
                </div>
              )}

              {error && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm text-[#990000]">{error}</p>
                </div>
              )}

              {!loading && !error && requests.length === 0 && (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <p className="text-base font-semibold text-[#0a1628] mb-2">Your inbox is clear.</p>
                  <p className="text-sm text-ink-muted max-w-sm mx-auto">
                    Notes and intros from other Penn Golf members will land here.
                  </p>
                </div>
              )}

              {!loading &&
                requests.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    updatingId={updatingId}
                    onUpdate={handleUpdate}
                    profiles={profiles}
                  />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AlumniRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbf9f6] py-20 text-center">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <AlumniRequestsInner />
    </Suspense>
  )
}
