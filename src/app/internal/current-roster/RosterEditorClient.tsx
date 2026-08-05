'use client'

import { useState } from 'react'

interface Person {
  id: string
  canonicalName: string
  normalizedName: string
  firstName?: string
  lastName?: string
}

interface Membership {
  id: string
  classLabel?: string
  classYearEstimate?: string
  hometown?: string
  highSchool?: string
  rosterStartYear?: number
  rosterEndYear?: number
  publishedToNetwork?: boolean
  memberRole?: string
}

interface Enrichment {
  id?: string
  alumniBio?: string
  helpTopics?: string[]
  contactPreference?: string
  availabilityLevel?: string
  openToGolfRounds?: boolean
  openToCoffee?: boolean
  openToMentorship?: boolean
  openToWarmIntroductions?: boolean
  favoritePennGolfMemory?: string
  favoriteCourses?: string
  visibleToPlayers?: boolean
}

interface PlayerEntry {
  person: Person
  membership: Membership
  enrichment: Enrichment | null
}

const CLASS_LABELS = ['Sr.', 'Jr.', 'So.', 'Fr.']
const CLASS_ESTIMATES: Record<string, string> = {
  'Sr.': 'Senior / Rising Senior',
  'Jr.': 'Junior / Rising Junior',
  'So.': 'Sophomore / Rising Sophomore',
  'Fr.': 'Freshman / Rising Freshman',
}
const CONTACT_PREFS = [
  { value: '', label: ', not set. ' },
  { value: 'team_intro', label: 'Team intro' },
  { value: 'email_ok', label: 'Email ok' },
  { value: 'linkedin_ok', label: 'LinkedIn ok' },
  { value: 'not_available', label: 'Not available' },
]
const AVAIL_LEVELS = [
  { value: '', label: ', not set. ' },
  { value: 'one_per_month', label: '1×/month' },
  { value: 'two_per_month', label: '2×/month' },
  { value: 'open', label: 'Open' },
  { value: 'paused', label: 'Paused' },
]

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#2d6a4f]' : 'bg-[rgba(180,168,150,0.6)]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <span className="text-xs text-[#3a4657]">{label}</span>
    </label>
  )
}

