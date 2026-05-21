// Signed-in dashboard. Shows the linked Member Book card + edit shortcuts.

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getMemberById } from '@/lib/member-book/data'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { isPublicMember, getMemberPennGolfYears } from '@/lib/member-book/helpers'
import { readStore, getTeamBySlug } from '@/lib/store/local-store'

const TEAM_SLUG = 'penn-mens-golf'

export default async function AccountProfilePage() {
  const session = await auth()
  if (!session) {
    redirect('/login?next=/account/profile')
  }
  if (!session.linkedPersonId) {
    redirect('/account/setup')
  }

  const team = await getTeamBySlug(TEAM_SLUG)
  if (!team) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] py-20 px-6 text-center">
        <p className="text-[#990000] text-sm">Team not found.</p>
      </div>
    )
  }

  const store = await readStore()
  const person = store.people.find((p) => p.id === session.linkedPersonId)
  const membership = store.teamMemberships.find(
    (m) => m.teamId === team.id && m.personId === session.linkedPersonId,
  )
  const enrichment = store.personEnrichments.find(
    (e) => e.teamId === team.id && e.personId === session.linkedPersonId,
  )

  const incomingRequestCount = store.playerAlumniRequests.filter(
    (r) =>
      r.teamId === team.id &&
      r.alumniPersonId === session.linkedPersonId &&
      (r.status === 'requested' || r.status === 'seen'),
  ).length

  // Penn Golf in your city: other alumni in the same city, excluding self.
  const myCity = enrichment?.city?.trim().toLowerCase() ?? ''
  type NearbyAlum = {
    personId: string
    name: string
    industry?: string
    currentCompany?: string
    bookId: string | null
  }
  const nearbyAlumni: NearbyAlum[] = myCity
    ? store.personEnrichments
        .filter(
          (e) =>
            e.teamId === team.id &&
            e.personId !== session.linkedPersonId &&
            e.visibleToPlayers !== false &&
            e.city?.trim().toLowerCase() === myCity,
        )
        .map((e) => {
          const p = store.people.find((pp) => pp.id === e.personId)
          if (!p) return null
          const b = findBookEntryForTeamStorePerson(p.canonicalName)
          return {
            personId: p.id,
            name: p.canonicalName,
            industry: e.industry,
            currentCompany: e.currentCompany,
            bookId: b?.id ?? null,
          }
        })
        .filter((x): x is NearbyAlum => x !== null)
        .slice(0, 6)
    : []

  const bookEntry = person ? findBookEntryForTeamStorePerson(person.canonicalName) : null
  // Fallback: look up by id directly in case the team-store person matches a book entry id.
  const bookFromId = !bookEntry && person ? getMemberById(person.id) : null
  const matchedBook = bookEntry ?? (bookFromId && isPublicMember(bookFromId) ? bookFromId : null)

  const yearsLabel =
    membership?.rosterStartYear && membership?.rosterEndYear
      ? `Penn Golf ${membership.rosterStartYear}–${String(membership.rosterEndYear).slice(-2)}`
      : matchedBook
        ? getMemberPennGolfYears(matchedBook)
        : null

  // Profile completeness: quick wins to nudge them toward filling in.
  const completeness = [
    { label: 'Hometown', done: !!(membership?.hometown && membership.hometown.trim()) },
    { label: 'Where you live now', done: !!(enrichment?.city && enrichment.city.trim()) },
    { label: 'Current role', done: !!(enrichment?.currentRole && enrichment.currentRole.trim()) },
    { label: 'Company', done: !!(enrichment?.currentCompany && enrichment.currentCompany.trim()) },
    { label: 'Industry', done: !!(enrichment?.industry && enrichment.industry.trim()) },
    { label: 'Home course', done: !!(enrichment?.homeCourse && enrichment.homeCourse.trim()) },
    { label: 'How you can help', done: !!(enrichment?.helpTopics && enrichment.helpTopics.length > 0) },
  ]
  const doneCount = completeness.filter((c) => c.done).length
  const totalCount = completeness.length

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-5 sm:px-8 pt-12 pb-14">
        <div className="max-w-[820px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Your Profile
          </h1>
          <p className="text-white/55 text-sm sm:text-base mt-3 max-w-xl">
            Signed in as {session.user?.email}.
          </p>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 -mt-6 relative z-10 pb-16 space-y-5">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
          }}
        >
          <div className="px-7 sm:px-10 pt-10 pb-8 border-b border-[rgba(180,168,150,0.3)]">
            <span className="block w-12 h-[2px] bg-[#990000] mb-6" />
            <h2
              className="text-[#0a1628] text-3xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {person?.canonicalName ?? 'Your Profile'}
            </h2>
            {yearsLabel && (
              <p className="text-[15px] text-[#3d4a5c] mt-3">{yearsLabel}</p>
            )}
            {membership?.hometown && (
              <p className="text-[13.5px] text-[#8a7f70] mt-1">{membership.hometown}</p>
            )}
          </div>

          {doneCount < totalCount && (
            <div className="px-7 sm:px-10 py-7 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
              <div className="flex items-baseline justify-between mb-3">
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Complete your profile
                </p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7f70]">
                  {doneCount} / {totalCount}
                </span>
              </div>
              <ul className="space-y-1.5">
                {completeness.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <span
                      className={`inline-block w-3.5 h-3.5 rounded-full text-[10px] leading-[14px] text-center font-bold ${
                        c.done
                          ? 'bg-[#2d6a4f] text-white'
                          : 'bg-white border border-[rgba(180,168,150,0.5)] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={c.done ? 'text-[#8a7f70] line-through' : 'text-[#3d4a5c]'}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="px-7 sm:px-10 py-7 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p
                className="text-[#0a1628] text-base font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Update your details
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1">
                Hometown, where you live now, role, company, and how you can help.
              </p>
            </div>
            <Link
              href={`/alumni/profile/${session.linkedPersonId}?teamSlug=${TEAM_SLUG}`}
              className="bg-[#0a1628] hover:bg-[#112240] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors text-center whitespace-nowrap"
            >
              Manage profile
            </Link>
          </div>

          {matchedBook && (
            <div className="px-7 sm:px-10 py-7 border-t border-[rgba(180,168,150,0.3)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Your Member Book card
                </p>
                <p className="text-[12.5px] text-[#8a7f70] mt-1">
                  How other Penn Golf members see you in the registry.
                </p>
              </div>
              <Link
                href={`/member-book/${encodeURIComponent(matchedBook.id)}`}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
              >
                View card &rarr;
              </Link>
            </div>
          )}

          <div className="px-7 sm:px-10 py-7 border-t border-[rgba(180,168,150,0.3)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p
                  className="text-[#0a1628] text-base font-medium"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Your Inbox
                </p>
                {incomingRequestCount > 0 && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-[#990000] text-white">
                    {incomingRequestCount} new
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-[#8a7f70] mt-1">
                {incomingRequestCount > 0
                  ? `${incomingRequestCount === 1 ? 'A member has' : 'Members have'} reached out to you.`
                  : 'Notes, intros, and questions from other Penn Golf members will land here.'}
              </p>
            </div>
            <Link
              href="/alumni/requests"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
            >
              {incomingRequestCount > 0 ? 'Open inbox' : 'View inbox'} &rarr;
            </Link>
          </div>
        </div>

        {/* Penn Golf in your city */}
        {nearbyAlumni.length > 0 && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
            style={{
              boxShadow:
                '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
            }}
          >
            <div className="px-7 sm:px-10 pt-7 pb-2 border-b border-[rgba(180,168,150,0.3)]">
              <p
                className="text-[#0a1628] text-base font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Penn Golf in {enrichment?.city}
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1 mb-5">
                Other members nearby. Take the meeting when you&rsquo;re in town.
              </p>
            </div>
            <ul>
              {nearbyAlumni.map((a) => (
                <li key={a.personId}>
                  <Link
                    href={a.bookId ? `/member-book/${encodeURIComponent(a.bookId)}` : '#'}
                    className="block px-7 sm:px-10 py-3.5 border-b border-[rgba(180,168,150,0.22)] last:border-b-0 hover:bg-[#faf7f2] transition-colors"
                  >
                    <p
                      className="text-[#0a1628] text-[15px] font-medium"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {a.name}
                    </p>
                    {(a.currentCompany || a.industry) && (
                      <p className="text-[12px] text-[#8a7f70] mt-0.5">
                        {a.currentCompany ?? a.industry}
                        {a.currentCompany && a.industry ? ` · ${a.industry}` : ''}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}
          className="text-center"
        >
          <button
            type="submit"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
