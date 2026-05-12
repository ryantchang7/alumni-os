import type { RelationshipMode } from '@/lib/types'
import { getRelationshipModeLabel } from '@/lib/mock-data'

interface RelationshipBadgeProps {
  mode: RelationshipMode
  size?: 'sm' | 'md'
}

const modeColors: Record<RelationshipMode, string> = {
  play_golf: 'bg-green-100 text-green-700',
  career_chat: 'bg-blue-100 text-blue-700',
  mentorship: 'bg-purple-100 text-purple-700',
  junior_golf_family: 'bg-teal-100 text-teal-700',
  city_advice: 'bg-cyan-100 text-cyan-700',
  founder_advice: 'bg-orange-100 text-orange-700',
  finance_advice: 'bg-indigo-100 text-indigo-700',
  grad_school_advice: 'bg-violet-100 text-violet-700',
  team_events: 'bg-pink-100 text-pink-700',
  host_dinner: 'bg-amber-100 text-amber-700',
  program_support: 'bg-slate-100 text-slate-700',
  warm_intro: 'bg-emerald-100 text-emerald-700',
  do_not_contact: 'bg-gray-100 text-gray-500',
}

export default function RelationshipBadge({ mode, size = 'md' }: RelationshipBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center rounded font-medium ${modeColors[mode]} ${sizeClass}`}>
      {getRelationshipModeLabel(mode)}
    </span>
  )
}
