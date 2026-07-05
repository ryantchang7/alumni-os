import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ExtractedRosterEntry } from '@/lib/store/types'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ teamSlug?: string }>
}

export default async function PersonDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { teamSlug } = await searchParams

  const { readStore, getTeamBySlug, getTeamMembershipsForTeam, getExtractedEntriesForTeam } =
    await import('@/lib/store/local-store')

  const store = await readStore()
  const person = store.people.find(p => p.id === id)
  if (!person) notFound()

  let membership = null
  let relatedEntries: ExtractedRosterEntry[] = []
  let team = null

  if (teamSlug) {
    team = await getTeamBySlug(teamSlug)
    if (team) {
      const memberships = await getTeamMembershipsForTeam(team.id)
      membership = memberships.find(m => m.personId === person.id) ?? null

      const allEntries = await getExtractedEntriesForTeam(team.id)
      relatedEntries = allEntries.filter(e => {
        const norm = e.fullName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
        return norm === person.normalizedName
      })
    }
  }

  const rosterYears =
    membership?.rosterStartYear && membership?.rosterEndYear
      ? `${membership.rosterStartYear}–${membership.rosterEndYear}`
      : membership?.rosterStartYear
        ? String(membership.rosterStartYear)
        : null

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] py-10 px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href={teamSlug ? `/builder/people?teamSlug=${teamSlug}` : '/builder/people'}
            className="text-xs text-gray-400 hover:text-white transition-colors mb-4 block"
          >
            ← People
          </Link>
          <h1 className="text-white text-2xl font-semibold tracking-tight">{person.canonicalName}</h1>
          <p className="text-gray-400 text-xs mt-1 font-mono">{person.normalizedName}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        {/* Person fields */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
        >
          <h2 className="font-semibold text-[#0a1628] mb-4">Identity</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">First Name</dt>
              <dd className="text-[#0a1628]">{person.firstName ?? <span className="text-gray-300">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Last Name</dt>
              <dd className="text-[#0a1628]">{person.lastName ?? <span className="text-gray-300">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Person ID</dt>
              <dd className="font-mono text-xs text-gray-400 truncate">{person.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Created</dt>
              <dd className="text-gray-400 text-xs">{new Date(person.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Membership */}
        {membership && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <h2 className="font-semibold text-[#0a1628] mb-4">Team Membership</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Roster Years</dt>
                <dd className="text-[#0a1628]">{rosterYears ?? <span className="text-gray-300">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Class</dt>
                <dd className="text-[#0a1628]">{membership.classLabel ?? <span className="text-gray-300">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Hometown</dt>
                <dd className={membership.hometown ? 'text-[#0a1628]' : 'text-amber-500'}>
                  {membership.hometown ?? 'Missing'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">High School</dt>
                <dd className={membership.highSchool ? 'text-[#0a1628]' : 'text-amber-500'}>
                  {membership.highSchool ?? 'Missing'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Confidence</dt>
                <dd>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      membership.confidence >= 0.8
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {Math.round(membership.confidence * 100)}%
                  </span>
                </dd>
              </div>
            </dl>

            {/* Source URLs */}
            <div className="mt-5">
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Source URLs ({membership.sourceUrls.length})
              </dt>
              {membership.sourceUrls.length > 0 ? (
                <ul className="space-y-1">
                  {membership.sourceUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#990000] hover:underline font-mono break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-500">No source URLs</p>
              )}
            </div>

            {/* Bio URLs */}
            <div className="mt-4">
              <dt className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Bio URLs ({membership.bioUrls.length})
              </dt>
              {membership.bioUrls.length > 0 ? (
                <ul className="space-y-1">
                  {membership.bioUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#990000] hover:underline font-mono break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-500">No bio URLs</p>
              )}
            </div>
          </div>
        )}

        {/* Extracted entries */}
        {relatedEntries.length > 0 && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
          >
            <div className="px-6 py-4 border-b border-[rgba(180,168,150,0.3)]">
              <h2 className="font-semibold text-[#0a1628]">
                Source Evidence ({relatedEntries.length} extracted entr{relatedEntries.length === 1 ? 'y' : 'ies'})
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0ece5]">
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Season</th>
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Conf.</th>
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Class</th>
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-muted">Source URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(180,168,150,0.2)]">
                {relatedEntries.map((entry, i) => (
                  <tr key={entry.id} className={i % 2 === 1 ? 'bg-[#faf9f7]' : ''}>
                    <td className="px-5 py-3 font-mono text-[#0a1628]">{entry.seasonYear ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          entry.status === 'promoted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : entry.status === 'rejected'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          entry.extractionConfidence >= 0.8
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {Math.round(entry.extractionConfidence * 100)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{entry.classLabel ?? '—'}</td>
                    <td className="px-5 py-3">
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#990000] hover:underline font-mono truncate max-w-[200px] block"
                        title={entry.sourceUrl}
                      >
                        {entry.sourceUrl}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-[rgba(180,168,150,0.35)] pt-6 pb-4">
          {teamSlug && (
            <>
              <Link
                href={`/builder/quality?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
              >
                ← Graph Quality
              </Link>
              <Link
                href={`/builder/people?teamSlug=${teamSlug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-md transition-colors"
              >
                ← All People
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
