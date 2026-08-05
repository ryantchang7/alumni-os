import type { TeamMembership, Person, PersonEnrichment } from '../store/types'

export type PublishRole = 'captain' | 'staff' | 'admin'

export interface PublishedProfile {
  personId: string
  canonicalName: string
  firstName?: string
  lastName?: string
  classLabel?: string
  rosterStartYear?: number
  rosterEndYear?: number
  rosterYearsLabel: string
  hometown?: string
  highSchool?: string
  publishedAt: string
  publishedByRole: PublishRole
  career?: {
    currentRole?: string
    currentCompany?: string
    city?: string
  }
}

export function buildPublishedProfile(
  person: Person,
  membership: TeamMembership,
  enrichment?: PersonEnrichment,
): PublishedProfile {
  const start = membership.rosterStartYear
  const end = membership.rosterEndYear
  const rosterYearsLabel =
    start && end
      ? `${start}–${String(end).slice(-2)}`
      : start
        ? String(start)
        : ', '

  const isVerified =
    enrichment &&
    (enrichment.verificationStatus === 'source_backed' ||
      enrichment.verificationStatus === 'manually_verified')

  return {
    personId: person.id,
    canonicalName: person.canonicalName,
    firstName: person.firstName,
    lastName: person.lastName,
    classLabel: membership.classLabel,
    rosterStartYear: membership.rosterStartYear,
    rosterEndYear: membership.rosterEndYear,
    rosterYearsLabel,
    hometown: membership.hometown,
    highSchool: membership.highSchool,
    publishedAt: membership.publishedAt!,
    publishedByRole: membership.publishedByRole!,
    career:
      isVerified && (enrichment.currentRole || enrichment.currentCompany || enrichment.city)
        ? {
            currentRole: enrichment.currentRole,
            currentCompany: enrichment.currentCompany,
            city: enrichment.city,
          }
        : undefined,
  }
}
