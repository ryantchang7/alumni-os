import type { ConnectionHook, RelationshipMode } from '@/lib/types'

interface ConnectionHookListProps {
  hooks: ConnectionHook[]
  max?: number
}

const categoryIcons: Record<RelationshipMode, string> = {
  play_golf: '⛳',
  career_chat: '💼',
  mentorship: '🌱',
  junior_golf_family: '👨‍👧',
  city_advice: '🏙',
  founder_advice: '🚀',
  finance_advice: '📈',
  grad_school_advice: '🎓',
  team_events: '🏆',
  host_dinner: '🍽',
  program_support: '❤️',
  warm_intro: '🤝',
  do_not_contact: '🔒',
}

export default function ConnectionHookList({ hooks, max }: ConnectionHookListProps) {
  const displayed = max ? hooks.slice(0, max) : hooks
  const remaining = max && hooks.length > max ? hooks.length - max : 0

  return (
    <div className="space-y-2.5">
      {displayed.map((hook) => (
        <div key={hook.id} className="flex items-start gap-3">
          <span className="text-base flex-shrink-0 mt-0.5">{categoryIcons[hook.category]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed">{hook.text}</p>
            {hook.sourceSupported && hook.sourceSummary && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
                {hook.sourceSummary}
              </p>
            )}
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <p className="text-xs text-gray-400 pl-7">+{remaining} more connection{remaining !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
