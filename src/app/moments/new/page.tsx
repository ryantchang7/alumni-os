'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Camera, Lock } from 'lucide-react'
import PhotoUpload from '@/components/PhotoUpload'
import MediaThumbStrip from '@/components/moments/MediaThumbStrip'
import TagPicker, { type TagChip } from '@/components/moments/TagPicker'

// Next.js requires any component that reads useSearchParams() to live
// inside a <Suspense> boundary so the static prerender pass can bail out
// cleanly. We pull the form into its own component and Suspense-wrap it
// from the default export below.
function NewMomentForm() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [photoUrl, setPhotoUrl] = useState('')
  const [mediaList, setMediaList] = useState<Array<{ url: string; type: 'image' | 'video' }>>([])
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [caption, setCaption] = useState('')
  const [audience, setAudience] = useState<'public' | 'locker-room'>('public')
  const [canSeeLockerRoom, setCanSeeLockerRoom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<Array<{ bookId: string; name: string }>>([])
  const [tagged, setTagged] = useState<TagChip[]>([])

  const signedIn = sessionStatus === 'authenticated'
  const approved = signedIn && !!session?.linkedPersonId
  const lockerMode = audience === 'locker-room'

  useEffect(() => {
    if (!approved) return
    fetch('/api/me/access')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.canSeeLockerRoom) {
          setCanSeeLockerRoom(true)
          // Honor ?audience=locker-room from /locker-room's "Post to the
          // Locker Room" CTA — pre-select the toggle for eligible users.
          if (searchParams.get('audience') === 'locker-room') {
            setAudience('locker-room')
          }
        }
      })
      .catch(() => {})
  }, [approved, searchParams])

  // The whole Member Book for the tag picker — tag anyone, claimed or not.
  useEffect(() => {
    if (!approved) return
    fetch('/api/member-book/options')
      .then(r => (r.ok ? r.json() : { members: [] }))
      .then(d => setMembers((d.members ?? []) as Array<{ bookId: string; name: string }>))
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
        body: JSON.stringify({
          media: mediaList,
          caption,
          audience,
          taggedBookIds: tagged.map(t => t.bookId as string),
        }),
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
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href={lockerMode ? '/locker-room' : '/moments'}
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lockerMode ? 'Back to the Locker Room' : 'Back to Moments'}</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85">
            {lockerMode ? 'Penn Men’s Golf · Locker Room' : 'Penn Men’s Golf · Post'}
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div
          className={`border rounded-2xl overflow-hidden transition-colors ${
            lockerMode
              ? 'bg-white border-[#c8a84b]/45'
              : 'bg-white border-[rgba(180,168,150,0.4)]'
          }`}
          style={{
            boxShadow: lockerMode
              ? '0 1px 3px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.18)'
              : '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
          }}
        >
          {lockerMode ? (
            // Locker-room theme: dark navy header with gold accents so the
            // poster sees, before they hit submit, that this post is going
            // somewhere different than /moments.
            <div className="px-7 sm:px-10 pt-10 pb-7 bg-[#0a1628] text-white relative overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-4 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Posting to the Locker Room
              </p>
              <h1
                className="text-white text-3xl sm:text-4xl font-medium leading-tight font-heading"
              >
                Just for the team.
              </h1>
              <p className="text-white/70 text-[13px] mt-3 max-w-lg leading-relaxed">
                Current players and alumni see this. Coaches and family
                don&rsquo;t. Drop a road trip dinner, a pre-round shot, a
                Penn-Princeton afterparty.
              </p>
            </div>
          ) : (
            <div className="px-7 sm:px-10 pt-10 pb-6 border-b border-[rgba(180,168,150,0.3)] bg-[#fdfcf9]">
              <span className="block w-10 h-[2px] bg-[#c8a84b] mb-5" />
              <h1
                className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight font-heading"
              >
                Post a moment
              </h1>
              <p className="text-[13px] text-[#3d4a5c]/80 mt-3 max-w-lg">
                Share a photo + caption with the Penn Golf network. Anything from
                a round to a championship to a 4 AM dinner after the alumni weekend.
              </p>
            </div>
          )}

          {!approved && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 bg-[#fdfcf9] border-b border-[rgba(180,168,150,0.3)]">
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
            {mediaList.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                  In this moment ({mediaList.length}/8)
                </label>
                <MediaThumbStrip items={mediaList} onChange={setMediaList} />
              </div>
            )}
            {mediaList.length < 8 && (
              <PhotoUpload
                value={photoUrl}
                onChange={(url) => {
                  if (!url) { setPhotoUrl(''); return }
                  const type: 'image' | 'video' = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? 'video' : 'image'
                  setMediaList(prev => (prev.length >= 8 || prev.some(m => m.url === url) ? prev : [...prev, { url, type }]))
                  setPhotoUrl('')
                }}
                onMediaTypeChange={setMediaType}
                label={mediaList.length === 0 ? 'Photos or videos' : 'Add more photos or videos'}
                shape="wide"
                allowVideo
                multiple
                maxFiles={8 - mediaList.length}
              />
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
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
              <p className="text-[11px] text-ink-muted mt-1 text-right">
                {caption.length} / 800
              </p>
            </div>

            <TagPicker options={members} tagged={tagged} onChange={setTagged} />

            {canSeeLockerRoom && (
              <div
                className={`rounded-lg p-4 transition-colors border ${
                  lockerMode
                    ? 'bg-[#0a1628] border-[#c8a84b]/55 text-white'
                    : 'bg-[#fdfcf9] border-[rgba(180,168,150,0.5)]'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockerMode}
                    onChange={e => setAudience(e.target.checked ? 'locker-room' : 'public')}
                    className={`mt-0.5 w-4 h-4 cursor-pointer ${
                      lockerMode ? 'accent-[#c8a84b]' : 'accent-[#0a1628]'
                    }`}
                  />
                  <span className="flex-1">
                    <span
                      className={`flex items-center gap-1.5 text-[13px] font-semibold ${
                        lockerMode ? 'text-[#c8a84b]' : 'text-[#0a1628]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {lockerMode ? 'Locker Room Only — Active' : 'Locker Room only'}
                    </span>
                    <span
                      className={`block text-[12px] mt-1 leading-relaxed ${
                        lockerMode ? 'text-white/75' : 'text-ink-muted'
                      }`}
                    >
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
                disabled={submitting || !approved || mediaList.length === 0 || !caption.trim()}
                className={`inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  lockerMode
                    ? 'bg-[#0a1628] hover:bg-[#112240] text-[#c8a84b] border border-[#c8a84b]/55 hover:shadow-[0_0_22px_rgba(200,168,75,0.35)]'
                    : 'bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628]'
                }`}
              >
                {lockerMode ? <Lock className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {submitting
                  ? 'Posting…'
                  : lockerMode
                    ? 'Post to the Locker Room'
                    : 'Post moment'}
              </button>
              <Link
                href={lockerMode ? '/locker-room' : '/moments'}
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

export default function NewMomentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf9f6]" />}>
      <NewMomentForm />
    </Suspense>
  )
}
