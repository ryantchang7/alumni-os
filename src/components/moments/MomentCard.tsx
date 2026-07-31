'use client'

/**
 * MomentCard — full interactive card for a single Moment.
 *
 * Renders the photo / video + caption, an emoji reactions row (with a
 * full picker behind a "+"), and a comments thread (one-level reply
 * nesting). Posting + reacting requires the viewer to be approved
 * (linkedPersonId). Locker-Room moments are pre-gated upstream by the
 * page that loads the cards; the API double-checks on every write.
 */

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Lock, Pencil, Reply, SmilePlus, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ClubhouseMoment, MomentComment, MomentReaction } from '@/lib/store/types'
import type { BadgeId } from '@/lib/badges'
import MemberBadges from '@/components/MemberBadges'
import ConfirmDialog from '@/components/ConfirmDialog'
import PhotoUpload from '@/components/PhotoUpload'

// emoji-picker-react is browser-only and large; load it lazily so it
// doesn't bloat the initial bundle. The picker only mounts after the
// user clicks the "+" trigger.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface Props {
  moment: ClubhouseMoment
  /** Member Book id for the poster (null if no match). */
  bookId: string | null
  /** Badges to render next to the poster's name. */
  posterBadges: BadgeId[]
  /** Server-side initial reactions for this moment. */
  initialReactions: MomentReaction[]
  /** Server-side initial published comments for this moment. */
  initialComments: MomentComment[]
  /** Current viewer's accountId, or null if signed out. */
  viewerAccountId: string | null
  /** True when the viewer can comment / react (approved + linked). */
  canPost: boolean
  /** Optional small "Locker Room" pill on the photo — pass true on the
   *  /locker-room feed. /moments suppresses it (audience is implicit
   *  from the tab). */
  showLockerPill?: boolean
  /** True when the current viewer is a captain or founder — shows the
   *  Feature/Unfeature toggle. Never exposed to regular members. */
  isCaptain?: boolean
  /** Members tagged in this moment, hydrated server-side (name + book link). */
  taggedMembers?: Array<{ personId: string; name: string; bookId: string | null }>
  /** True for the founder — can edit any post (site-creator moderation). */
  isFounder?: boolean
}

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

interface EmojiPickerEvent {
  emoji: string
}

