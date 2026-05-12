import type { ConfidenceLevel } from '@/lib/types'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
  size?: 'sm' | 'md'
}

const configs: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Low' },
  unverified: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Unverified' },
}

export default function ConfidenceBadge({ level, size = 'md' }: ConfidenceBadgeProps) {
  const config = configs[level]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center rounded font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${sizeClass}`}>
      {config.label}
    </span>
  )
}
