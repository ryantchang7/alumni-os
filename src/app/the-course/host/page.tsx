'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Flag, ArrowLeft } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'

const VIBE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'social', label: 'Social' },
] as const

export default function HostRoundPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [course, setCourse] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [dateText, setDateText] = useState('')
  const [timeText, setTimeText] = useState('')
  const [vibe, setVibe] = useState<(typeof VIBE_OPTIONS)[number]['value']>('casual')
  const [capacity, setCapacity] = useState('3')
  const [description, setDescription] = useState('')
  const [audience, setAudience] = useState<'players' | 'alumni' | 'both'>('both')
  const [imageUrl, setImageUrl] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approved) {
      router.push(signedIn ? '/account/setup' : '/login?next=/the-course/host')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSlug: 'penn-mens-golf',
          type: 'round',
          title: course.trim() || 'Penn Golf Round',
          hostName: session?.user?.name ?? 'Penn Golf Member',
          hostPersonId: session?.linkedPersonId,
          dateText: dateText.trim(),
          timeText: timeText.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          venue: course.trim() || undefined,
          audience,
          vibe,
          capacity: Number.isFinite(Number.parseInt(capacity, 10))
            ? Number.parseInt(capacity, 10)
            : undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          mapsUrl: mapsUrl.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      const j = await res.json()
      setSubmittedId(j.gathering?.id ?? 'ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    // Local reset so the "Host another" button clears the form +
    // returns to the editor without a full page reload.
    function resetForm() {
      setCourse('')
      setCity('')
      setState('')
      setDateText('')
      setTimeText('')
      setCapacity('3')
      setDescription('')
      setAudience('both')
      setVibe('casual')
      setImageUrl('')
      setMapsUrl('')
      setSubmittedId(null)
    }
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f4ecdb] px-6 py-20 flex items-center justify-center">
        <div
          className="w-full max-w-md bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-8 py-10 text-center"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          <Flag className="w-7 h-7 text-[#2d6a4f] mx-auto mb-4" />
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2 font-heading"
          >
            Tee box opened.
          </h1>
          <p className="text-[13px] text-[#3d4a5c] mb-7">
            Your round at <span className="text-[#0a1628]">{course || 'your home course'}</span>{' '}
            is on the Tee Sheet. Members can express interest from The Course page.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/the-course#rounds-section"
              className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              See your round on the Tee Sheet
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
    <div className="min-h-screen bg-[#f4ecdb]">
      {/* Hero strip */}
      <div className="px-5 sm:px-8 py-5 border-b border-[#d9c8a8]/40">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/the-course"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#3d4a5c] hover:text-[#0a1628] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to The Course</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5a7a3e]">
            Tee Sheet · New Round
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)' }}
        >
          {/* Form header — scorecard motif */}
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
            <span className="block w-10 h-[2px] bg-[#5a7a3e] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading"
            >
              Host a Round
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              Open a tee time at your home course. Members can express interest and the
              host will coordinate from there.
            </p>
          </div>

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
              <p className="text-[13px] text-[#3d4a5c]">
                {signedIn
                  ? 'Claim your Member Book card to host. The captain approves new members within a day or two. '
                  : 'Sign in and claim your card to host a round. '}
                <Link
                  href={signedIn ? '/account/setup' : '/login?next=/the-course/host'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  {signedIn ? 'Claim your card' : 'Sign in'} &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            {/* Course */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                Course
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Winged Foot Golf Club"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
              />
            </div>

            {/* City / State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mamaroneck"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] uppercase text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
                />
              </div>
            </div>

            {/* Google Maps link */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                Google Maps link (optional)
              </label>
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="Paste a Google Maps link — or leave blank and we'll map the course"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
              />
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="Saturday, June 14"
                  required
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  Tee time
                </label>
                <input
                  type="text"
                  value={timeText}
                  onChange={(e) => setTimeText(e.target.value)}
                  placeholder="8:30 AM"
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
                />
              </div>
            </div>

            {/* Players looking for / vibe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  Players looking for
                </label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
                >
                  <option value="1">1 more (twosome)</option>
                  <option value="2">2 more (threesome)</option>
                  <option value="3">3 more (foursome)</option>
                  <option value="4">4 more (open round)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                  Vibe
                </label>
                <div className="flex gap-2">
                  {VIBE_OPTIONS.map((v) => {
                    const active = vibe === v.value
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setVibe(v.value)}
                        className={`text-[12.5px] font-medium px-3 py-2.5 rounded-lg border transition-colors ${
                          active
                            ? 'bg-[#5a7a3e] text-white border-[#5a7a3e]'
                            : 'bg-white text-[#3d4a5c] border-[rgba(180,168,150,0.5)] hover:border-[#5a7a3e]'
                        }`}
                      >
                        {v.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                Who can join
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'both', label: 'Players + Alumni' },
                  { value: 'alumni', label: 'Alumni only' },
                  { value: 'players', label: 'Current Players' },
                ].map((a) => {
                  const active = audience === a.value
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value as typeof audience)}
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
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
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
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7a3e] mb-2">
                Notes (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Handicap range, lunch after, anything to add..."
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#5a7a3e]/30 focus:border-[#5a7a3e]"
              />
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
                className="bg-[#5a7a3e] hover:bg-[#4a6a35] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Opening tee box…' : 'Open the tee box'}
              </button>
              <Link
                href="/the-course"
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
