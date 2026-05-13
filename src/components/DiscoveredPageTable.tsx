import type { DiscoveredPage } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DiscoveredPageTableProps {
  pages: DiscoveredPage[]
}

const pageTypeColors: Record<string, string> = {
  roster: 'bg-[#0a1628] text-white',
  history: 'bg-blue-100 text-blue-800',
  news: 'bg-gray-100 text-gray-700',
  results: 'bg-green-100 text-green-700',
  schedule: 'bg-sky-100 text-sky-700',
  bio: 'bg-purple-100 text-purple-700',
  alumni: 'bg-teal-100 text-teal-700',
  archive: 'bg-orange-100 text-orange-700',
  unknown: 'bg-gray-100 text-gray-500',
}

const priorityColors: Record<string, string> = {
  high: 'bg-[#990000] text-white',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

function truncateUrl(url: string, max = 55): string {
  if (url.length <= max) return url
  return url.slice(0, max) + '…'
}

export default function DiscoveredPageTable({ pages }: DiscoveredPageTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">URL</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Season</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confidence</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs text-gray-700 font-mono">{truncateUrl(page.url)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded font-medium capitalize ${pageTypeColors[page.pageType]}`}>
                  {page.pageType}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-gray-500">{page.season ?? '—'}</span>
              </TableCell>
              <TableCell>
                
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded font-medium capitalize ${priorityColors[page.priority]}`}>
                  {page.priority}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