function PlayerCard({ entry, teamSlug }: { entry: PlayerEntry; teamSlug: string }) {
  const [person, setPerson] = useState<Person>({ ...entry.person })
  const [membership, setMembership] = useState<Membership>({ ...entry.membership })
  const [enrichment, setEnrichment] = useState<Enrichment>(entry.enrichment ?? {})
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [helpTopicsRaw, setHelpTopicsRaw] = useState((entry.enrichment?.helpTopics ?? []).join(', '))

  async function handleSave() {
    setSaving(true)
    setSavedOk(false)
    setError(null)

    const topics = helpTopicsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const body = {
      teamSlug,
      personId: person.id,
      person: { canonicalName: person.canonicalName },
      membership: {
        classLabel: membership.classLabel,
        classYearEstimate: membership.classYearEstimate,
        hometown: membership.hometown ?? '',
        highSchool: membership.highSchool ?? '',
        rosterStartYear: membership.rosterStartYear,
        rosterEndYear: membership.rosterEndYear,
        publishedToNetwork: membership.publishedToNetwork ?? false,
      },
      enrichment: {
        alumniBio: enrichment.alumniBio ?? '',
        helpTopics: topics,
        contactPreference: enrichment.contactPreference ?? '',
        availabilityLevel: enrichment.availabilityLevel ?? '',
        openToGolfRounds: enrichment.openToGolfRounds ?? false,
        openToCoffee: enrichment.openToCoffee ?? false,
        openToMentorship: enrichment.openToMentorship ?? false,
        openToWarmIntroductions: enrichment.openToWarmIntroductions ?? false,
        favoritePennGolfMemory: enrichment.favoritePennGolfMemory ?? '',
        favoriteCourses: enrichment.favoriteCourses ?? '',
        visibleToPlayers: enrichment.visibleToPlayers ?? true,
      },
    }

    try {
      const res = await fetch('/api/internal/current-roster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Save failed (${res.status})`)
      }
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const classShort = membership.classYearEstimate?.split(' / ')[0] ?? membership.classLabel ?? ''

  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      {/* Card header */}
      <div className="bg-[#0a1628]/5 border-b border-[rgba(180,168,150,0.3)] px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</span>
          {classShort && (
            <span className="text-[10px] font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
              {classShort}
            </span>
          )}
          <span className="text-[10px] font-medium text-ink-muted bg-[#fbf9f6] px-2 py-0.5 rounded-full border border-[rgba(180,168,150,0.4)]">
            Current Player
          </span>
        </div>
        <div className="flex items-center gap-2">
          {savedOk && (
            <span className="text-xs font-medium text-[#2d6a4f]">Saved</span>
          )}
          {error && (
            <span className="text-xs text-[#990000]">{error}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold bg-[#990000] hover:bg-[#b30000] disabled:opacity-50 text-white px-4 py-1.5 rounded-md transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Person */}
        <section>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-3">Identity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Full Name</label>
              <input
                type="text"
                value={person.canonicalName}
                onChange={e => setPerson(p => ({ ...p, canonicalName: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Normalized Name (auto)</label>
              <input
                type="text"
                value={
                  person.canonicalName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                }
                readOnly
                className="w-full border border-[rgba(180,168,150,0.3)] rounded-lg px-3 py-2 text-sm text-ink-muted bg-[#fbf9f6] cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Membership */}
        <section>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-3">Roster Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Class</label>
              <select
                value={membership.classLabel ?? ''}
                onChange={e => {
                  const cl = e.target.value
                  setMembership(m => ({
                    ...m,
                    classLabel: cl,
                    classYearEstimate: CLASS_ESTIMATES[cl] ?? m.classYearEstimate,
                  }))
                }}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-1 focus:ring-[#0a1628]"
              >
                <option value="">, select, </option>
                {CLASS_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Class Display</label>
              <input
                type="text"
                value={membership.classYearEstimate ?? ''}
                onChange={e => setMembership(m => ({ ...m, classYearEstimate: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Hometown</label>
              <input
                type="text"
                value={membership.hometown ?? ''}
                onChange={e => setMembership(m => ({ ...m, hometown: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">High School</label>
              <input
                type="text"
                value={membership.highSchool ?? ''}
                onChange={e => setMembership(m => ({ ...m, highSchool: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Roster Start Year</label>
              <input
                type="number"
                value={membership.rosterStartYear ?? ''}
                onChange={e => setMembership(m => ({ ...m, rosterStartYear: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Roster End Year</label>
              <input
                type="number"
                value={membership.rosterEndYear ?? ''}
                onChange={e => setMembership(m => ({ ...m, rosterEndYear: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
          </div>
          <div className="mt-3">
            <Toggle
              label="Published to Member Book"
              checked={membership.publishedToNetwork ?? false}
              onChange={v => setMembership(m => ({ ...m, publishedToNetwork: v }))}
            />
          </div>
        </section>

        {/* Enrichment / Profile */}
        <section>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-3">Profile Fields</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Bio</label>
              <textarea
                rows={2}
                value={enrichment.alumniBio ?? ''}
                onChange={e => setEnrichment(en => ({ ...en, alumniBio: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Help Topics (comma-separated)</label>
              <input
                type="text"
                value={helpTopicsRaw}
                onChange={e => setHelpTopicsRaw(e.target.value)}
                placeholder="e.g. Internships, Finance recruiting, Golf tips"
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Contact Preference</label>
                <select
                  value={enrichment.contactPreference ?? ''}
                  onChange={e => setEnrichment(en => ({ ...en, contactPreference: e.target.value }))}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none"
                >
                  {CONTACT_PREFS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">Availability</label>
                <select
                  value={enrichment.availabilityLevel ?? ''}
                  onChange={e => setEnrichment(en => ({ ...en, availabilityLevel: e.target.value }))}
                  className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none"
                >
                  {AVAIL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Favorite Penn Golf Memory</label>
              <textarea
                rows={2}
                value={enrichment.favoritePennGolfMemory ?? ''}
                onChange={e => setEnrichment(en => ({ ...en, favoritePennGolfMemory: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Favorite Courses</label>
              <input
                type="text"
                value={enrichment.favoriteCourses ?? ''}
                onChange={e => setEnrichment(en => ({ ...en, favoriteCourses: e.target.value }))}
                className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              <Toggle label="Open to Golf Rounds" checked={enrichment.openToGolfRounds ?? false} onChange={v => setEnrichment(en => ({ ...en, openToGolfRounds: v }))} />
              <Toggle label="Open to Coffee" checked={enrichment.openToCoffee ?? false} onChange={v => setEnrichment(en => ({ ...en, openToCoffee: v }))} />
              <Toggle label="Open to Mentorship" checked={enrichment.openToMentorship ?? false} onChange={v => setEnrichment(en => ({ ...en, openToMentorship: v }))} />
              <Toggle label="Open to Introductions" checked={enrichment.openToWarmIntroductions ?? false} onChange={v => setEnrichment(en => ({ ...en, openToWarmIntroductions: v }))} />
              <Toggle label="Visible to Players" checked={enrichment.visibleToPlayers ?? true} onChange={v => setEnrichment(en => ({ ...en, visibleToPlayers: v }))} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function RosterEditorClient({ players, teamSlug }: { players: PlayerEntry[]; teamSlug: string }) {
  return (
    <div className="space-y-6">
      {players.map(entry => (
        <PlayerCard key={entry.person.id} entry={entry} teamSlug={teamSlug} />
      ))}
    </div>
  )
}
