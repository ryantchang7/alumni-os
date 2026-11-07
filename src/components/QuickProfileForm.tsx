'use client'

/**
 * The whole profile, in four boxes, wherever the member already is.
 *
 * Six of thirty-six members have filled in a single field. The reason is not
 * that they refused: the editor behind "Finish your card" is a thousand-line
 * form on another page, and the thing we actually want from them is three
 * short answers. So those three answers live here, inline, and the long form
 * stays available for anyone who wants the rest of it.
 *
 * The paste box is the nearest honest thing to the LinkedIn sync everyone
 * asks for. LinkedIn does not hand out current title and company to apps
 * outside its Partner Program, so nothing can read their profile for them.
 * They can paste their own headline or email signature, and we guess the
 * fields from it. Every guess lands in a box they can see and edit before
 * anything saves.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardPaste, Check, Loader2 } from 'lucide-react'
import { parsePastedProfile } from '@/lib/profile/parse-paste'

interface Props {
  personId: string
  teamSlug: string
  /** Prefill, so a member who filled one field earlier is not asked twice. */
  initial?: { currentRole?: string; currentCompany?: string; city?: string; state?: string; alumniBio?: string }
  onDone?: () => void
}

const LABEL = 'block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-1.5'
const INPUT =
  'w-full bg-white border border-[rgba(180,168,150,0.55)] text-[#0a1628] placeholder-[#b0a898] rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/40 focus:border-[#c8a84b] transition-colors'

export default function QuickProfileForm({ personId, teamSlug, initial, onDone }: Props) {
  const [role, setRole] = useState(initial?.currentRole ?? '')
  const [company, setCompany] = useState(initial?.currentCompany ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [bio, setBio] = useState(initial?.alumniBio ?? '')

  const [paste, setPaste] = useState('')
  const [pasteNote, setPasteNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyPaste(text: string) {
    const parsed = parsePastedProfile(text)
    const filled: string[] = []
    if (parsed.currentRole) { setRole(parsed.currentRole); filled.push('title') }
    if (parsed.currentCompany) { setCompany(parsed.currentCompany); filled.push('company') }
    if (parsed.city) { setCity(parsed.city); filled.push('city') }
    if (parsed.state) setState(parsed.state)
    setPasteNote(
      filled.length === 0
        ? 'Could not read that one. Typing it is quicker.'
        : `Filled in your ${filled.join(', ')}. Check it before you save.`,
    )
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/alumni/self-profile?teamSlug=${encodeURIComponent(teamSlug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId,
            currentRole: role,
            currentCompany: company,
            city,
            state,
            alumniBio: bio,
          }),
        },
      )
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error ?? `Save failed (${res.status})`)
      }
      setSaved(true)
      onDone?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 text-[14px] text-[#2d6a4f] font-medium py-1">
        <Check className="w-4 h-4" />
        Saved. That is your card done.
      </div>
    )
  }

  const nothingEntered = !role.trim() && !company.trim() && !city.trim() && !bio.trim()

  return (
    <div className="space-y-4">
      {/* Paste shortcut */}
      <div>
        <label className={LABEL} htmlFor="qp-paste">
          Paste from anywhere
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="qp-paste"
            type="text"
            value={paste}
            onChange={e => setPaste(e.target.value)}
            onPaste={e => {
              const text = e.clipboardData.getData('text')
              if (text) {
                setPaste(text.replace(/\s+/g, ' ').trim())
                applyPaste(text)
                e.preventDefault()
              }
            }}
            placeholder="Your LinkedIn headline, or the signature from your email"
            className={INPUT}
          />
          <button
            type="button"
            onClick={() => applyPaste(paste)}
            disabled={!paste.trim()}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 border border-[#0a1628]/25 text-[#0a1628] hover:bg-[#0a1628] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#0a1628] text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Read it
          </button>
        </div>
        {pasteNote && (
          <p className="text-[11.5px] text-ink-muted mt-1.5" role="status">
            {pasteNote}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="qp-role">What you do now</label>
          <input id="qp-role" type="text" value={role} onChange={e => setRole(e.target.value)}
            placeholder="Managing Director" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="qp-company">Where</label>
          <input id="qp-company" type="text" value={company} onChange={e => setCompany(e.target.value)}
            placeholder="Morgan Stanley" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="qp-city">City</label>
          <input id="qp-city" type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Philadelphia" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="qp-state">State</label>
          <input id="qp-state" type="text" value={state} onChange={e => setState(e.target.value)}
            placeholder="PA" className={INPUT} />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="qp-bio">One line about yourself</label>
        <textarea id="qp-bio" value={bio} onChange={e => setBio(e.target.value)} rows={2}
          placeholder="Happy to talk to anyone looking at real estate, or just play a round."
          className={`${INPUT} resize-y`} />
      </div>

      {error && <p className="text-[12.5px] text-[#990000]">{error}</p>}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving || nothingEntered}
          className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] disabled:opacity-40 text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-6 py-2.5 rounded-lg transition-colors"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving' : 'Save'}
        </button>
        <Link
          href={`/alumni/profile/${encodeURIComponent(personId)}?teamSlug=${encodeURIComponent(teamSlug)}`}
          className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-[#0a1628] transition-colors"
        >
          Everything else &rarr;
        </Link>
      </div>
    </div>
  )
}
