import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default async function PlayerAlumniProfilePage({ params }: PageProps) {
  const { id } = await params

  const {
    getTeamBySlug,
    getPeopleForTeam,
    getTeamMembershipsForTeam,
    getExtractedEntriesForTeam,
    getPersonEnrichment,
    getEnrichmentSourcesForPerson,
  } = await import('@/lib/store/local-store')

  const team = await getTeamBySlug('penn-mens-golf')
  if (!team) notFound()

  const people = await getPeopleForTeam(team.id)
  const person = people.find(p => p.id === id)
  if (!person) notFound()

  const memberships = await getTeamMembershipsForTeam(team.id)
  const membership = memberships.find(m => m.personId === person.id)
  if (!membership) notFound()

  const allEntries = await getExtractedEntriesForTeam(team.id)
  const normalizedPersonName = normalizeName(person.canonicalName)
  const personEntries = allEntries.filter(
    e => e.status === 'promoted' && normalizeName(e.fullName) === normalizedPersonName
  )

  const [enrichment, enrichmentSources] = await Promise.all([
    getPersonEnrichment(person.id, team.id),
    getEnrichmentSourcesForPerson(person.id, team.id),
  ])

  const confidencePct = Math.round(membership.confidence * 100)
  const isHighConfidence = membership.confidence >= 0.8

  const rosterLabel =
    membership.rosterStartYear && membership.rosterEndYear
      ? `${membership.rosterStartYear}–${String(membership.rosterEndYear).slice(-2)}`
      : membership.rosterStartYear
        ? String(membership.rosterStartYear)
        : null

  const missingFields: string[] = []
  if (!membership.classLabel) missingFields.push('Class label')
  if (!membership.hometown) missingFields.push('Hometown')
  if (!membership.highSchool) missingFields.push('High school')
  if (!membership.rosterStartYear) missingFields.push('Roster start year')

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Navy header */}
      <div className="bg-[#0a1628] px-8 pt-10 pb-10">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Link href="/player" className="text-gray-400 hover:text-gray-200 transition-colors">
              &larr; Player
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/player/search" className="text-gray-400 hover:text-gray-200 transition-colors">
              Search
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{person.canonicalName}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-semibold tracking-tight">{person.canonicalName}</h1>
              <p className="text-gray-400 text-sm mt-1">Penn Men&apos;s Golf</p>
            </div>
            <Link
              href={`/player/outreach/${person.id}`}
              className="flex-shrink-0 text-xs bg-[#990000] hover:bg-[#b30000] text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Draft Outreach &rarr;
            </Link>
          </div>
        </div>
      </div>

      <div data-testid="player-profile" className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Core info card */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-6"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <h2 className="text-lg font-semibold text-[#0a1628]">{person.canonicalName}</h2>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    isHighConfidence
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {confidencePct}% confidence
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Penn Golf</dt>
                  <dd className="font-medium text-[#0a1628]">{rosterLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Class</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.classLabel ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Hometown</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.hometown ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">High School</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.highSchool ?? '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Career & Contact enrichment card */}
            {enrichment ? (
              <div
                data-testid="career-contact-card"
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-6"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-[#0a1628] uppercase tracking-wide">
                    Career &amp; Contact
                  </h2>
                  {enrichment.verificationStatus === 'manually_verified' && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Manually verified
                    </span>
                  )}
                  {enrichment.verificationStatus === 'source_backed' && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                      Source backed
                    </span>
                  )}
                  {(enrichment.verificationStatus === 'unverified' ||
                    enrichment.verificationStatus === 'needs_review') && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>

                {(enrichment.verificationStatus === 'unverified' ||
                  enrichment.verificationStatus === 'needs_review') && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <p className="text-xs text-amber-800">
                      These details are unverified — not confirmed
                    </p>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {enrichment.currentRole && (
                    <div>
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Current Role</dt>
                      <dd className="font-medium text-[#0a1628]">{enrichment.currentRole}</dd>
                    </div>
                  )}
                  {enrichment.currentCompany && (
                    <div>
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Company</dt>
                      <dd className="font-medium text-[#0a1628]">{enrichment.currentCompany}</dd>
                    </div>
                  )}
                  {enrichment.industry && (
                    <div>
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Industry</dt>
                      <dd className="font-medium text-[#0a1628]">{enrichment.industry}</dd>
                    </div>
                  )}
                  {(enrichment.city || enrichment.state || enrichment.country) && (
                    <div>
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Location</dt>
                      <dd className="font-medium text-[#0a1628]">
                        {[enrichment.city, enrichment.state, enrichment.country]
                          .filter(Boolean)
                          .join(', ')}
                      </dd>
                    </div>
                  )}
                  {enrichment.relationshipStatus && (
                    <div>
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Relationship</dt>
                      <dd className="font-medium text-[#0a1628] capitalize">
                        {enrichment.relationshipStatus.replace(/_/g, ' ')}
                      </dd>
                    </div>
                  )}
                  {enrichment.notes && (
                    <div className="col-span-2">
                      <dt className="text-xs text-[#8a7f70] uppercase tracking-wide mb-0.5">Notes</dt>
                      <dd className="text-[#0a1628] text-sm leading-relaxed">{enrichment.notes}</dd>
                    </div>
                  )}
                </dl>

                {enrichmentSources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(180,168,150,0.2)]">
                    <p className="text-xs text-[#8a7f70] mb-2">Sources ({enrichmentSources.length})</p>
                    <ul className="space-y-1">
                      {enrichmentSources.map(src => (
                        <li key={src.id}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#990000] hover:underline break-all"
                          >
                            {src.title ?? src.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[rgba(180,168,150,0.2)]">
                  <Link
                    href={`/builder/enrich/${person.id}?teamSlug=penn-mens-golf`}
                    className="text-xs font-medium text-[#990000] hover:underline"
                  >
                    Add enrichment in Builder &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <p className="text-xs text-[#8a7f70] mb-2">
                  Roster-only profile — no career or contact enrichment yet.
                </p>
                <Link
                  href={`/builder/enrich/${person.id}?teamSlug=penn-mens-golf`}
                  className="text-xs font-medium text-[#990000] hover:underline"
                >
                  Add enrichment in Builder &rarr;
                </Link>
              </div>
            )}

            {/* Missing fields warning */}
            {missingFields.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                  Missing Fields
                </h3>
                <ul className="space-y-1">
                  {missingFields.map(f => (
                    <li key={f} className="text-xs text-amber-800">
                      — {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/builder/promote?teamSlug=penn-mens-golf`}
                  className="text-xs font-medium text-amber-700 hover:underline mt-2 block"
                >
                  Enrich in Builder &rarr;
                </Link>
              </div>
            )}

            {/* Roster evidence */}
            {personEntries.length > 0 && (
              <div
                data-testid="roster-evidence-table"
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <h3 className="text-sm font-semibold text-[#8a7f70] uppercase tracking-wide mb-4">
                  Roster Evidence ({personEntries.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(180,168,150,0.2)]">
                        <th className="text-left text-[#8a7f70] font-medium pb-2 pr-4">Season</th>
                        <th className="text-left text-[#8a7f70] font-medium pb-2 pr-4">Class</th>
                        <th className="text-left text-[#8a7f70] font-medium pb-2 pr-4">Hometown</th>
                        <th className="text-left text-[#8a7f70] font-medium pb-2 pr-4">High School</th>
                        <th className="text-left text-[#8a7f70] font-medium pb-2 pr-4">Confidence</th>
                        <th className="text-left text-[#8a7f70] font-medium pb-2">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personEntries.map(entry => (
                        <tr key={entry.id} className="border-b border-[rgba(180,168,150,0.1)] last:border-0">
                          <td className="py-2 pr-4 text-[#0a1628]">{entry.seasonYear ?? '—'}</td>
                          <td className="py-2 pr-4 text-[#0a1628]">{entry.classLabel ?? '—'}</td>
                          <td className="py-2 pr-4 text-[#0a1628]">{entry.hometown ?? '—'}</td>
                          <td className="py-2 pr-4 text-[#0a1628]">{entry.highSchool ?? '—'}</td>
                          <td className="py-2 pr-4 text-[#0a1628]">
                            {Math.round(entry.extractionConfidence * 100)}%
                          </td>
                          <td className="py-2">
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#990000] hover:underline truncate block max-w-[160px]"
                            >
                              {(() => {
                                try {
                                  return new URL(entry.sourceUrl).hostname
                                } catch {
                                  return entry.sourceUrl.slice(0, 30)
                                }
                              })()}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Source URLs */}
            {membership.sourceUrls.length > 0 && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <h3 className="text-sm font-semibold text-[#8a7f70] uppercase tracking-wide mb-3">
                  Source URLs ({membership.sourceUrls.length})
                </h3>
                <ul className="space-y-2">
                  {membership.sourceUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#990000] hover:underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bio URLs */}
            {membership.bioUrls.length > 0 && (
              <div
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-5"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
              >
                <h3 className="text-sm font-semibold text-[#8a7f70] uppercase tracking-wide mb-3">
                  Bio URLs ({membership.bioUrls.length})
                </h3>
                <ul className="space-y-2">
                  {membership.bioUrls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#990000] hover:underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/player/outreach/${person.id}`}
                className="inline-flex items-center text-sm font-medium text-[#990000] hover:underline"
              >
                Draft outreach &rarr;
              </Link>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <Link
              href={`/player/outreach/${person.id}`}
              className="block w-full text-center bg-[#990000] hover:bg-[#b30000] text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              Draft Outreach &rarr;
            </Link>

            {/* Quick links */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Back to Player', href: '/player' },
                  { label: 'Search Alumni', href: '/player/search' },
                  { label: 'My Relationships', href: '/player/relationships' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-xs text-[#0a1628] hover:text-[#990000] font-medium transition-colors py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Profile summary */}
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-lg p-4"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}
            >
              <h3 className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wide mb-3">
                Profile Summary
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#8a7f70]">Confidence</dt>
                  <dd
                    className={`font-medium ${
                      isHighConfidence ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {confidencePct}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8a7f70]">Evidence entries</dt>
                  <dd className="font-medium text-[#0a1628]">{personEntries.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8a7f70]">Source URLs</dt>
                  <dd className="font-medium text-[#0a1628]">{membership.sourceUrls.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8a7f70]">Missing fields</dt>
                  <dd
                    className={`font-medium ${
                      missingFields.length > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {missingFields.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
