import type { SuggestedAsk } from '@/lib/types'
import RelationshipBadge from './RelationshipBadge'

interface SuggestedAskCardProps {
  ask: SuggestedAsk
}

export default function SuggestedAskCard({ ask }: SuggestedAskCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <RelationshipBadge mode={ask.mode} size="sm" />
          </div>
          <p className="text-sm text-gray-800 font-medium leading-relaxed mb-1">{ask.ask}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{ask.context}</p>
        </div>
      </div>
    </div>
  )
}
