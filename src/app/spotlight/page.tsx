import Link from 'next/link'
import { auth } from '@/auth'
import MemberAvatar from '@/components/MemberAvatar'
import SpotlightNominate from '@/components/SpotlightNominate'
import FeatureAlumComposer from '@/components/FeatureAlumComposer'
import type { AlumniSpotlight } from '@/lib/store/types'

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
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-16">
        <div className="max-w-[1320px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Alumni Spotlight
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-5">
            This week&rsquo;s spotlight
          </p>

          {current ? (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(10,22,40,0.08), 0 16px 40px rgba(10,22,40,0.06)' }}
            >
              {/* Featured card header strip */}
              <div className="bg-[#0a1628] px-6 sm:px-8 py-5 flex items-center gap-4">
                <MemberAvatar
                  photoUrl={photoFor(current.personId)}
                  name={current.name}
                  size={96}
                  tone="onDark"
                />
                <div className="min-w-0">
                  <p
                    className="text-white text-2xl sm:text-3xl font-medium leading-tight"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {current.name}
                  </p>
                  {current.headline && (
                    <p className="text-[#c8a84b] text-sm mt-1.5 leading-snug">{current.headline}</p>
                  )}
                  <p className="text-white/35 text-xs mt-2">
                    Featured {formatDate(current.featuredAt)}
                  </p>
                </div>
              </div>

              {/* Penn red ribbon */}
              <div className="h-[3px] bg-gradient-to-r from-[#990000] via-[#bb0000] to-[#990000]" />

              {/* Blurb */}
              <div className="px-6 sm:px-8 py-7">
                <p className="text-[#3d4a5c] text-base leading-relaxed">{current.blurb}</p>
              </div>
            </div>
          ) : (
            <div
              className="bg-white border border-[rgba(180,168,150,0.35)] rounded-2xl px-6 py-16 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-sm font-semibold text-[#0a1628]">No spotlight yet</p>
              <p className="text-xs text-[#8a7f70] mt-2 max-w-sm mx-auto">
                Nominate someone below &mdash; we&rsquo;ll pick from submissions.
              </p>
              <div className="mt-6">
                <SpotlightNominate />
              </div>
            </div>
          )}
        </section>

        {/* Past spotlights */}
        {past.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7f70] mb-5">
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
                        className="font-semibold text-[#0a1628] text-sm leading-tight"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {s.name}
                      </p>
                      {s.headline && (
                        <p className="text-xs text-[#c8a84b] mt-0.5 leading-snug">{s.headline}</p>
                      )}
                      <p className="text-[10px] text-[#8a7f70] mt-1">{formatDate(s.featuredAt)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-3">{s.blurb}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
