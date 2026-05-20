import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getMemberById } from '@/lib/member-book/data'
import {
  isPublicMember,
  getMemberPennGolfYears,
  getMemberHometownLabel,
  isActiveMember,
} from '@/lib/member-book/helpers'

// Detail pages render on demand so we don't ship 337 prebuilt HTML payloads
// in the deploy artifact (caused vercel CLI Upload aborted at ~29 MB).
export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params
  const decoded = decodeURIComponent(memberId)
  const member = getMemberById(decoded)

  if (!member || !isPublicMember(member)) {
    notFound()
  }

  const years = getMemberPennGolfYears(member)
  const hometown = getMemberHometownLabel(member)
  const classYear = member.profile.classYearEstimate
  const isCurrent = isActiveMember(member)
  const totalLetters = member.letterWinner.years.length
  const totalSeasons =
    member.career.verifiedRosterSeasonCount > 0
      ? member.career.verifiedRosterSeasonCount
      : member.career.inferredLetterSeasons.length

  const hasProfileDetails =
    member.profile.currentRole ||
    member.profile.currentCompany ||
    member.profile.city ||
    member.profile.highSchool

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Header strip */}
      <div className="bg-[#0a1628] px-5 sm:px-8 py-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/member-book"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to the Member Book</span>
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Penn Men&rsquo;s Golf
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
          }}
        >
          {/* Identity */}
          <div className="px-7 sm:px-10 pt-10 pb-8 border-b border-[rgba(180,168,150,0.3)] relative">
            <span className="block w-12 h-[2px] bg-[#990000] mb-6" />
            <h1
              className="text-[#0a1628] text-3xl sm:text-4xl font-medium leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
              data-testid="member-detail-name"
            >
              {member.displayName}
            </h1>
            {years && (
              <p className="text-[15px] text-[#3d4a5c] mt-3" data-testid="member-detail-years">
                {years}
              </p>
            )}
            <div className="text-[13.5px] text-[#8a7f70] mt-1 space-y-0.5">
              {classYear && <p>Class of {classYear}</p>}
              {hometown && <p>{hometown}</p>}
            </div>
            {isCurrent && (
              <span className="inline-block mt-5 text-[10px] font-medium px-2.5 py-1 rounded-full text-[#2d6a4f] bg-[#2d6a4f]/8 border border-[#2d6a4f]/25 uppercase tracking-[0.14em]">
                Current Player
              </span>
            )}
          </div>

          {/* Penn Golf section */}
          <Section title="Penn Golf">
            {years ? (
              <p className="text-[14px] text-[#3d4a5c] leading-relaxed">
                {member.displayName.split(' ')[0]} represented Penn Men&rsquo;s
                Golf {years.replace('Penn Golf ', 'from ')}.
              </p>
            ) : (
              <p className="text-[14px] text-[#3d4a5c] leading-relaxed">
                {member.displayName.split(' ')[0]} is part of the Penn Men&rsquo;s
                Golf family.
              </p>
            )}
            {(totalLetters > 0 || totalSeasons > 0) && (
              <div className="mt-5 grid grid-cols-2 gap-4 max-w-md">
                {totalLetters > 0 && (
                  <Stat
                    value={totalLetters}
                    label={totalLetters === 1 ? 'Letter Year' : 'Letter Years'}
                  />
                )}
                {totalSeasons > 0 && (
                  <Stat
                    value={totalSeasons}
                    label={totalSeasons === 1 ? 'Season' : 'Seasons'}
                  />
                )}
              </div>
            )}
          </Section>

          {/* Clubhouse Profile */}
          <Section title="Clubhouse Profile">
            {hasProfileDetails ? (
              <div className="space-y-1.5 text-[14px] text-[#3d4a5c]">
                {member.profile.currentRole && member.profile.currentCompany && (
                  <p>
                    {member.profile.currentRole} ·{' '}
                    <span className="text-[#0a1628]">
                      {member.profile.currentCompany}
                    </span>
                  </p>
                )}
                {member.profile.currentRole && !member.profile.currentCompany && (
                  <p>{member.profile.currentRole}</p>
                )}
                {!member.profile.currentRole && member.profile.currentCompany && (
                  <p>{member.profile.currentCompany}</p>
                )}
                {member.profile.city && <p>{member.profile.city}</p>}
                {member.profile.highSchool && (
                  <p className="text-[#8a7f70]">{member.profile.highSchool}</p>
                )}
              </div>
            ) : (
              <p className="text-[14px] text-[#8a7f70] italic">
                Profile details coming soon.
              </p>
            )}
          </Section>

          {/* Claim Profile */}
          <div className="px-7 sm:px-10 py-8 bg-[#faf7f2] border-t border-[rgba(180,168,150,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p
                className="text-[#0a1628] text-base font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Is this you?
              </p>
              <p className="text-[12.5px] text-[#8a7f70] mt-1 max-w-md">
                Add your hometown, where you live now, and how you can help the next generation.
              </p>
            </div>
            <Link
              href="/alumni"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#990000] hover:underline whitespace-nowrap"
            >
              Claim &amp; Update &rarr;
            </Link>
          </div>
        </div>

        {/* Back link below card */}
        <div className="mt-8 text-center">
          <Link
            href="/member-book"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            &larr; The Member Book
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="px-7 sm:px-10 py-7 border-b border-[rgba(180,168,150,0.3)] last:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-3">
        {title}
      </p>
      {children}
    </section>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-[#faf7f2] border border-[rgba(180,168,150,0.4)] rounded-lg px-4 py-3">
      <p
        className="text-2xl text-[#0a1628] font-medium leading-none"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f70] mt-1.5">
        {label}
      </p>
    </div>
  )
}
