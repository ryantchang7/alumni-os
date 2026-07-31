'use client'

/**
 * MomentEditForm — the full edit surface for a Moment: caption, photos +
 * videos (reorder/add/remove, max 8 min 1), tags, and audience. Rendered
 * by MomentCard only after the owner (or founder) clicks Edit, so the
 * member-book options + viewer-access fetches are lazy by construction.
 *
 * Save PATCHes /api/moments/[id] with BOTH tag arrays — chips with a
 * bookId go as taggedBookIds, legacy chips without one keep their
 * personId — so pre-book-tagging posts round-trip losslessly.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import type { ClubhouseMoment } from '@/lib/store/types'
import MediaThumbStrip from '@/components/moments/MediaThumbStrip'
import PhotoUpload from '@/components/PhotoUpload'
import TagPicker, { type TagChip } from '@/components/moments/TagPicker'

type MediaItem = { url: string; type: 'image' | 'video' }
type TaggedMember = { personId: string; name: string; bookId: string | null }

interface Props {
  moment: ClubhouseMoment
  caption: string
  media: MediaItem[]
  taggedMembers: TaggedMember[]
  audience: 'public' | 'locker-room'
  onSaved: (next: {
    caption: string
    media: MediaItem[]
    taggedMembers: TaggedMember[]
    audience: 'public' | 'locker-room'
  }) => void
  onCancel: () => void
}

export default function MomentEditForm({
  moment,
  caption,
  media,
  taggedMembers,
  audience,
  onSaved,
  onCancel,
}: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState(caption)
  const [editMedia, setEditMedia] = useState<MediaItem[]>(media)
  const [upload, setUpload] = useState('')
  const [tagged, setTagged] = useState<TagChip[]>(
    taggedMembers.map(t => ({
      key: t.personId,
      name: t.name,
      bookId: t.bookId,
      personId: t.personId.startsWith('book:') ? undefined : t.personId,
    })),
  )
  const [draftAudience, setDraftAudience] = useState(audience)
  const [options, setOptions] = useState<{ bookId: string; name: string }[]>([])
  const [canSeeLockerRoom, setCanSeeLockerRoom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/member-book/options')
      .then(r => r.json())
      .then(d => setOptions(Array.isArray(d.members) ? d.members : []))
      .catch(() => {})
    fetch('/api/me/access')
      .then(r => r.json())
      .then(d => setCanSeeLockerRoom(!!d.canSeeLockerRoom))
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/moments/${encodeURIComponent(moment.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: draft.trim(),
          media: editMedia,
          taggedBookIds: tagged.filter(t => t.bookId).map(t => t.bookId as string),
          taggedPersonIds: tagged.filter(t => !t.bookId && t.personId).map(t => t.personId as string),
          audience: draftAudience,
        }),
      })
      if (res.ok) {
        onSaved({
          caption: draft.trim(),
          media: editMedia,
          taggedMembers: tagged.map(t => ({
            personId: t.personId ?? (t.bookId ? `book:${t.bookId}` : t.key),
            name: t.name,
            bookId: t.bookId,
          })),
          audience: draftAudience,
        })
        // Audience flips change which feeds include this post.
        if (draftAudience !== audience) router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Could not save. Try again.')
      }
    } catch {
      setError('Could not connect. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const lockerMode = draftAudience === 'locker-room'

  return (
    <div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={3}
        maxLength={800}
        className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
      />

      {/* Media editor — reorder, remove, add (max 8) */}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
          Photos &amp; videos ({editMedia.length}/8)
        </p>
        {editMedia.length > 0 && (
          <div className="mb-2">
            <MediaThumbStrip items={editMedia} onChange={setEditMedia} />
          </div>
        )}
        {editMedia.length < 8 && (
          <PhotoUpload
            value={upload}
            onChange={(url) => {
              if (!url) { setUpload(''); return }
              const type: 'image' | 'video' = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? 'video' : 'image'
              setEditMedia(prev => (prev.length >= 8 || prev.some(m => m.url === url) ? prev : [...prev, { url, type }]))
              setUpload('')
            }}
            label="Add photos or videos"
            shape="wide"
            allowVideo
            multiple
            maxFiles={8 - editMedia.length}
          />
        )}
        {editMedia.length === 0 && (
          <p className="text-[11.5px] text-[#990000] mt-1">A moment needs at least one photo or video.</p>
        )}
      </div>

      {/* Tags */}
      <div className="mt-4">
        <TagPicker options={options} tagged={tagged} onChange={setTagged} />
      </div>

      {/* Audience — only members who can see the Locker Room may flip it */}
      {canSeeLockerRoom && (
        <div
          className={`mt-4 rounded-lg p-3 transition-colors border ${
            lockerMode
              ? 'bg-[#0a1628] border-[#c8a84b]/55 text-white'
              : 'bg-[#fdfcf9] border-[rgba(180,168,150,0.5)]'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lockerMode}
              onChange={e => setDraftAudience(e.target.checked ? 'locker-room' : 'public')}
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
                Visible to current players and alumni. Hidden from coaches,
                family, and anyone outside the team.
              </span>
            </span>
          </label>
        </div>
      )}

      {error && <p className="text-[11.5px] text-[#990000] mt-2">{error}</p>}
      <div className="flex gap-3 mt-3">
        <button
          type="button"
          disabled={saving || !draft.trim() || editMedia.length === 0}
          onClick={handleSave}
          className="text-[11.5px] font-semibold uppercase tracking-[0.14em] bg-[#0a1628] text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11.5px] text-ink-muted hover:text-[#0a1628]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