export default function MomentCard({
  moment,
  bookId,
  posterBadges,
  initialReactions,
  initialComments,
  viewerAccountId,
  canPost,
  showLockerPill,
  isCaptain = false,
  taggedMembers,
  isFounder = false,
}: Props) {
  const initialMedia = moment.media?.length
    ? moment.media
    : [{ url: moment.photoUrl, type: moment.mediaType ?? ('image' as const) }]
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' }[]>(initialMedia)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [caption, setCaption] = useState(moment.caption)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const [editMedia, setEditMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([])
  const [editUpload, setEditUpload] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [reactions, setReactions] = useState<MomentReaction[]>(initialReactions)
  const [comments, setComments] = useState<MomentComment[]>(initialComments)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Take-down — only the poster sees this, in case they posted by mistake.
  const isOwn = !!viewerAccountId && viewerAccountId === moment.postedByAccountId
  const [removed, setRemoved] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  // Captain's Pick — captains + founder can feature / unfeature.
  const [featured, setFeatured] = useState(!!moment.featuredAt)
  const [featuring, setFeaturing] = useState(false)

  async function handleFeatureToggle() {
    setFeaturing(true)
    try {
      const res = await fetch(`/api/moments/${encodeURIComponent(moment.id)}/feature`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json() as { featured: boolean }
        setFeatured(data.featured)
      }
    } finally {
      setFeaturing(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    setRemoveError(null)
    try {
      const res = await fetch(`/api/moments/${encodeURIComponent(moment.id)}`, { method: 'DELETE' })
      if (res.ok) {
        setRemoved(true)
      } else {
        const d = await res.json().catch(() => ({}))
        setRemoveError(d.error ?? 'Could not take it down. Try again.')
        setRemoving(false)
      }
    } catch {
      setRemoveError('Could not connect. Try again.')
      setRemoving(false)
    }
  }

  // Group reactions by emoji and count; track whether the current viewer
  // is one of the reactors for cheap toggle UI.
  const groupedReactions = useMemo(() => {
    const map = new Map<string, { count: number; viewerReacted: boolean }>()
    for (const r of reactions) {
      const cur = map.get(r.emoji) ?? { count: 0, viewerReacted: false }
      cur.count += 1
      if (r.fromAccountId === viewerAccountId) cur.viewerReacted = true
      map.set(r.emoji, cur)
    }
    // Sort by count desc, then emoji asc for stability.
    return Array.from(map.entries())
      .map(([emoji, agg]) => ({ emoji, ...agg }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji))
  }, [reactions, viewerAccountId])

  const topLevelComments = useMemo(
    () => comments.filter(c => !c.parentCommentId),
    [comments],
  )

  function repliesFor(parentId: string): MomentComment[] {
    return comments.filter(c => c.parentCommentId === parentId)
  }

  async function toggleReaction(emoji: string) {
    if (!canPost) {
      setError('Sign in and claim your card to react.')
      return
    }
    setError(null)
    // Optimistic toggle.
    const viewerHas = reactions.some(
      r => r.fromAccountId === viewerAccountId && r.emoji === emoji,
    )
    const snapshot = reactions
    setReactions(prev =>
      viewerHas
        ? prev.filter(
            r => !(r.fromAccountId === viewerAccountId && r.emoji === emoji),
          )
        : [
            ...prev,
            {
              id: `tmp_${Date.now()}`,
              momentId: moment.id,
              teamId: moment.teamId,
              fromAccountId: viewerAccountId ?? 'tmp',
              emoji,
              createdAt: new Date().toISOString(),
            },
          ],
    )
    try {
      const res = await fetch(`/api/moments/${moment.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { reaction: MomentReaction | null; removed: boolean }
      // Replace the optimistic record with the server one if added.
      if (!data.removed && data.reaction) {
        setReactions(prev =>
          prev.map(r =>
            r.id.startsWith('tmp_') && r.emoji === emoji && r.fromAccountId === viewerAccountId
              ? data.reaction!
              : r,
          ),
        )
      }
    } catch {
      setReactions(snapshot) // revert
      setError('Could not save reaction.')
    }
  }

  function onEmojiPick(e: EmojiPickerEvent) {
    setPickerOpen(false)
    if (e.emoji) toggleReaction(e.emoji)
  }

  async function postComment(text: string, parentCommentId?: string) {
    if (!canPost) {
      setError('Sign in and claim your card to comment.')
      return
    }
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`/api/moments/${moment.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, parentCommentId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Could not post comment')
      }
      const { comment } = (await res.json()) as { comment: MomentComment }
      setComments(prev => [...prev, comment])
      if (parentCommentId) {
        setReplyDraft('')
        setReplyTo(null)
      } else {
        setCommentDraft('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPosting(false)
    }
  }

  if (removed) {
    return (
      <article className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-6 py-5">
        <p className="text-[13px] text-ink-muted">Taken down. This moment was removed.</p>
      </article>
    )
  }

  return (
    <article
      className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
      }}
    >
      {/* Media — single item renders plain; multiple items get a carousel */}
      <div className={`relative ${moment.audience === 'locker-room' ? 'bg-[#0a1628]' : 'bg-[#fdfcf9]'}`}>
        {media[mediaIdx].type === 'video' ? (
          <video
            key={media[mediaIdx].url}
            src={media[mediaIdx].url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[640px] object-contain bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media[mediaIdx].url}
            alt={moment.caption}
            loading="lazy"
            decoding="async"
            className="w-full max-h-[640px] object-cover"
          />
        )}
        {media.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setMediaIdx(i => (i - 1 + media.length) % media.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0a1628]/70 hover:bg-[#0a1628] text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setMediaIdx(i => (i + 1) % media.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0a1628]/70 hover:bg-[#0a1628] text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {media.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to item ${i + 1}`}
                  onClick={() => setMediaIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === mediaIdx ? 'bg-[#c8a84b]' : 'bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
            <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0a1628]/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
              {mediaIdx + 1} / {media.length}
            </span>
          </>
        )}
        {showLockerPill && moment.audience === 'locker-room' ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[#0a1628]/90 backdrop-blur-sm text-[#c8a84b] text-[11px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-[#c8a84b]/55">
            <Lock className="w-2.5 h-2.5" />
            Locker Room
          </span>
        ) : null}
        {/* Captain's Pick ribbon — visible to everyone when featured */}
        {featured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#c8a84b] text-[#0a1628] text-[10.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
            style={{ boxShadow: '0 2px 8px rgba(200,168,75,0.45)' }}
          >
            <Star className="w-2.5 h-2.5 fill-current" />
            Captain&apos;s Pick
          </span>
        )}
      </div>

      <div className="px-6 sm:px-8 py-5">
        {editing ? (
          <div>
            <textarea
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              rows={3}
              maxLength={800}
              className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[14px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30"
            />
            {/* Media editor — remove ✕ per item, add more up to 8 */}
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                Photos &amp; videos ({editMedia.length}/8)
              </p>
              {editMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {editMedia.map((m, i) => (
                    <div key={`${m.url}-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[rgba(180,168,150,0.5)] bg-[#fdfcf9]">
                      {m.type === 'video' ? (
                        <video src={m.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        aria-label="Remove this photo or video"
                        onClick={() => setEditMedia(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-[#990000] text-white text-[11px] leading-none flex items-center justify-center"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {editMedia.length < 8 && (
                <PhotoUpload
                  value={editUpload}
                  onChange={(url) => {
                    if (!url) { setEditUpload(''); return }
                    const type: 'image' | 'video' = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? 'video' : 'image'
                    setEditMedia(prev => (prev.some(m => m.url === url) ? prev : [...prev, { url, type }]))
                    setEditUpload('')
                  }}
                  label="Add a photo or video"
                  shape="wide"
                  allowVideo
                />
              )}
              {editMedia.length === 0 && (
                <p className="text-[11.5px] text-[#990000] mt-1">A moment needs at least one photo or video.</p>
              )}
            </div>
            {editError && <p className="text-[11.5px] text-[#990000] mt-2">{editError}</p>}
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                disabled={savingEdit || !editDraft.trim() || editMedia.length === 0}
                onClick={async () => {
                  setSavingEdit(true)
                  setEditError(null)
                  try {
                    const res = await fetch(`/api/moments/${encodeURIComponent(moment.id)}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ caption: editDraft.trim(), media: editMedia }),
                    })
                    if (res.ok) {
                      setCaption(editDraft.trim())
                      setMedia(editMedia)
                      setMediaIdx(0)
                      setEditing(false)
                    } else {
                      const d = await res.json().catch(() => ({}))
                      setEditError(d.error ?? 'Could not save. Try again.')
                    }
                  } catch {
                    setEditError('Could not connect. Try again.')
                  } finally {
                    setSavingEdit(false)
                  }
                }}
                className="text-[11.5px] font-semibold uppercase tracking-[0.14em] bg-[#0a1628] text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditError(null) }}
                className="text-[11.5px] text-ink-muted hover:text-[#0a1628]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[14.5px] text-[#0a1628] leading-relaxed whitespace-pre-wrap">
            {caption}
          </p>
        )}
        {taggedMembers && taggedMembers.length > 0 && (
          <p className="mt-2 text-[13px] text-ink-muted">
            With{' '}
            {taggedMembers.map((t, i) => (
              <span key={t.personId}>
                {i > 0 && (i === taggedMembers.length - 1 ? ' and ' : ', ')}
                {t.bookId ? (
                  <Link
                    href={`/member-book/${encodeURIComponent(t.bookId)}`}
                    className="text-[#0a1628] font-medium hover:underline"
                  >
                    {t.name}
                  </Link>
                ) : (
                  <span className="text-[#0a1628] font-medium">{t.name}</span>
                )}
              </span>
            ))}
          </p>
        )}
        <div className="mt-4 flex items-baseline justify-between gap-3 text-[12px]">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <p className="text-ink-muted">
              <span className="text-ink-muted">Posted by </span>
              {bookId ? (
                <Link
                  href={`/member-book/${encodeURIComponent(bookId)}`}
                  className="text-[#0a1628] hover:underline font-medium font-heading"
                >
                  {moment.postedByName}
                </Link>
              ) : (
                <span
                  className="text-[#0a1628] font-medium font-heading"
                >
                  {moment.postedByName}
                </span>
              )}
            </p>
            <MemberBadges badges={posterBadges} size="sm" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Captain's Pick toggle — captains + founder only, never regular members */}
            {isCaptain && (
              <button
                type="button"
                onClick={handleFeatureToggle}
                disabled={featuring}
                title={featured ? 'Remove Captain\'s Pick' : 'Feature as Captain\'s Pick'}
                className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                  featured
                    ? 'text-[#c8a84b] hover:text-[#9a7e38]'
                    : 'text-ink-muted hover:text-[#c8a84b]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${featured ? 'fill-current' : ''}`} />
                <span>{featuring ? '…' : featured ? 'Unfeature' : 'Feature'}</span>
              </button>
            )}
            {(isOwn || isFounder) && (
              <button
                type="button"
                onClick={() => {
                  setEditDraft(caption)
                  setEditMedia(media)
                  setEditError(null)
                  setEditing(true)
                }}
                disabled={editing}
                title="Edit this moment's caption, photos and videos"
                className="inline-flex items-center gap-1 text-ink-muted hover:text-[#0a1628] disabled:opacity-40 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Edit</span>
              </button>
            )}
            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveOpen(true)}
                  disabled={removing}
                  title="Take down this moment"
                  className="inline-flex items-center gap-1 text-[#990000]/70 hover:text-[#990000] disabled:opacity-40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{removing ? 'Removing…' : 'Remove'}</span>
                </button>
              </>
            )}
            <span className="text-[#b0a898]">{timeAgo(moment.createdAt)}</span>
          </div>
        </div>
        {removeError && <p className="text-[11.5px] text-[#990000] mt-2">{removeError}</p>}

        {/* Reactions row */}
        <div className="mt-4 flex items-center gap-2 flex-wrap relative">
          {groupedReactions.map(r => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => toggleReaction(r.emoji)}
              disabled={!canPost}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] border transition-colors ${
                r.viewerReacted
                  ? 'bg-[#c8a84b]/15 border-[#c8a84b]/55 text-[#7a6420]'
                  : 'bg-[#fdfcf9] border-[rgba(180,168,150,0.45)] text-[#3d4a5c] hover:border-[#0a1628]/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`React with ${r.emoji} (${r.count})`}
            >
              <span className="text-[14px] leading-none">{r.emoji}</span>
              <span className="font-medium">{r.count}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            disabled={!canPost}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] border border-dashed border-[rgba(180,168,150,0.5)] text-ink-muted hover:border-[#0a1628]/40 hover:text-[#0a1628] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add a reaction"
          >
            <SmilePlus className="w-4 h-4" />
          </button>

          {pickerOpen && (
            <>
              {/* Click-away catcher */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPickerOpen(false)}
                aria-hidden
              />
              <div className="absolute z-50 top-9 left-0 sm:left-auto sm:right-0">
                <EmojiPicker
                  onEmojiClick={onEmojiPick}
                  width={320}
                  height={380}
                  lazyLoadEmojis
                  skinTonesDisabled
                  searchPlaceholder="Search emoji"
                />
              </div>
            </>
          )}
        </div>

        {/* Comments */}
        <div className="mt-5 border-t border-[rgba(180,168,150,0.3)] pt-4">
          {topLevelComments.length > 0 && (
            <div className="space-y-4 mb-4">
              {topLevelComments.map(c => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  replies={repliesFor(c.id)}
                  canPost={canPost}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  replyDraft={replyDraft}
                  setReplyDraft={setReplyDraft}
                  posting={posting}
                  onPostReply={() => postComment(replyDraft.trim(), c.id)}
                />
              ))}
            </div>
          )}

          {canPost ? (
            <div className="flex items-start gap-2">
              <textarea
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Add a comment…"
                rows={1}
                maxLength={1000}
                className="flex-1 border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[13.5px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
              />
              <button
                type="button"
                onClick={() => postComment(commentDraft.trim())}
                disabled={posting || !commentDraft.trim()}
                className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-stretch"
              >
                {posting ? '…' : 'Post'}
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-ink-muted italic">
              Sign in and claim your card to comment or react.
            </p>
          )}

          {error && (
            <p className="text-[12px] text-[#990000] mt-2">{error}</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title="Take this down?"
        message="It will be removed for everyone."
        confirmLabel="Take down"
        destructive
        onConfirm={() => {
          setConfirmRemoveOpen(false)
          handleRemove()
        }}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </article>
  )
}

