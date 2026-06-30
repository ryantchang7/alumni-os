'use client'

/**
 * /team/questions — role-aware Q&A queue.
 *
 * Players / founders see: open questions to answer + answered history + opt-in toggle.
 * Members see: their own questions + any answers received.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TeamQuestion } from '@/lib/store/types'

type PlayerView = { role: 'player'; open: TeamQuestion[]; answered: TeamQuestion[] }
type MemberView = { role: 'member'; mine: TeamQuestion[] }
type QData = PlayerView | MemberView

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Small "To:" row showing who a question is aimed at */
function TargetLine({ q }: { q: TeamQuestion }) {
  if (q.targets && q.targets.length > 0) {
    const names = q.targets.map(t => t.name.split(' ')[0]).join(', ')
    return (
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7f70]">To</span>
        <span className="inline-flex flex-wrap gap-1">
          {q.targets.map(t => (
            <span
              key={t.personId}
              className="text-[10px] font-medium text-[#7a5f1a] bg-[#c8a84b]/12 border border-[#c8a84b]/25 px-2 py-0.5 rounded-full"
            >
              {t.name.split(' ')[0]}
            </span>
          ))}
        </span>
        <span className="sr-only">{names}</span>
      </div>
    )
  }
  return (
    <div className="mb-2">
      <span className="text-[10px] font-medium text-[#b0a898]">To the whole team</span>
    </div>
  )
}

