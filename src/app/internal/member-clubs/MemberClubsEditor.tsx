'use client'

import { useMemo, useState } from 'react'
import CourseAutocomplete from '@/components/CourseAutocomplete'

export interface MemberRow {
  personId: string
  name: string
  role: string
  classLabel: string
  years: string
  homeCourse: string
  noHomeCourse: boolean
}

const ROLE_LABELS: Record<string, string> = {
  current_player: 'Current player',
  alumni: 'Alumni',
  coach: 'Coach',
  parent: 'Family & Affiliate',
}

function RoleChip({ role }: { role: string }) {
  const label = ROLE_LABELS[role] ?? role
  const styles =
    role === 'current_player'
      ? 'bg-emerald-100 text-emerald-800'
      : role === 'coach'
        ? 'bg-[#0a1628] text-white'
        : role === 'parent'
          ? 'bg-[#990000]/10 text-[#990000] border border-[#990000]/30'
          : 'bg-gray-100 text-gray-700'
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${styles}`}>
      {label}
    </span>
  )
}

function MemberRowCard({ row }: { row: MemberRow }) {
  const [homeCourse, setHomeCourse] = useState(row.homeCourse)
  const [noHomeCourse, setNoHomeCourse] = useState(row.noHomeCourse)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = homeCourse !== row.homeCourse || noHomeCourse !== row.noHomeCourse

  async function handleSave() {
    setSaving(true)
    setSavedOk(false)
    setError(null)
    try {
      const res = await fetch('/api/internal/member-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: row.personId,
          homeCourse: noHomeCourse ? '' : homeCourse,
          noHomeCourse,
        }),
      })
      if (res.status === 401 || res.status === 403) {
        throw new Error('Founders only.')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Save failed (${res.status})`)
      }
      const data = await res.json()
      setHomeCourse(data.homeCourse ?? '')
      setNoHomeCourse(data.noHomeCourse === true)
      row.homeCourse = data.homeCourse ?? ''
      row.noHomeCourse = data.noHomeCourse === true
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 sm:px-5 py-3 border-b border-[rgba(180,168,150,0.2)] last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="sm:w-56 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-[#0a1628]">{row.name}</span>
            <RoleChip role={row.role} />
          </div>
          <p className="text-[11px] text-[#8a7f70] mt-0.5">
            {[row.classLabel, row.years].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <CourseAutocomplete
            value={homeCourse}
            onChange={setHomeCourse}
            multiple
            disabled={noHomeCourse}
            placeholder="e.g. Belmont Country Club, The International"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-[#4a5568] flex-shrink-0 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={noHomeCourse}
            onChange={e => {
              const checked = e.target.checked
              setNoHomeCourse(checked)
              if (checked) setHomeCourse('')
            }}
            className="rounded border-[rgba(180,168,150,0.6)]"
          />
          Not a member at a club
        </label>

        <div className="flex items-center gap-2 flex-shrink-0">
          {savedOk && <span className="text-xs font-medium text-[#2d6a4f]">Saved &#10003;</span>}
          {error && <span className="text-xs text-[#990000]">{error}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="text-xs font-semibold bg-[#990000] hover:bg-[#b30000] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MemberClubsEditor({ rows }: { rows: MemberRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => r.name.toLowerCase().includes(q))
  }, [rows, query])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#8a7f70]">
          <span className="font-semibold text-[#0a1628]">{rows.length}</span> members
        </p>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-xs border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-sm text-[#0a1628] bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
        />
      </div>

      <div
        className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-visible"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        {filtered.length === 0 ? (
          <p className="text-sm text-[#8a7f70] text-center py-8">No members match &ldquo;{query}&rdquo;.</p>
        ) : (
          filtered.map(row => <MemberRowCard key={row.personId} row={row} />)
        )}
      </div>
    </div>
  )
}