interface CommentRowProps {
  comment: MomentComment
  replies: MomentComment[]
  canPost: boolean
  replyTo: string | null
  setReplyTo: (id: string | null) => void
  replyDraft: string
  setReplyDraft: (s: string) => void
  posting: boolean
  onPostReply: () => void
}

function CommentRow({
  comment,
  replies,
  canPost,
  replyTo,
  setReplyTo,
  replyDraft,
  setReplyDraft,
  posting,
  onPostReply,
}: CommentRowProps) {
  const replying = replyTo === comment.id
  return (
    <div>
      <div className="text-[13.5px] text-[#0a1628] leading-relaxed">
        <span
          className="font-medium font-heading"
        >
          {comment.fromName}
        </span>
        <span className="text-[#b0a898] text-[11.5px] ml-2">
          {timeAgo(comment.createdAt)}
        </span>
        <p className="whitespace-pre-wrap mt-0.5 text-[#3d4a5c]">{comment.body}</p>
      </div>
      {canPost && (
        <button
          type="button"
          onClick={() => setReplyTo(replying ? null : comment.id)}
          className="inline-flex items-center gap-1 mt-1.5 text-[11.5px] font-medium text-ink-muted hover:text-[#0a1628]"
        >
          <Reply className="w-3 h-3" />
          {replying ? 'Cancel' : 'Reply'}
        </button>
      )}

      {replies.length > 0 && (
        <div className="mt-3 pl-4 border-l border-[rgba(180,168,150,0.4)] space-y-3">
          {replies.map(r => (
            <div key={r.id} className="text-[13px] text-[#0a1628] leading-relaxed">
              <span
                className="font-medium font-heading"
              >
                {r.fromName}
              </span>
              <span className="text-[#b0a898] text-[11px] ml-2">
                {timeAgo(r.createdAt)}
              </span>
              <p className="whitespace-pre-wrap mt-0.5 text-[#3d4a5c]">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mt-2 pl-4 border-l border-[rgba(180,168,150,0.4)] flex items-start gap-2">
          <textarea
            value={replyDraft}
            onChange={e => setReplyDraft(e.target.value)}
            placeholder={`Reply to ${comment.fromName.split(' ')[0]}…`}
            rows={1}
            maxLength={1000}
            autoFocus
            className="flex-1 border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-1.5 text-[13px] text-[#0a1628] resize-none focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b]"
          />
          <button
            type="button"
            onClick={onPostReply}
            disabled={posting || !replyDraft.trim()}
            className="bg-[#0a1628] hover:bg-[#112240] text-white text-[11px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? '…' : 'Reply'}
          </button>
        </div>
      )}
    </div>
  )
}
