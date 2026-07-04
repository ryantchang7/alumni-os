'use client'

/**
 * AskTheTeam — trigger button + portal modal with player picker.
 *
 * Multiple instances can live on one page (hero + nudge + per-card).
 * Self-contained — no context/provider needed.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageCircle, Check, Users } from 'lucide-react'
import TurnstileWidget from '@/components/TurnstileWidget'
import MemberAvatar from '@/components/MemberAvatar'

const QUESTION_MAX = 1000

// Drafts stashed before a sign-in / claim redirect so the typed question
// survives the OAuth round-trip. Restored (and cleared) on next open.
const DRAFT_KEY = 'ask-the-team-draft'

export interface AskTarget {
  personId: string
  name: string
  photoUrl: string | null
  classShort?: string
}

interface Props {
  players: AskTarget[]
  variant?: 'primary' | 'card'
  label?: string
  initialTargetPersonIds?: string[]
}

/** First name only */
function firstName(name: string): string {
  return name.split(' ')[0] ?? name
}

/** Join names for display: "Jimmy", "Jimmy & Bob", "Jimmy, Bob & Alex" */
function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return names[0] + ' & ' + names[1]
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1]
}

export default function AskTheTeam({
  players,
  variant = 'primary',
  label,
  initialTargetPersonIds,
}: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // When the send fails on auth, offer the matching CTA (sign in / claim)
  // instead of a dead-end error string.
  const [errorAction, setErrorAction] = useState<'signin' | 'claim' | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const handleTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  // Escape-to-close + body scroll lock
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  function handleOpen() {
    // Seed selection from initialTargetPersonIds intersected with valid player ids
    const validIds = new Set(players.map(p => p.personId))
    let seeded = (initialTargetPersonIds ?? []).filter(id => validIds.has(id))
    // Restore a draft stashed before a sign-in redirect, then clear it.
    let draftQuestion = ''
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        sessionStorage.removeItem(DRAFT_KEY)
        const draft = JSON.parse(raw) as { question?: string; targetPersonIds?: string[] }
        if (typeof draft.question === 'string') draftQuestion = draft.question.slice(0, QUESTION_MAX)
        if (Array.isArray(draft.targetPersonIds) && draft.targetPersonIds.length > 0) {
          seeded = draft.targetPersonIds.filter(id => validIds.has(id))
        }
      }
    } catch {
      // sessionStorage unavailable / bad JSON — start clean
    }
    setSelectedIds(new Set(seeded))
    setOpen(true)
    setStatus('idle')
    setQuestion(draftQuestion)
    setErrorMsg('')
    setErrorAction(null)
    setTurnstileToken(null)
    setFilter('')
  }

  /** Stash the in-progress question so it survives the auth redirect. */
  function stashDraft() {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ question, targetPersonIds: [...selectedIds] }),
      )
    } catch {
      // best effort
    }
  }

  function handleClose() {
    setOpen(false)
    if (status !== 'success') {
      setQuestion('')
      setErrorMsg('')
      setStatus('idle')
    }
  }

  function togglePlayer(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')
    setErrorAction(null)

    const payload: {
      question: string
      turnstileToken?: string
      targetPersonIds?: string[]
    } = { question: question.trim() }
    if (turnstileToken) payload.turnstileToken = turnstileToken
    if (selectedIds.size > 0) payload.targetPersonIds = [...selectedIds]

    try {
      const res = await fetch('/api/team-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        const err = (data as { error?: string }).error
        if (res.status === 401) {
          setErrorMsg('Sign in to send your question — what you wrote is saved.')
          setErrorAction('signin')
        } else if (res.status === 403) {
          setErrorMsg(err ?? 'Your account needs to be approved before you can ask questions.')
          setErrorAction('claim')
        } else if (res.status === 429) {
          setErrorMsg('You’ve sent a few questions recently — give it a day and try again.')
        } else {
          setErrorMsg(err ?? 'Something went wrong. Try again.')
        }
        setStatus('error')
      }
    } catch {
      setErrorMsg('Could not reach the server. Check your connection and try again.')
      setStatus('error')
    }
  }

  // Filtered player list for the picker
  const filteredPlayers = useMemo(() => {
    if (!filter.trim()) return players
    const q = filter.trim().toLowerCase()
    return players.filter(p => p.name.toLowerCase().includes(q))
  }, [players, filter])

  // Selected player objects (in roster order)
  const selectedPlayers = players.filter(p => selectedIds.has(p.personId))
  const selectedFirstNames = selectedPlayers.map(p => firstName(p.name))

  // Status line copy
  const pickerStatus =
    selectedIds.size === 0
      ? null
      : joinNames(selectedFirstNames)

  // Success headline
  const successHeadline =
    selectedIds.size === 0
      ? 'Sent — one of the guys will get back to you'
      : 'Sent to ' + joinNames(selectedFirstNames) + ' — they’ll get back to you'

  // Trigger button
  const triggerLabel = variant === 'primary' ? (label ?? 'Ask the Team') : (label ?? 'Ask')

  const triggerBtn =
    variant === 'primary' ? (
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        {triggerLabel}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a1628] border border-[rgba(180,168,150,0.55)] bg-[#f8f5f0] hover:bg-white hover:border-[#0a1628]/30 px-3 py-2 rounded-lg transition-colors"
      >
        <MessageCircle size={13} className="flex-shrink-0" />
        {triggerLabel}
      </button>
    )

  const modal =
    open && typeof window !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Ask the Team"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#0a1628]/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Panel */}
            <div
              className="relative z-10 w-full max-w-lg bg-[#f8f5f0] rounded-2xl shadow-2xl border border-[rgba(180,168,150,0.4)] overflow-hidden animate-suggest-panel flex flex-col max-h-[90vh]"
              style={{ boxShadow: '0 8px 32px rgba(10,22,40,0.22), 0 2px 8px rgba(10,22,40,0.12)' }}
            >
              {/* Header */}
              <div className="bg-[#0a1628] px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
                <div>
                  <p className="eyebrow text-gold mb-1">
                    Penn Men&rsquo;s Golf
                  </p>
                  <h2
                    className="text-white text-xl font-medium leading-snug font-heading"
                  >
                    Ask the Team
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/50 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Gold accent line */}
              <div className="h-[2px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b] flex-shrink-0" />

              {/* Scrollable body */}
              <div className="px-6 py-6 overflow-y-auto">
                {status === 'success' ? (
                  <div className="rounded-xl border border-[#d9c8a8] bg-[#faf7f2] px-8 py-10 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <span
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#c8a84b]/12 border border-[#c8a84b]/30"
                        aria-hidden="true"
                      >
                        <svg
                          className="w-5 h-5 text-[#c8a84b]"
                          fill="none"
                          viewBox="0 0 20 20"
                          stroke="currentColor"
                          strokeWidth={2.2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l4 4 7-8" />
                        </svg>
                      </span>
                    </div>
                    <p
                      className="text-[1.15rem] leading-snug text-[#0a1628] font-heading"
                    >
                      {successHeadline}
                    </p>
                    <p className="mt-3 text-sm text-ink-muted">
                      Usually within a couple days. Thanks for asking.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-sm text-[#5a5347] leading-relaxed">
                      Got a question for the guys on the team? Ask away &mdash; current players answer when they can.
                    </p>

                    {/* ---- Player picker ---- */}
                    {players.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <label className="block text-xs font-semibold tracking-widest uppercase text-ink-muted">
                            Who are you asking?
                          </label>
                          {selectedIds.size > 0 && (
                            <button
                              type="button"
                              onClick={clearSelection}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-muted hover:text-[#0a1628] transition-colors"
                            >
                              <Users size={11} />
                              Whole team
                            </button>
                          )}
                        </div>

                        {/* Status line */}
                        <div className="flex items-center gap-2 min-h-[1.5rem]">
                          {selectedIds.size === 0 ? (
                            <span className="text-xs text-[#5a5347]">
                              Asking the whole team
                              <span className="text-[#b0a898] ml-1.5">Everyone on the roster gets it.</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#0a1628] font-medium">
                              Asking{' '}
                              <span className="text-[#c8a84b]">{pickerStatus}</span>
                            </span>
                          )}
                        </div>

                        {/* Name filter for large rosters */}
                        {players.length > 12 && (
                          <input
                            type="text"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Filter by name…"
                            className="w-full rounded-lg border border-[#d9c8a8] bg-white px-3 py-1.5 text-xs text-[#0a1628] placeholder:text-[#b0a898] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
                          />
                        )}

                        {/* Chips */}
                        <div className="max-h-44 overflow-y-auto -mx-1 px-1 pb-1">
                          <div className="flex flex-wrap gap-2">
                            {filteredPlayers.map(p => {
                              const isSelected = selectedIds.has(p.personId)
                              return (
                                <button
                                  key={p.personId}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => togglePlayer(p.personId)}
                                  className={[
                                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/40',
                                    isSelected
                                      ? 'bg-[#c8a84b] text-[#0a1628] border-[#c8a84b]'
                                      : 'bg-white text-[#0a1628] border-[#d9c8a8] hover:border-[#c8a84b]/60',
                                  ].join(' ')}
                                >
                                  <MemberAvatar
                                    photoUrl={p.photoUrl}
                                    name={p.name}
                                    size={20}
                                    tone={isSelected ? 'onDark' : 'navy'}
                                  />
                                  <span>{firstName(p.name)}</span>
                                  {p.classShort && (
                                    <span
                                      className={
                                        isSelected ? 'opacity-60' : 'text-[#b0a898]'
                                      }
                                    >
                                      {p.classShort}
                                    </span>
                                  )}
                                  {isSelected && <Check size={11} className="flex-shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ---- Question textarea ---- */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label
                          htmlFor="ask-question"
                          className="block text-xs font-semibold tracking-widest uppercase text-ink-muted"
                        >
                          Your question
                        </label>
                        <span
                          className={[
                            'text-xs tabular-nums transition-colors',
                            question.length >= QUESTION_MAX * 0.9 ? 'text-[#990000]' : 'text-[#b0a898]',
                          ].join(' ')}
                        >
                          {question.length} / {QUESTION_MAX}
                        </span>
                      </div>
                      <textarea
                        id="ask-question"
                        value={question}
                        onChange={e => setQuestion(e.target.value.slice(0, QUESTION_MAX))}
                        required
                        rows={4}
                        maxLength={QUESTION_MAX}
                        placeholder="Ask the guys anything…"
                        className="w-full rounded-lg border border-[#d9c8a8] bg-white px-4 py-3 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b]"
                      />
                    </div>

                    <TurnstileWidget onToken={handleTurnstile} />

                    {status === 'error' && (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-2">
                        <p>{errorMsg}</p>
                        {errorAction === 'signin' && (
                          <a
                            href={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                            onClick={stashDraft}
                            className="inline-block font-semibold text-[#0a1628] underline underline-offset-2 hover:text-[#990000]"
                          >
                            Sign in to send it &rarr;
                          </a>
                        )}
                        {errorAction === 'claim' && (
                          <a
                            href="/account/setup"
                            onClick={stashDraft}
                            className="inline-block font-semibold text-[#0a1628] underline underline-offset-2 hover:text-[#990000]"
                          >
                            Claim your card &rarr;
                          </a>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting' || !question.trim()}
                      className="w-full rounded-lg bg-[#0a1628] px-6 py-3 text-[13px] font-semibold tracking-wider uppercase text-white hover:bg-[#0f1f3d] disabled:opacity-50 transition-colors"
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send question'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {triggerBtn}
      {modal}
    </>
  )
}
