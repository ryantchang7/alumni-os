'use client'

/**
 * The non-roster door: how someone who is not on a Penn roster gets into
 * the Clubhouse.
 *
 * It used to be one question, "Relationship to the program", and it was
 * required. That is answerable by a parent and unanswerable by the person
 * this door most needs to let in: a Penn grad who plays golf but never
 * played for Penn. They read "Join as Family or Affiliate", found a field
 * demanding a relationship they do not have, and left. The plumbing had
 * always welcomed them; the form did not.
 *
 * So the first thing asked is which of the three they are, and the second
 * question changes to suit. All three still store one free-text line on
 * one membership row (see @/lib/membership/non-roster), because the role
 * is the bucket and the line is the description.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Check } from 'lucide-react'
import { useSlot } from '@/lib/site-content/use-site-content'
import {
  JOIN_DOORS,
  doorFor,
  isJoinKind,
  type JoinKind,
} from '@/lib/membership/non-roster'

// Stash the form across the Google OAuth round-trip so the user doesn't
// have to retype after sign-in. sessionStorage clears on tab close, which
// is the right scope — we don't want a stale draft to ambush a returning
// visitor next week. v2 carries the door choice; a v1 draft is ignored
// rather than half-restored.
const DRAFT_KEY = 'join-draft-v2'

interface Draft {
  name: string
  relationship: string
  kind: JoinKind
}

function readDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft>
    if (typeof parsed.name !== 'string' || typeof parsed.relationship !== 'string') {
      return null
    }
    if (!isJoinKind(parsed.kind)) return null
    return { name: parsed.name, relationship: parsed.relationship, kind: parsed.kind }
  } catch {
    return null
  }
}

function writeDraft(d: Draft): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {
    // sessionStorage can throw in private browsing — best-effort only.
  }
}

function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export default function JoinForm() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const heroBody = useSlot('join.body')

  const [kind, setKind] = useState<JoinKind>('golfer')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Guard so we only run the post-OAuth auto-restore + auto-submit once.
  const autoRanRef = useRef(false)

  const signedIn = sessionStatus === 'authenticated'
  const door = doorFor(kind)

  const submitToApi = useCallback(
    async (payload: Draft) => {
      setSubmitting(true)
      setError(null)
      try {
        const res = await fetch('/api/account/parent-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name.trim(),
            relationship: payload.relationship.trim(),
            kind: payload.kind,
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 409 && j.claimId) {
            clearDraft()
            router.push(`/account/pending?claimId=${j.claimId}`)
            return
          }
          throw new Error(j.error ?? `Submit failed (${res.status})`)
        }
        clearDraft()
        router.push(`/account/pending?claimId=${j.claimId}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
        setSubmitting(false)
      }
    },
    [router],
  )

  // Post-OAuth resume: if we land back here signed-in with a stored
  // draft, repopulate the fields and auto-submit so the user doesn't
  // have to retype + click submit again.
  useEffect(() => {
    if (autoRanRef.current) return
    if (sessionStatus === 'loading') return
    const draft = readDraft()
    if (!draft) return
    // Repopulate visible fields either way so the user sees what's about
    // to be submitted (and can correct if anything looks off).
    setName(prev => prev || draft.name)
    setRelationship(prev => prev || draft.relationship)
    setKind(draft.kind)
    if (signedIn && draft.name.trim() && draft.relationship.trim()) {
      autoRanRef.current = true
      void submitToApi(draft)
    }
  }, [signedIn, sessionStatus, submitToApi])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signedIn) {
      // Stash the draft, then send the user to the login page, which offers
      // Google and an emailed link. We restore + auto-submit when they return.
      writeDraft({ name: name.trim(), relationship: relationship.trim(), kind })
      router.push('/login?next=/join')
      return
    }
    void submitToApi({ name, relationship, kind })
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[720px] mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back home</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 text-right">
            Penn Golf &middot; Join
          </p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <h1 className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading mb-4">
          You do not have to have played for Penn.
        </h1>
        <p className="text-[14.5px] text-[#3d4a5c] mb-8 leading-relaxed max-w-xl whitespace-pre-line">
          {heroBody}
        </p>

        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-7 sm:px-9 sm:py-9"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          {!signedIn && sessionStatus !== 'loading' && (
            <div className="mb-6 px-4 py-3 bg-[#fdfcf9] border border-[rgba(180,168,150,0.5)] rounded-lg text-[13.5px] text-[#3d4a5c]">
              You&rsquo;ll sign in when you submit so we can attach this card to your
              account. Google or an emailed link, whichever you prefer.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset>
              <legend className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-3">
                Which are you?
              </legend>
              <div className="space-y-2.5" data-testid="join-doors">
                {JOIN_DOORS.map(d => {
                  const active = d.kind === kind
                  return (
                    <label
                      key={d.kind}
                      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors ${
                        active
                          ? 'border-[#c8a84b] bg-[#c8a84b]/[0.07]'
                          : 'border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/35'
                      }`}
                    >
                      <input
                        type="radio"
                        name="join-kind"
                        value={d.kind}
                        checked={active}
                        onChange={() => setKind(d.kind)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={`mt-[2px] w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          active
                            ? 'border-[#c8a84b] bg-[#c8a84b]'
                            : 'border-[rgba(180,168,150,0.8)]'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-[#0a1628] leading-snug">
                          {d.label}
                        </span>
                        <span className="block text-[12.5px] text-ink-muted mt-0.5 leading-relaxed">
                          {d.hint}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="join-name"
                className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2"
              >
                Your full name
              </label>
              <input
                id="join-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                required
                placeholder="Jane Smith"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
            </div>

            <div>
              <label
                htmlFor="join-line"
                className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2"
              >
                {door.fieldLabel}
              </label>
              <input
                id="join-line"
                type="text"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                maxLength={200}
                required
                placeholder={door.placeholder}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
              <p className="text-[11px] text-ink-muted mt-1.5">{door.fieldHint}</p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={submitting || !name.trim() || !relationship.trim()}
                className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting…'
                  : signedIn
                    ? 'Submit for review'
                    : 'Sign in to submit'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-[12px] text-ink-muted mt-6 max-w-xl leading-relaxed">
          Free to join. Reviewed by Ryan Chang, usually within a day. Played for
          Penn?{' '}
          <Link href="/account/setup" className="text-[#0a1628] hover:underline">
            Your card is already in the Member Book
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
