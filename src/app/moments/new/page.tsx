'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Camera } from 'lucide-react'

export default function NewMomentPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [photoUrl, setPhotoUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signedIn = sessionStatus === 'authenticated'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signedIn) {
      router.push('/login?next=/moments/new')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, caption }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Submit failed (${res.status})`)
      }
      router.push('/moments')
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

          {!signedIn && sessionStatus !== 'loading' && (
            <div className="px-7 sm:px-10 py-6 bg-[#faf7f2] border-b border-[rgba(180,168,150,0.3)]">
              <p className="text-[13px] text-[#3d4a5c]">
                Sign in with Google to post.{' '}
                <Link
                  href="/login?next=/moments/new"
                  className="text-[#990000] hover:underline font-semibold"
                >
                  Sign in &rarr;
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-6">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-2">
                Photo URL
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                required
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-4 py-2.5 text-[14px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
              <p className="text-[11px] text-[#8a7f70] mt-2">
                Paste any image URL. Direct uploads coming soon.
              </p>
            </div>

            {/* Photo preview */}
            {photoUrl && (
              <div className="rounded-lg overflow-hidden bg-[#faf7f2] border border-[rgba(180,168,150,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="preview"
                  className="w-full max-h-[420px] object-cover"
                  onError={() => setError('That URL didn\'t load as an image. Try a different one.')}
                />
              </div>
            )}

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

            {error && (
              <div className="px-4 py-3 bg-[#990000]/8 border border-[#990000]/25 rounded-lg">
                <p className="text-[13px] text-[#990000]">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting || !signedIn || !photoUrl || !caption.trim()}
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
