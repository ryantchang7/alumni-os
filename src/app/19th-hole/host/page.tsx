'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Beer, ArrowLeft } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'
import NotifyChoice, { type NotifyMode, type InviteOption } from '@/components/gatherings/NotifyChoice'

const TYPE_OPTIONS = [
  { value: 'drinks', label: 'Drinks', helper: 'Bar, lounge, or watering hole.' },
  { value: 'dinner', label: 'Dinner', helper: 'A reservation for the table.' },
  { value: 'coffee', label: 'Coffee', helper: 'Morning or afternoon catch-up.' },
  { value: 'event', label: 'Event', helper: 'Watch party, mixer, or signature night.' },
] as const

const AUDIENCE_OPTIONS = [
  { value: 'both', label: 'Players + Alumni' },
  { value: 'alumni', label: 'Alumni only' },
  { value: 'players', label: 'Current Players' },
] as const

export default function HostNineteenthHolePage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]['value']>('drinks')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [dateText, setDateText] = useState('')
  const [timeText, setTimeText] = useState('')
  const [audience, setAudience] = useState<(typeof AUDIENCE_OPTIONS)[number]['value']>('both')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')

  const [notifyMode, setNotifyMode] = useState<NotifyMode>('nearby')
  const [invited, setInvited] = useState<InviteOption[]>([])
  const [bookOptions, setBookOptions] = useState<InviteOption[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submittedVenue, setSubmittedVenue] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId

  // Names for the invite picker. Same endpoint the Moments tagger uses.
  useEffect(() => {
    if (!approved) return
    fetch('/api/member-book/options')
      .then(r => (r.ok ? r.json() : { members: [] }))
      .then(d => setBookOptions((d.members ?? []) as InviteOption[]))
      .catch(() => {})
  }, [approved])
  const currentType = TYPE_OPTIONS.find(t => t.value === type)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approved) {
      router.push(signedIn ? '/account/setup' : '/login?next=/19th-hole/host')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const titleStub =
        type === 'drinks' ? 'Drinks' :
        type === 'dinner' ? 'Dinner' :
        type === 'coffee' ? 'Coffee' : 'Penn Golf gathering'
      const title = venue.trim() ? `${titleStub} at ${venue.trim()}` : titleStub
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: 'penn-mens-golf',
          type,
          title,
          hostName: session?.user?.name ?? 'Penn Golf Member',
          hostPersonId: session?.linkedPersonId,
          dateText: dateText.trim(),
          timeText: timeText.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          venue: venue.trim() || undefined,
          audience,
          vibe: 'social',
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          mapsUrl: mapsUrl.trim() || undefined,
          notifyMode,
          inviteBookIds: notifyMode === 'invite' ? invited.map(i => i.bookId) : [],
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      setSubmittedVenue(venue.trim() || titleStub.toLowerCase())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedVenue) {
    function resetForm() {
      setType('drinks')
      setVenue('')
      setCity('')
      setState('')
      setDateText('')
      setTimeText('')
      setAudience('both')
      setDescription('')
      setImageUrl('')
      setMapsUrl('')
      setSubmittedVenue(null)
    }
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#0a1628] px-6 py-20 flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <Beer className="w-7 h-7 text-[#b8860b] mx-auto mb-4" />
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2 font-heading"
          >
            Round&rsquo;s on you.
          </h1>
          <p className="text-[13px] text-[#3d4a5c] mb-7">
            Your {currentType.label.toLowerCase()} at{' '}
            <span className="text-[#0a1628]">{submittedVenue}</span> is up on the
            wall. Members can express interest from the 19th Hole.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/19th-hole"
              className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              See it on the 19th Hole
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Host another
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
    <div className="min-h-screen bg-[#0a1628]">
      {/* Hero strip */}
      <div className="px-5 sm:px-8 py-5 border-b border-white/[0.08]">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/19th-hole"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to the 19th Hole</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b8860b]">
            19th Hole · New Gathering
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 12px 32px rgba(10,22,40,0.18)' }}
        >
          {/* Form header */}
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
            <span className="block w-10 h-[2px] bg-[#b8860b] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading"
            >
              Host the 19th
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              Pick a spot, set a time. Penn Golf finds you there. Use this for any
              non-golf gathering, drinks, dinner, a quick coffee, or a one-off event.
            </p>
          </div>

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
              <p className="text-[13px] text-[#3d4a5c]">
                {signedIn
                  ? 'Claim your Member Book card to host. The captain approves new members within a day or two. '
                  : 'Sign in and claim your card to host a gathering. '}
                <Link
                  href={signedIn ? '/account/setup' : '/login?next=/19th-hole/host'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  {signedIn ? 'Claim your card' : 'Sign in'} &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Kind of gathering
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPE_OPTIONS.map((t) => {
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`text-[12.5px] font-medium px-3 py-2.5 rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#0a1628] text-white border-[#0a1628]'
                          : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11.5px] text-ink-muted mt-2">{currentType.helper}</p>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. The Continental, Philly"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              />
            </div>

            {/* City / State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Philadelphia"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="PA"
                  maxLength={2}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] uppercase text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                />
              </div>
            </div>

            {/* Google Maps link */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Google Maps link (optional)
              </label>
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="Paste a Google Maps link, or leave blank and we'll map the venue"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              />
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="Friday, June 13"
                  required
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                  Time
                </label>
                <input
                  type="text"
                  value={timeText}
                  onChange={(e) => setTimeText(e.target.value)}
                  placeholder="7:30 PM"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                />
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Who can join
              </label>
              <div className="flex gap-2 flex-wrap">
                {AUDIENCE_OPTIONS.map((a) => {
                  const active = audience === a.value
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={`text-[12.5px] font-medium px-3 py-2.5 rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#0a1628] text-white border-[#0a1628]'
                          : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#0a1628]'
                      }`}
                    >
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Photo / video */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Photo or video (optional)
              </label>
              <PhotoUpload
                value={imageUrl}
                onChange={setImageUrl}
                label=""
                shape="wide"
                allowVideo
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8860b] mb-2">
                Notes (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Reservation under whose name, dress code, who you'd love to see show up..."
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              />
            </div>

            {/* Who hears about it */}
            <NotifyChoice
              mode={notifyMode}
              onModeChange={setNotifyMode}
              invited={invited}
              onInvitedChange={setInvited}
              options={bookOptions}
              noun="gathering"
              placeLabel={city.trim() ? `in ${city.trim()}` : 'in that city or state'}
            />

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !approved}
                className="bg-[#b8860b] hover:bg-[#9d7209] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting…' : 'Post to the wall'}
              </button>
              <Link
                href="/19th-hole"
                className="text-[12px] text-ink-muted hover:text-[#0a1628]"
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
