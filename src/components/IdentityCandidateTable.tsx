import type { IdentityCandidate } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfidenceBadge from './ConfidenceBadge'

interface IdentityCandidateTableProps {
  candidates: IdentityCandidate[]
}

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  needs_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  needs_review: 'Needs Review',
  rejected: 'Rejected',
  pending: 'Pending',
}

const sourceTypeLabels: Record<string, string> = {
  linkedin_public: 'LinkedIn',
  company_bio: 'Company Bio',
  news_mention: 'News',
  alumni_directory: 'Alumni Dir.',
  team_website: 'Team Site',
}

function truncateUrl(url: string, max = 40): string {
  if (url.length <= max) return url
  return url.slice(0, max) + '…'
}

export default function IdentityCandidateTable({ candidates }: IdentityCandidateTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Person</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Candidate URL</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Source</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Evidence</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confidence</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-sm text-gray-800">{candidate.personName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs text-gray-600 font-mono">{truncateUrl(candidate.candidateUrl)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-gray-500">{sourceTypeLabels[candidate.sourceType] ?? candidate.sourceType}</span>
              </TableCell>
              <TableCell className="text-xs text-gray-500">{candidate.evidence.length} point{candidate.evidence.length !== 1 ? 's' : ''}</TableCell>
              <TableCell>
                <ConfidenceBadge level={candidate.confidence} size="sm" />
              </TableCell>
              <TableCell>
                <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${statusColors[candidate.status]}`}>
                  {statusLabels[candidate.status]}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
