'use client'

import { useMemo, useState } from 'react'

export type ManualBadge = 'founding-member' | 'member' | 'parent'

export interface RolesAccountRow {
  id: string
  email: string
  name: string | null
  linkedName: string | null
  manualCaptain: boolean
  manualBadges: ManualBadge[]
  stripeTier: 'member' | 'founding' | 'parent' | null
}

interface Props {
  initialAccounts: RolesAccountRow[]
}

const BADGE_LABELS: Record<ManualBadge | 'captain', string> = {
  captain: 'PGC Captain',
  'founding-member': 'Founding Member',
  member: 'Supporting Member',
  parent: 'Family & Affiliate',
}

export default function RolesClient({ initialAccounts }: Props) {
  const [rows, setRows] = useState<RolesAccountRow[]>(initialAccounts)
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => {
      const hay = [r.email, r.name ?? '', r.linkedName ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rows, filter])

  async function patchRow(
    row: RolesAccountRow,
    next: { manualCaptain?: boolean; manualBadges?: ManualBadge[] },
  ) {
    setBusyId(row.id)
    setError(null)
    try {
      const res = await fetch('/api/internal/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: row.id, ...next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? `Request failed (${res.status})`)
      }
      setRows(prev =>
        prev.map(r =>
          r.id === row.id
            ? {
                ...r,
                manualCaptain: next.manualCaptain ?? r.manualCaptain,
                manualBadges: next.manualBadges ?? r.manualBadges,
              }
            : r,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  function toggleBadge(row: RolesAccountRow, badge: ManualBadge) {
    const has = row.manualBadges.includes(badge)
    const nextBadges = has
      ? row.manualBadges.filter(b => b !== badge)
      : [...row.manualBadges, badge]
    void patchRow(row, { manualBadges: nextBadges })
  }

  function toggleCaptain(row: RolesAccountRow) {
    void patchRow(row, { manualCaptain: !row.manualCaptain })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by name or email"
          className="flex-1 max-w-md text-[13px] px-3 py-2 border border-[rgba(180,168,150,0.55)] rounded-lg bg-white text-[#0a1628] placeholder:text-[#8a7f70]/70 focus:outline-none focus:border-[#0a1628]"
        />
        <p className="text-[11px] text-[#8a7f70]">
          {filtered.length} of {rows.length}
        </p>
      </div>

      {error && (
        <div className="text-[12px] text-[#990000] bg-[#990000]/10 border border-[#990000]/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70] border-b border-[rgba(180,168,150,0.4)]">
              <th className="text-left py-2 px-2">Account</th>
              <th className="text-left py-2 px-2">Stripe</th>
              <th className="text-center py-2 px-2">{BADGE_LABELS.captain}</th>
              <th className="text-center py-2 px-2">{BADGE_LABELS['founding-member']}</th>
              <th className="text-center py-2 px-2">{BADGE_LABELS.member}</th>
              <th className="text-center py-2 px-2">{BADGE_LABELS.parent}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const display = row.linkedName ?? row.name ?? row.email
              const isBusy = busyId === row.id
              return (
                <tr
                  key={row.id}
                  className="border-b border-[rgba(180,168,150,0.2)] hover:bg-[#faf7f2]/60"
                >
                  <td className="py-2.5 px-2">
                    <p className="font-medium text-[#0a1628]">{display}</p>
                    <p className="text-[11px] text-[#8a7f70]">{row.email}</p>
                  </td>
                  <td className="py-2.5 px-2 text-[11px] text-[#8a7f70]">
                    {row.stripeTier === 'founding'
                      ? 'Founding'
                      : row.stripeTier === 'parent'
                        ? 'Family & Affiliate'
                        : row.stripeTier === 'member'
                          ? 'Supporting'
                          : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <RoleCheckbox
                      checked={row.manualCaptain}
                      disabled={isBusy}
                      onChange={() => toggleCaptain(row)}
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <RoleCheckbox
                      checked={row.manualBadges.includes('founding-member')}
                      disabled={isBusy}
                      onChange={() => toggleBadge(row, 'founding-member')}
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <RoleCheckbox
                      checked={row.manualBadges.includes('member')}
                      disabled={isBusy}
                      onChange={() => toggleBadge(row, 'member')}
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <RoleCheckbox
                      checked={row.manualBadges.includes('parent')}
                      disabled={isBusy}
                      onChange={() => toggleBadge(row, 'parent')}
                    />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[12px] text-[#8a7f70]">
                  No accounts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[#8a7f70] leading-relaxed">
        Manual grants stack on top of any Stripe-driven badges and are
        used purely for presentation + access control. They do not create
        a Stripe subscription.
      </p>
    </div>
  )
}

function RoleCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <label className="inline-flex items-center justify-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 accent-[#0a1628] cursor-pointer disabled:cursor-not-allowed"
      />
    </label>
  )
}
