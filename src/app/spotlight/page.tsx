import Link from 'next/link'
import { auth } from '@/auth'
import MemberAvatar from '@/components/MemberAvatar'
import SpotlightNominate from '@/components/SpotlightNominate'
import FeatureAlumComposer from '@/components/FeatureAlumComposer'
import type { AlumniSpotlight } from '@/lib/store/types'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spotlight',
  description: 'The member spotlight — one Penn Golf story at a time.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function SpotlightPage() {
  const { getSpotlights, readStore, getTeamBySlug } = await import('@/lib/store/local-store')
  const { FOUNDER_EMAILS } = await import('@/lib/badges')
  const { isCaptainEmailWithOverrides } = await import('@/lib/captains-runtime')

  const [session, store, team, spotlights] = await Promise.all([
    auth(),
    readStore(),
    getTeamBySlug('penn-mens-golf'),
    getSpotlights(),
  ])

  const email = (session?.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(email)
  const isCaptain = isCaptainEmailWithOverrides(email, 'penn-mens-golf', store.accounts)
  const canFeature = isFounder || isCaptain

  // photoFor: same pattern as meet-the-team
  const photoFor = (personId: string): string | null => {
    if (!team) return null
    return (
      store.personEnrichments.find(e => e.personId === personId && e.teamId === team.id)?.photoUrl ??
      store.accounts.find(a => a.linkedPersonId === personId)?.image ??
      null
    )
  }

  // Member list for the composer, sorted by name
  const members = store.people
    .map(p => ({ id: p.id, name: p.canonicalName }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const current: AlumniSpotlight | null = spotlights[0] ?? null
  const past: AlumniSpotlight[] = spotlights.slice(1)

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-16">
        <div className="max-w-[1320px] mx-auto">
          <p className="eyebrow text-gold mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight font-heading"
          >
            Alumni Spotlight
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            Every week we feature someone from the Penn Golf family.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SpotlightNominate />
            {canFeature && <FeatureAlumComposer members={members} />}
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10">
        {/* Current spotlight */}
        <section className="mb-14">
          {current ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.06)' }}
            >
              {/* Featured card header strip — marquee layout */}
              <div className="bg-[#0a1628] px-6 sm:px-10 py-8 sm:py-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                  {/* Avatar — large for editorial weight */}
                  <div className="flex-shrink-0">
                    <MemberAvatar
                      photoUrl={photoFor(current.personId)}
                      name={current.name}
                      size={120}
                      tone="onDark"
                    />
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="eyebrow text-gold mb-2">
                      This week&rsquo;s spotlight
                    </p>
                    <h2
                      className="text-white text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight tracking-tight font-heading"
                    >
                      {current.name}
                    </h2>
                    {current.headline && (
                      <p className="text-[#c8a84b] text-base mt-2 leading-snug">{current.headline}</p>
                    )}
                    <p className="text-white/30 text-xs mt-3 font-medium tracking-wide">
                      Featured {formatDate(current.featuredAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gold ribbon — matches site brand */}
              <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

              {/* Blurb — generous padding */}
              <div className="px-6 sm:px-10 py-8">
                <p className="text-[#3d4a5c] text-base sm:text-lg leading-relaxed max-w-3xl">
                  {current.blurb}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <div className="bg-[#0a1628] px-6 sm:px-10 py-10 text-center">
                <p className="eyebrow text-gold mb-3">
                  This week&rsquo;s spotlight
                </p>
                <p
                  className="text-white/70 text-2xl font-medium font-heading"
                >
                  Coming soon
                </p>
              </div>
              <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />
              <div className="px-6 sm:px-10 py-8 text-center">
                <p className="text-sm text-[#3a4657] leading-relaxed mb-6">
                  Know someone from the Penn Golf family who deserves a moment in the spotlight?
                  Nominate them &mdash; we pick from submissions each week.
                </p>
                <SpotlightNominate />
              </div>
            </div>
          )}
        </section>

        {/* Past spotlights */}
        {past.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted mb-5">
              Past spotlights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map(s => (
                <div
                  key={s.id}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 flex flex-col gap-3"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  <div className="flex items-start gap-3">
                    <MemberAvatar
                      photoUrl={photoFor(s.personId)}
                      name={s.name}
                      size={48}
                      tone="navy"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-[#0a1628] text-sm leading-tight font-heading"
                      >
                        {s.name}
                      </p>
                      {s.headline && (
                        <p className="text-xs text-[#c8a84b] mt-0.5 leading-snug">{s.headline}</p>
                      )}
                      <p className="text-[10px] text-ink-muted mt-1">{formatDate(s.featuredAt)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#3a4657] leading-relaxed line-clamp-3">{s.blurb}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
