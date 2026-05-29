'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { ArrowLeft, Heart } from 'lucide-react'

// Stash the form across the Google OAuth round-trip so the user doesn't
// have to retype after sign-in. sessionStorage clears on tab close, which
// is the right scope — we don't want a stale draft to ambush a returning
// visitor next week.
const DRAFT_KEY = 'parent-signup-draft-v1'

interface Draft {
  name: string
  relationship: string
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
    return { name: parsed.name, relationship: parsed.relationship }
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

export default function ParentSignupPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Guard so we only run the post-OAuth auto-restore + auto-submit once.
  const autoRanRef = useRef(false)

  const signedIn = sessionStatus === 'authenticated'

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
    if (signedIn && draft.name.trim() && draft.relationship.trim()) {
      autoRanRef.current = true
      void submitToApi(draft)
    }
  }, [signedIn, sessionStatus, submitToApi])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signedIn) {
      // Stash the draft, then send the user through Google — we'll
      // restore + auto-submit when they return.
      writeDraft({ name: name.trim(), relationship: relationship.trim() })
      void signIn('google', { callbackUrl: '/parent-signup' })
      return
    }
    void submitToApi({ name, relationship })
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back home</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
            Penn Golf · Family &amp; Affiliate
          </p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#990000]" />
          <h1
            className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Join as Family or Affiliate
          </h1>
        </div>
        <p className="text-[14.5px] text-[#3d4a5c] mb-8 leading-relaxed max-w-xl">
          Parents, family, and longtime affiliates of Penn Men&rsquo;s Golf can
          join the Clubhouse to follow the program, support the team, and stay
          in touch with the community. After the captain confirms, you&rsquo;ll
          have a card in the Member Book and can optionally subscribe to support
          the program.
        </p>

        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-7 sm:px-9 sm:py-9"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          {!signedIn && sessionStatus !== 'loading' && (
            <div className="mb-6 px-4 py-3 bg-[#faf7f2] border border-[rgba(180,168,150,0.5)] rounded-lg text-[13.5px] text-[#3d4a5c]">
              You&rsquo;ll sign in with Google when you submit so we can attach this
              card to your account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Your full name
              </label>
              <input
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
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Relationship to the program
              </label>
              <input
                type="text"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                maxLength={200}
                required
                placeholder="Parent of John Smith C'24 / Affiliate — supporter since 2010"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
              <p className="text-[11px] text-[#8a7f70] mt-1.5">
                A short line so the captain knows who you are. Shown on your
                Member Book card.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !name.trim() || !relationship.trim()}
                className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting…'
                  : signedIn
                    ? 'Submit for captain review'
                    : 'Sign in with Google to submit'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-[12px] text-[#8a7f70] mt-6 max-w-xl leading-relaxed">
          Free to join. Once approved, you can optionally support the program
          through the{' '}
          <Link href="/support" className="text-[#0a1628] hover:underline">
            Support page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
