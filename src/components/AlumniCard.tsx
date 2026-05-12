import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { AlumniProfile } from '@/lib/types'
import ConfidenceBadge from './ConfidenceBadge'
import VerificationBadge from './VerificationBadge'
import RelationshipBadge from './RelationshipBadge'

interface AlumniCardProps {
  alumni: AlumniProfile
  compact?: boolean
}

export default function AlumniCard({ alumni, compact = false }: AlumniCardProps) {
  const topModes = alumni.relationshipModes
    .filter((m) => m !== 'do_not_contact')
    .slice(0, compact ? 2 : 3)
  const firstHook = alumni.connectionHooks[0]

  // ── Penn Golf years display ──────────────────────────────────────────────
  const firstYear = alumni.pennGolfYears[0]
  const lastYear = alumni.pennGolfYears[alumni.pennGolfYears.length - 1]
  const golfYearsLabel =
    alumni.pennGolfYears.length === 1
      ? firstYear
      : `${firstYear.split('–')[0]}–${lastYear.split('–')[1] ?? lastYear}`

  // ── Compact mode ─────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="w-[220px] h-[180px] bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4 flex flex-col flex-shrink-0 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
      >
        {/* Top color bar */}
        <div className="h-[3px] w-full bg-[#0a1628] -mx-4 -mt-4 mb-3 px-4 rounded-t-lg" style={{ marginLeft: '-1rem', marginRight: '-1rem', marginTop: '-1rem', width: 'calc(100% + 2rem)' }} />

        {/* Name + year */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#0a1628] tracking-tight truncate leading-snug">
            {alumni.canonicalName}
          </h3>
          <p className="font-mono text-[11px] text-[#8a7f70] mt-0.5 truncate">
            Class of {alumni.classYear} · {golfYearsLabel}
          </p>

          {/* Role */}
          <p className="text-xs text-[#0a1628] font-medium mt-2 leading-snug line-clamp-1">
            {alumni.currentRole}
          </p>
          <p className="text-xs text-[#8a7f70] leading-snug line-clamp-1">
            {alumni.currentCompany}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {topModes.map((mode) => (
              <RelationshipBadge key={mode} mode={mode} size="sm" />
            ))}
          </div>
        </div>

        {/* View link */}
        <div className="pt-2 border-t border-[rgba(180,168,150,0.25)] mt-auto">
          <Link
            href={`/teams/penn-mens-golf/alumni/${alumni.id}`}
            className="text-xs font-medium text-[#0a1628] hover:text-[#990000] transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    )
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      {/* Top color bar */}
      <div className="h-1 bg-[#0a1628]" />

      <div className="p-5">
        {/* Name row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-semibold text-[#0a1628] tracking-tight leading-snug">
            {alumni.canonicalName}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            <VerificationBadge status={alumni.verificationStatus} />
            <ConfidenceBadge level={alumni.confidence} size="sm" />
          </div>
        </div>

        {/* Class + golf years */}
        <p className="font-mono text-xs text-[#8a7f70] mb-3">
          Class of {alumni.classYear} · Penn Golf {golfYearsLabel}
        </p>

        {/* Role + company */}
        <p className="text-sm text-[#0a1628] font-medium leading-snug">
          {alumni.currentRole}
          {alumni.currentCompany ? ` · ${alumni.currentCompany}` : ''}
        </p>

        {/* City */}
        {alumni.city && (
          <div className="flex items-center gap-1 mt-1 mb-4">
            <MapPin size={12} className="text-[#8a7f70] flex-shrink-0" />
            <span className="text-xs text-[#8a7f70]">
              {alumni.city}, {alumni.state}
            </span>
          </div>
        )}

        {/* Relationship mode badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {topModes.map((mode) => (
            <RelationshipBadge key={mode} mode={mode} size="sm" />
          ))}
        </div>

        {/* Connection hook preview */}
        {firstHook && (
          <div className="border-l-2 border-[#990000] pl-2 mb-4">
            <p className="text-xs text-[#8a7f70] leading-relaxed italic line-clamp-2">
              {firstHook.text.length > 80
                ? firstHook.text.slice(0, 80).trimEnd() + '…'
                : firstHook.text}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-[rgba(180,168,150,0.25)]">
          <Link
            href={`/teams/penn-mens-golf/alumni/${alumni.id}`}
            className="text-xs font-medium text-[#0a1628] hover:text-[#990000] transition-colors"
          >
            View Profile →
          </Link>
          <span className="text-[rgba(180,168,150,0.5)] text-xs">|</span>
          <Link
            href={`/teams/penn-mens-golf/outreach/${alumni.id}`}
            className="text-xs font-medium text-[#990000] hover:underline"
          >
            Draft Message
          </Link>
        </div>
      </div>
    </div>
  )
}
