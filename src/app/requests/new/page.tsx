'use client'

/**
 * Post an Open Request — "I'm in town and want to play / grab coffee."
 *
 * Renders a small form; on success we land on the same 3-button next-
 * step affordance pattern we just shipped on the other forms (See it on
 * the relevant surface · Post another · Back to the Clubhouse).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Flag, Beer, Coffee, Utensils } from 'lucide-react'
import CityStateInput from '@/components/CityStateInput'

const INTENT_OPTIONS = [
  { value: 'round', label: 'Round', icon: Flag, accent: '#2d6a4f' },
  { value: 'drinks', label: 'Drinks', icon: Beer, accent: '#b8860b' },
  { value: 'coffee', label: 'Coffee', icon: Coffee, accent: '#0a1628' },
  { value: 'dinner', label: 'Dinner', icon: Utensils, accent: '#990000' },
] as const

type Intent = (typeof INTENT_OPTIONS)[number]['value']

const PLACEHOLDER_BY_INTENT: Record<Intent, string> = {
  round: 'In NYC Aug 5–10, looking to play. Will cover guest fees.',
  drinks: 'In Chicago next weekend, would love to meet some Penn Golf alums for a beer.',
  coffee: "Visiting Boston for the week. Open to coffee with anyone in town.",
  dinner: 'In SF Sept 2–4, would love to grab dinner with the Penn Golf crew.',
}

export default function NewOpenRequestPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [intent, setIntent] = useState<Intent>('round')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [guestFeesOffered, setGuestFeesOffered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId
  const currentIntent = INTENT_OPTIONS.find(i => i.value === intent)!
  const Icon = currentIntent.icon

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approved) {
      router.push(signedIn ? '/account/setup' : '/login?next=/requests/new')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/open-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          note: note.trim(),
          guestFeesOffered: intent === 'round' && guestFeesOffered,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    function resetForm() {
      setIntent('round')
      setCity('')
      setState('')
      setStartDate('')
      setEndDate('')
      setNote('')
      setGuestFeesOffered(false)
      setSubmitted(false)
    }
    // Where the request will show up depends on intent — round lands on
    // /the-course, social intents on /19th-hole.
    const seeItHref = intent === 'round' ? '/the-course#open-to-rounds' : '/19th-hole'
    const seeItLabel = intent === 'round' ? 'See it on The Course' : 'See it on the 19th Hole'
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] px-6 py-20 flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <Icon
            className="w-7 h-7 mx-auto mb-4"
            style={{ color: currentIntent.accent }}
          />
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Request is up.
          </h1>
          <p className="text-[13px] text-[#3d4a5c] mb-7">
            Penn Golf members in {city || 'your area'} will see it.
            Responses come through chat &mdash; and you can close the
            request anytime from {intent === 'round' ? 'The Course' : 'the 19th Hole'}.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href={seeItHref}
              className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              {seeItLabel}
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Post another
            </button>
            <Link
              href="/player"
              className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#3d4a5c] hover:text-[#0a1628] mt-1"
            >
              Back to the Clubhouse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <Link
            href="/player"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
            Penn Men&rsquo;s Golf · Open Request
          </p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
            <span className="block w-10 h-[2px] bg-[#c8a84b] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Post an open request
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              Visiting somewhere and want to play, grab coffee, or pull a
              dinner together? Drop a note &mdash; Penn Golf alumni near that
              city get a heads-up (bell + email), so someone can play or host you.
            </p>
          </div>

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 bg-[#faf7f2] border-b border-[rgba(180,168,150,0.3)]">
              <p className="text-[13px] text-[#3d4a5c]">
                {signedIn
                  ? 'Claim your Member Book card to post a request. '
                  : 'Sign in and claim your card to post a request. '}
                <Link
                  href={signedIn ? '/account/setup' : '/login?next=/requests/new'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  {signedIn ? 'Claim your card' : 'Sign in'} &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            {/* Intent picker */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                What are you looking for
              </label>
              <div className="flex flex-wrap gap-2">
                {INTENT_OPTIONS.map(opt => {
                  const OptIcon = opt.icon
                  const active = intent === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIntent(opt.value)}
                      className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium px-4 py-2 rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#0a1628] text-white border-[#0a1628]'
                          : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]/40'
                      }`}
                    >
                      <OptIcon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Where */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Where
              </label>
              <CityStateInput
                city={city}
                state={state}
                onChange={({ city: c, state: s }) => {
                  setCity(c)
                  setState(s)
                }}
              />
            </div>

            {/* When */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                When <span className="text-[#8a7f70] normal-case tracking-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Note
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 400))}
                rows={3}
                required
                placeholder={PLACEHOLDER_BY_INTENT[intent]}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
              <p className="text-[11px] text-[#8a7f70] mt-1 text-right">
                {note.length} / 400
              </p>
            </div>

            {/* Guest-fees toggle — only relevant for rounds */}
            {intent === 'round' && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guestFeesOffered}
                  onChange={e => setGuestFeesOffered(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#2d6a4f] cursor-pointer"
                />
                <span className="flex-1 text-[13px]">
                  <span className="font-semibold text-[#2d6a4f]">I&rsquo;ll cover guest fees.</span>{' '}
                  <span className="text-[#8a7f70]">
                    Shows as a small pill so visiting members see who&rsquo;s offering.
                  </span>
                </span>
              </label>
            )}

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !approved || !note.trim()}
                className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting…' : 'Post request'}
              </button>
              <Link
                href="/player"
                className="text-[12px] text-[#8a7f70] hover:text-[#0a1628]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
