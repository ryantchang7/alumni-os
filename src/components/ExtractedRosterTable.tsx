import type { RosterEntry } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ExtractedRosterTableProps {
  entries: RosterEntry[]
}

export default function ExtractedRosterTable({ entries }: ExtractedRosterTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Season</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hometown</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">High School</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-sm text-gray-800">{entry.name}</TableCell>
              <TableCell className="text-xs text-gray-600">{entry.season}</TableCell>
              <TableCell className="text-xs text-gray-500">{entry.classLabel ?? '—'}</TableCell>
              <TableCell className="text-xs text-gray-600">{entry.hometown ?? '—'}</TableCell>
              <TableCell className="text-xs text-gray-500">{entry.highSchool ?? '—'}</TableCell>
              <TableCell>
                
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
