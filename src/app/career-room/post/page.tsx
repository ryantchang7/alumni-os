'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Briefcase } from 'lucide-react'
import type { CareerPostSector } from '@/lib/store/types'

const KIND_OPTIONS = [
  {
    value: 'ask',
    label: 'Ask',
    helper: 'You’re looking for something specific — an intro, a referral, a piece of advice.',
    accent: '#990000',
  },
  {
    value: 'offer',
    label: 'Offer',
    helper: 'You can give something specific — an intro at your firm, a seat at a dinner, a referral.',
    accent: '#2d6a4f',
  },
] as const

const SECTOR_OPTIONS: { value: CareerPostSector; label: string }[] = [
  { value: 'finance', label: 'Finance' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'law', label: 'Law' },
  { value: 'technology', label: 'Tech' },
  { value: 'startups', label: 'Startups' },
  { value: 'sports', label: 'Sports / Golf' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'media', label: 'Media' },
  { value: 'public-service', label: 'Public Service' },
  { value: 'other', label: 'Other' },
]

const HEADLINE_MAX = 120
const BODY_MAX = 600

export default function PostCareerEntryPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [kind, setKind] = useState<'ask' | 'offer'>('ask')
  const [sector, setSector] = useState<CareerPostSector>('finance')
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [contactEmail, setContactEmail] = useState(session?.user?.email ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId
  const currentKind = KIND_OPTIONS.find(k => k.value === kind)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approved) {
      router.push(signedIn ? '/account/setup' : '/login?next=/career-room/post')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const email = contactEmail.trim() || session?.user?.email || ''
      const res = await fetch('/api/career-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: 'penn-mens-golf',
          kind,
          sector,
          headline: headline.trim(),
          body: body.trim() || undefined,
          contactEmail: email,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] px-6 py-20 flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <Briefcase className="w-7 h-7 text-[#0a1628] mx-auto mb-4" />
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            On the floor.
          </h1>
          <p className="text-[13px] text-[#3d4a5c] mb-8">
            Your {currentKind.label.toLowerCase()} is up. Replies go straight to your inbox.
          </p>
          <Link
            href="/career-room"
            className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Back to the Career Room
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="px-5 sm:px-8 py-5 border-b border-[rgba(180,168,150,0.35)]">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/career-room"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#3d4a5c] hover:text-[#0a1628] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to the Career Room</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000]">
            The Floor · New Post
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
            <span className="block w-10 h-[2px] bg-[#0a1628] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Post to the floor
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              Be specific. The strongest asks and offers name a sector, a role, and a real
              constraint. Replies are private — they go to the email you list below.
            </p>
          </div>

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
              <p className="text-[13px] text-[#3d4a5c]">
                {signedIn
                  ? 'Claim your Member Book card to post to the floor. The captain approves new members within a day or two. '
                  : 'Sign in and claim your card to post an ask or offer. '}
                <Link
                  href={signedIn ? '/account/setup' : '/login?next=/career-room/post'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  {signedIn ? 'Claim your card' : 'Sign in'} &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            {/* Kind */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Kind
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KIND_OPTIONS.map((k) => {
                  const active = kind === k.value
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKind(k.value)}
                      className={`text-left text-[13px] font-medium px-4 py-3 rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#0a1628] text-white border-[#0a1628]'
                          : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                      }`}
                    >
                      <span className="block">{k.label}</span>
                      <span className={`block text-[11px] mt-1 ${active ? 'text-white/75' : 'text-[#8a7f70]'}`}>
                        {k.helper}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as CareerPostSector)}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Headline */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
                  Headline
                </label>
                <span className="text-[10.5px] text-[#8a7f70]">
                  {headline.length}/{HEADLINE_MAX}
                </span>
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, HEADLINE_MAX))}
                placeholder={
                  kind === 'ask'
                    ? 'Warm intro to PE associate in NYC'
                    : 'Can intro 1 alum/month to MDs at Centerview'
                }
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
                  Detail (optional)
                </label>
                <span className="text-[10.5px] text-[#8a7f70]">
                  {body.length}/{BODY_MAX}
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                rows={4}
                placeholder={
                  kind === 'ask'
                    ? 'Background, the specific firm/role, the constraint that matters most.'
                    : 'What the intro looks like, what you’re looking for in the alum you connect.'
                }
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
              />
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Reply-to email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@firm.com"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 focus:border-[#0a1628]"
              />
              <p className="text-[11.5px] text-[#8a7f70] mt-2">
                Visible only via the &ldquo;Reply privately&rdquo; button on the card.
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
                disabled={submitting || !approved}
                className="bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting…' : 'Post to the floor'}
              </button>
              <Link
                href="/career-room"
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
