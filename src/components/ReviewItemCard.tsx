import type { ReviewItem, ReviewItemType } from '@/lib/types'

interface ReviewItemCardProps {
  item: ReviewItem
}

const typeColors: Record<ReviewItemType, string> = {
  low_confidence_match: 'bg-orange-100 text-orange-700',
  duplicate_person: 'bg-blue-100 text-blue-700',
  contact_path_concern: 'bg-purple-100 text-purple-700',
  missing_source: 'bg-gray-100 text-gray-600',
  common_name_risk: 'bg-amber-100 text-amber-700',
  possible_wrong_profile: 'bg-red-100 text-red-700',
}

const typeLabels: Record<ReviewItemType, string> = {
  low_confidence_match: 'Low Confidence',
  duplicate_person: 'Duplicate',
  contact_path_concern: 'Contact Concern',
  missing_source: 'Missing Source',
  common_name_risk: 'Common Name',
  possible_wrong_profile: 'Wrong Profile?',
}

const actionLabels: Record<string, string> = {
  approve: 'Approve',
  reject: 'Reject',
  needs_alumni_confirmation: 'Needs Confirmation',
  do_not_contact: 'Mark Do Not Contact',
  needs_more_evidence: 'Needs Evidence',
}

export default function ReviewItemCard({ item }: ReviewItemCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${typeColors[item.type]}`}>
            {typeLabels[item.type]}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h3>
      <p className="text-xs text-gray-500 mb-3">Related: <span className="font-medium text-gray-700">{item.relatedPersonName}</span></p>

      {/* Evidence */}
      {item.evidence.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Evidence</p>
          <ul className="space-y-1">
            {item.evidence.map((e, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-300 flex-shrink-0">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk flags */}
      {item.riskFlags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Risk Flags</p>
          <div className="flex flex-wrap gap-1">
            {item.riskFlags.map((flag, i) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source links */}
      {item.sourceLinks.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Sources</p>
          <div className="space-y-1">
            {item.sourceLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#990000] hover:underline font-mono truncate"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="bg-blue-50 border border-blue-100 rounded p-2.5 mb-4">
          <p className="text-xs text-blue-700 leading-relaxed">{item.notes}</p>
        </div>
      )}

      {/* Suggested action label */}
      <div className="mb-4 text-xs text-gray-500">
        Suggested: <span className="font-medium text-gray-700">{actionLabels[item.suggestedAction]}</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
        <button className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors">
          Approve
        </button>
        <button className="text-xs px-3 py-1.5 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors">
          Reject
        </button>
        <button className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-colors">
          Edit
        </button>
        <button className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded font-medium hover:bg-amber-200 transition-colors">
          Needs Confirmation
        </button>
        <button className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded font-medium hover:bg-gray-300 transition-colors">
          Do Not Contact
        </button>
      </div>
    </div>
  )
}