// ---- Card used in the player's "open" list ----
function OpenQuestionCard({
  q,
  onAnswered,
}: {
  q: TeamQuestion
  onAnswered: (id: string, body: string) => void
}) {
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || status === 'submitting') return
    setStatus('submitting')
    setError('')
    try {
      const res = await fetch(`/api/team-questions/${q.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (res.ok) {
        setStatus('done')
        onAnswered(q.id, body.trim())
      } else {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Could not submit. Try again.')
        setStatus('error')
      }
    } catch {
      setError('Network error. Check your connection.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
      >
        <p className="text-sm text-[#2d6a4f] font-medium">Answer sent &mdash; thanks.</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <TargetLine q={q} />
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="font-semibold text-[#0a1628] text-sm">{q.askerName}</span>
        {q.askerGradYear && (
          <span className="text-[10px] font-medium text-[#8a7f70] bg-[#f8f5f0] border border-[rgba(180,168,150,0.35)] px-2 py-0.5 rounded-full">
            &apos;{String(q.askerGradYear).slice(-2)}
          </span>
        )}
        <span className="text-xs text-[#b0a898] ml-auto">{relativeTime(q.createdAt)}</span>
      </div>
      <p className="text-sm text-[#3d4a5c] leading-relaxed mb-4">{q.question}</p>

      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="Your answer…"
          disabled={status === 'submitting'}
          className="w-full rounded-lg border border-[#d9c8a8] bg-[#faf7f2] px-4 py-3 text-sm text-[#0a1628] placeholder:text-[#b0a898] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b] disabled:opacity-60"
        />
        {status === 'error' && (
          <p className="text-xs text-[#990000]">{error}</p>
        )}
        <button
          type="submit"
          disabled={status === 'submitting' || !body.trim()}
          className="inline-flex items-center px-4 py-2 bg-[#0a1628] hover:bg-[#112240] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {status === 'submitting' ? 'Sending…' : 'Send answer'}
        </button>
      </form>
    </div>
  )
}

// ---- Answered question card (player view) ----
function AnsweredCard({ q }: { q: TeamQuestion }) {
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <TargetLine q={q} />
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span className="font-semibold text-[#0a1628] text-sm">{q.askerName}</span>
        {q.askerGradYear && (
          <span className="text-[10px] font-medium text-[#8a7f70] bg-[#f8f5f0] border border-[rgba(180,168,150,0.35)] px-2 py-0.5 rounded-full">
            &apos;{String(q.askerGradYear).slice(-2)}
          </span>
        )}
        <span className="text-xs text-[#b0a898] ml-auto">{relativeTime(q.createdAt)}</span>
      </div>
      <p className="text-sm text-[#3d4a5c] leading-relaxed">{q.question}</p>
      {q.answers.map(a => (
        <div key={a.id} className="mt-3 pl-4 border-l-2 border-[#c8a84b]/40">
          <p className="text-xs font-semibold text-[#0a1628] mb-0.5">{a.responderName}</p>
          <p className="text-sm text-[#4a5568] leading-relaxed">{a.body}</p>
        </div>
      ))}
    </div>
  )
}

// ---- Member view card ----
function MemberQuestionCard({ q }: { q: TeamQuestion }) {
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={[
          'text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full',
          q.status === 'answered'
            ? 'text-[#2d6a4f] bg-[#2d6a4f]/10'
            : 'text-[#8a7f70] bg-[#f8f5f0] border border-[rgba(180,168,150,0.35)]',
        ].join(' ')}>
          {q.status === 'answered' ? 'Answered' : 'Pending'}
        </span>
        <span className="text-xs text-[#b0a898] ml-auto">{relativeTime(q.createdAt)}</span>
      </div>
      <TargetLine q={q} />
      <p className="text-sm font-medium text-[#0a1628] leading-relaxed">{q.question}</p>

      {q.answers.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {q.answers.map(a => (
            <div key={a.id} className="pl-4 border-l-2 border-[#c8a84b]/40">
              <p className="text-xs font-semibold text-[#0a1628] mb-0.5">{a.responderName}</p>
              <p className="text-sm text-[#4a5568] leading-relaxed">{a.body}</p>
              <p className="text-[10px] text-[#b0a898] mt-1">{relativeTime(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Opt-in toggle ----
function AnswerToggle({ initialChecked }: { initialChecked: boolean }) {
  const [checked, setChecked] = useState(initialChecked)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !checked
    setChecked(next)
    setSaving(true)
    try {
      await fetch('/api/me/answers-team-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        disabled={saving}
        className={[
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/60 disabled:opacity-60',
          checked ? 'bg-[#2d6a4f]' : 'bg-[#d1cab8]',
        ].join(' ')}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
      <span className="text-sm text-[#3d4a5c]">
        {checked ? 'Available to answer questions' : 'Not in the answer queue'}
      </span>
    </div>
  )
}

// ---- Main page ----
export default function TeamQuestionsPage() {
  const [data, setData] = useState<QData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/team-questions')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<QData>
      })
      .then(d => setData(d))
      .catch(() => setLoadError('Could not load questions. Try refreshing.'))
  }, [])

  function handleAnswered(id: string) {
    setAnsweredIds(prev => new Set([...prev, id]))
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {data?.role === 'player' ? 'Answer the Team’s Questions' : 'Your Questions'}
          </h1>
          {data?.role === 'player' && (
            <p className="text-white/55 text-sm max-w-xl leading-relaxed mt-4">
              Alumni ask &mdash; you answer. Keeps the community tight and gives guys real access to the program.
            </p>
          )}
        </div>
      </div>

      {/* Gold accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-10">
        {/* Loading */}
        {!data && !loadError && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">
            {loadError}
          </div>
        )}

        {/* ===== PLAYER VIEW ===== */}
        {data?.role === 'player' && (
          <>
            {/* Opt-in toggle */}
            <section>
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-5 py-4"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7f70] mb-3">
                  Your availability
                </p>
                {/* Default true: undefined means opted in per Account.answersTeamQuestions docs */}
                <AnswerToggle initialChecked={true} />
              </div>
            </section>

            {/* Open questions */}
            <section>
              <h2 className="text-base font-semibold text-[#0a1628] mb-1">Open questions</h2>
              <p className="text-sm text-[#8a7f70] mb-5">
                Alumni waiting for an answer. Reply whenever you have a minute.
              </p>

              {(data as PlayerView).open.filter(q => !answeredIds.has(q.id)).length === 0 ? (
                <div
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-12 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
                >
                  <p className="text-sm font-semibold text-[#0a1628]">Queue is clear</p>
                  <p className="text-xs text-[#8a7f70] mt-2">New questions from alumni will show up here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data as PlayerView).open
                    .filter(q => !answeredIds.has(q.id))
                    .map(q => (
                      <OpenQuestionCard key={q.id} q={q} onAnswered={handleAnswered} />
                    ))}
                </div>
              )}
            </section>

            {/* Answered */}
            {(data as PlayerView).answered.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-[#0a1628] mb-1">Recently answered</h2>
                <p className="text-sm text-[#8a7f70] mb-5">Questions the team has already replied to.</p>
                <div className="space-y-4">
                  {(data as PlayerView).answered.map(q => (
                    <AnsweredCard key={q.id} q={q} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ===== MEMBER VIEW ===== */}
        {data?.role === 'member' && (
          <section>
            <h2 className="text-base font-semibold text-[#0a1628] mb-1">Your questions</h2>
            <p className="text-sm text-[#8a7f70] mb-5">
              Questions you&rsquo;ve sent to the team, and any answers they&rsquo;ve sent back.
            </p>

            {(data as MemberView).mine.length === 0 ? (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-14 text-center"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-sm font-semibold text-[#0a1628]">No questions yet</p>
                <p className="text-xs text-[#8a7f70] mt-2 max-w-sm mx-auto">
                  Head over to Ask the Team and ask the guys anything.
                </p>
                <div className="mt-5">
                  <Link
                    href="/meet-the-team"
                    className="inline-flex items-center px-4 py-2.5 bg-[#c8a84b] hover:bg-[#b8973b] text-[#0a1628] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Ask the Team &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(data as MemberView).mine.map(q => (
                  <MemberQuestionCard key={q.id} q={q} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
