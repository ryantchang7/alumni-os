'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Camera, Lock } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'

export default function NewMomentPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [photoUrl, setPhotoUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [caption, setCaption] = useState('')
  const [audience, setAudience] = useState<'public' | 'locker-room'>('public')
  const [canSeeLockerRoom, setCanSeeLockerRoom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId

  useEffect(() => {
    if (!approved) return
    fetch('/api/me/access')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.canSeeLockerRoom) setCanSeeLockerRoom(true)
      })
      .catch(() => {})
  }, [approved])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approved) {
      router.push(signedIn ? '/account/setup' : '/login?next=/moments/new')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, mediaType, caption, audience }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      router.push(audience === 'locker-room' ? '/locker-room' : '/moments')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Moments</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
            Penn Men&rsquo;s Golf · Post
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
          }}
        >
          <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
            <span className="block w-10 h-[2px] bg-[#c8a84b] mb-5" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Post a moment
            </h1>
            <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
              Share a photo + caption with the Penn Golf network. Anything from
              a round to a championship to a 4 AM dinner after the alumni weekend.
            </p>
          </div>

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 bg-[#faf7f2] border-b border-[rgba(180,168,150,0.3)]">
              <p className="text-[13px] text-[#3d4a5c]">
                {signedIn
                  ? 'Claim your Member Book card to post a Moment. The captain approves new members within a day or two. '
                  : 'Sign in and claim your card to post a Moment. '}
                <Link
                  href={signedIn ? '/account/setup' : '/login?next=/moments/new'}
                  className="text-[#990000] hover:underline font-semibold"
                >
                  {signedIn ? 'Claim your card' : 'Sign in'} &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            <PhotoUpload
              value={photoUrl}
              onChange={(url) => {
                setPhotoUrl(url)
                // Re-sniff in case the user pasted a URL directly.
                if (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url)) setMediaType('video')
                else if (url) setMediaType('image')
              }}
              onMediaTypeChange={setMediaType}
              label="Photo or video"
              shape="wide"
              allowVideo
            />

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                maxLength={800}
                placeholder="What's the moment?"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
              <p className="text-[11px] text-[#8a7f70] mt-1 text-right">
                {caption.length} / 800
              </p>
            </div>

            {canSeeLockerRoom && (
              <div className="border border-[rgba(180,168,150,0.5)] rounded-lg p-4 bg-[#faf7f2]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audience === 'locker-room'}
                    onChange={e => setAudience(e.target.checked ? 'locker-room' : 'public')}
                    className="mt-0.5 w-4 h-4 accent-[#0a1628] cursor-pointer"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0a1628]">
                      <Lock className="w-3.5 h-3.5" />
                      Locker Room only
                    </span>
                    <span className="block text-[12px] text-[#8a7f70] mt-1 leading-relaxed">
                      Visible to current players and alumni. Hidden from
                      coaches, family, and anyone outside the team.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !approved || !photoUrl || !caption.trim()}
                className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                {submitting ? 'Posting…' : 'Post moment'}
              </button>
              <Link
                href="/moments"
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
