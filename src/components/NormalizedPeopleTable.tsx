import type { NormalizedPerson } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfidenceBadge from './ConfidenceBadge'

interface NormalizedPeopleTableProps {
  people: NormalizedPerson[]
}

export default function NormalizedPeopleTable({ people }: NormalizedPeopleTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Canonical Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Roster Years</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Class Est.</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sources</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-sm text-gray-800">{person.canonicalName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {person.rosterYears.map((year) => (
                    <span
                      key={year}
                      className="inline-flex text-[10px] px-1.5 py-0.5 bg-[#0a1628] text-white rounded font-medium"
                    >
                      {year}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs text-gray-600">{person.classEstimate ?? '—'}</TableCell>
              <TableCell className="text-xs text-gray-500">{person.sourceCount} source{person.sourceCount !== 1 ? 's' : ''}</TableCell>
              <TableCell>
                <ConfidenceBadge level={person.confidence} size="sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
