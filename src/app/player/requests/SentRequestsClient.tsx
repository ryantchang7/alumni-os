'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SentRequest {
  id: string
  alumniPersonId: string
  alumniName: string
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
  createdAt: string
  respondedAt?: string
  closedAt?: string
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'Waiting for response',
  seen: 'Seen',
  accepted: 'Accepted',
  declined: 'Declined politely',
  suggested: 'Suggested another member',
  responded: 'Responded',
  closed: 'Closed',
}

const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-[#0a1628]/8 text-[#0a1628] border border-[#0a1628]/15',
  seen: 'bg-[#f5f2ee] text-[#8a7f70] border border-[rgba(180,168,150,0.5)]',
  accepted: 'bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/25',
  declined: 'bg-[#f5f2ee] text-[#8a7f70] border border-[rgba(180,168,150,0.5)]',
  suggested: 'bg-[#c8a84b]/10 text-[#7a6020] border border-[#c8a84b]/30',
  responded: 'bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/25',
  closed: 'bg-[#f5f2ee] text-[#8a7f70] border border-[rgba(180,168,150,0.5)]',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function SentRequestCard({ req }: { req: SentRequest }) {
  const [expanded, setExpanded] = useState(false)
  const statusLabel = STATUS_LABEL[req.status] ?? req.status
  const statusColor = STATUS_COLOR[req.status] ?? STATUS_COLOR.requested
  const hasResponse = req.responseMessage || req.suggestedPersonName || req.suggestedPersonId

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/player/alumni/${req.alumniPersonId}`}
              className="font-semibold text-[#0a1628] text-sm hover:underline"
            >
              {req.alumniName}
            </Link>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[#4a5568] bg-[#f5f2ee] border border-[rgba(180,168,150,0.4)] px-2 py-0.5 rounded-full">
              {req.purposeLabel}
            </span>
            {req.contextLabel && (
              <span className="text-xs text-[#8a7f70] bg-[#f5f2ee] border border-[rgba(180,168,150,0.3)] px-2 py-0.5 rounded-full">
                {req.contextLabel}
              </span>
            )}
            <span className="text-xs text-[#8a7f70]">{formatDate(req.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Your message */}
      <div className="mb-3">
        <p className="text-[11px] text-[#8a7f70] font-medium uppercase tracking-wide mb-1">Your message</p>
        <p className={`text-sm text-[#2d3748] leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-3' : ''}`}>
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

      {/* Response */}
      {hasResponse && (
        <div className="mt-3 border-t border-[rgba(180,168,150,0.25)] pt-3">
          {req.responseMessage && (
            <div className="mb-2">
              <p className="text-[11px] text-[#8a7f70] font-medium uppercase tracking-wide mb-1">
                {req.alumniName.split(' ')[0]}&rsquo;s response
              </p>
              <p className="text-sm text-[#0a1628] leading-relaxed italic">&ldquo;{req.responseMessage}&rdquo;</p>
            </div>
          )}
          {(req.suggestedPersonName || req.suggestedPersonId) && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-[#8a7f70]">Suggested member:</p>
              {req.suggestedPersonId ? (
                <Link
                  href={`/player/alumni/${req.suggestedPersonId}`}
                  className="text-xs font-semibold text-[#0a1628] hover:underline"
                >
                  {req.suggestedPersonName ?? 'View profile'}
                </Link>
              ) : (
                <p className="text-xs font-semibold text-[#0a1628]">{req.suggestedPersonName}</p>
              )}
            </div>
          )}
          {req.respondedAt && (
            <p className="text-[11px] text-[#8a7f70] mt-2">Responded {formatDate(req.respondedAt)}</p>
          )}
        </div>
      )}

      {req.status === 'accepted' && !req.responseMessage && (
        <p className="text-xs text-[#2d6a4f] mt-3 font-medium">
          Your request was accepted. Follow up with a few available times.
        </p>
      )}
    </div>
  )
}

export default function SentRequestsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const fromName = searchParams.get('fromName') ?? ''
  const [nameInput, setNameInput] = useState(fromName)
  const [requests, setRequests] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fromName) return
    setLoading(true)
    setError(null)
    fetch(`/api/player/requests?teamSlug=penn-mens-golf&fromName=${encodeURIComponent(fromName)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => {
        setRequests(d.requests ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load requests.')
        setLoading(false)
      })
  }, [fromName])

  function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    router.push(`/player/requests?fromName=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <Link href="/player" className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block">
            &larr; Clubhouse
          </Link>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Your Requests</h1>
          <p className="text-gray-400 text-sm mt-2">
            Requests you&rsquo;ve sent to Penn Golf members.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-6 sm:px-8 pb-16">
        <div className="-mt-5 relative z-10 space-y-4">

          {/* Name lookup */}
          {!fromName && (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628] mb-1">Enter your name to view your sent requests</p>
              <p className="text-xs text-[#8a7f70] mb-4">Use the same name you used when sending your requests.</p>
              <form onSubmit={handleLookup} className="flex gap-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 text-sm text-[#0a1628] placeholder-[#b5ad9e] bg-[#f8f5f0] border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0a1628] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="text-sm font-semibold bg-[#0a1628] text-white px-5 py-2.5 rounded-lg disabled:opacity-40 hover:bg-[#0a1628]/85 transition-colors"
                >
                  View requests
                </button>
              </form>
            </div>
          )}

          {/* Switch name */}
          {fromName && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8a7f70]">Showing requests for <span className="font-semibold text-[#0a1628]">{fromName}</span></p>
              <button
                type="button"
                onClick={() => router.push('/player/requests')}
                className="text-xs text-[#8a7f70] hover:text-[#0a1628] transition-colors"
              >
                Switch name
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-8 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
              <p className="text-sm text-[#8a7f70]">Loading…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
              <p className="text-sm text-[#990000]">{error}</p>
            </div>
          )}

          {/* Empty */}
          {fromName && !loading && !error && requests.length === 0 && (
            <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-10 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}>
              <p className="text-base font-semibold text-[#0a1628] mb-2">No requests found.</p>
              <p className="text-sm text-[#8a7f70] max-w-sm mx-auto mb-5">
                No requests found for &ldquo;{fromName}&rdquo;. Make sure the name matches exactly what you used when sending.
              </p>
              <Link href="/ask" className="text-sm font-semibold text-[#990000] hover:underline">
                Send your first request &rarr;
              </Link>
            </div>
          )}

          {/* Request cards */}
          {!loading && requests.map(req => (
            <SentRequestCard key={req.id} req={req} />
          ))}

          {/* Ask CTA at bottom */}
          {!loading && requests.length > 0 && (
            <div className="flex justify-center pt-2">
              <Link href="/ask" className="text-sm font-semibold text-[#990000] hover:underline">
                Send another request &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
