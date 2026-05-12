import type { SourceEvidence } from '@/lib/types'

interface SourceEvidenceCardProps {
  evidence: SourceEvidence
}

const sourceTypeIcons: Record<string, string> = {
  team_roster: '📋',
  news_article: '📰',
  company_bio: '🏢',
  linkedin_public: '💼',
  alumni_page: '🎓',
  tournament_results: '🏆',
}

const sourceTypeLabels: Record<string, string> = {
  team_roster: 'Team Roster',
  news_article: 'News Article',
  company_bio: 'Company Bio',
  linkedin_public: 'LinkedIn (Public)',
  alumni_page: 'Alumni Page',
  tournament_results: 'Tournament Results',
}

function truncateSnippet(text: string, max = 120): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

export default function SourceEvidenceCard({ evidence }: SourceEvidenceCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{sourceTypeIcons[evidence.sourceType] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
              {sourceTypeLabels[evidence.sourceType] ?? evidence.sourceType}
            </span>
            {evidence.retrievedAt && (
              <span className="text-xs text-gray-400">Retrieved {evidence.retrievedAt}</span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">{evidence.title}</h4>
          {evidence.snippet && (
            <p className="text-xs text-gray-500 italic leading-relaxed mb-2">
              &ldquo;{truncateSnippet(evidence.snippet)}&rdquo;
            </p>
          )}
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#990000] hover:underline font-mono break-all"
          >
            {evidence.url}
          </a>
        </div>
      </div>
    </div>
  )
}
