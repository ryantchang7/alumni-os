// /moments — the Penn Golf wall. Reverse-chrono feed of member-posted
// photos + captions. Public to read; sign-in required to post.

import Link from 'next/link'
import {
  getTeamBySlug,
  getMomentsForTeam,
  readStore,
} from '@/lib/store/local-store'
import { findBookEntryForTeamStorePerson } from '@/lib/member-book/bridge'
import { Camera } from 'lucide-react'

const TEAM_SLUG = 'penn-mens-golf'

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso)
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default async function MomentsPage() {
  const team = await getTeamBySlug(TEAM_SLUG)
  const moments = team ? await getMomentsForTeam(team.id) : []
  const store = team ? await readStore() : null

  // Resolve poster -> Member Book bookId for linking.
  function bookIdForPerson(personId: string | undefined): string | null {
    if (!personId || !store) return null
    const person = store.people.find((p) => p.id === personId)
    if (!person) return null
    const entry = findBookEntryForTeamStorePerson(person.canonicalName)
    return entry?.id ?? null
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14 relative overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            right: '12%',
            width: '600px',
            height: '420px',
            transform: 'translate(50%, -50%)',
            background:
              'radial-gradient(ellipse at center, rgba(200,168,75,0.14) 0%, rgba(200,168,75,0.04) 40%, transparent 70%)',
          }}
        />
        <div className="max-w-[820px] mx-auto relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b]/85 mb-4">
            Penn Men&rsquo;s Golf · The Wall
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Moments
          </h1>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-5 mb-5" />
          <p className="text-white/55 text-sm sm:text-base max-w-xl leading-relaxed">
            Rounds, dinners, championship cuttings, first-tee jitters &mdash;
            moments shared by Penn Golf members across generations.
          </p>
          <div className="mt-7">
            <Link
              href="/moments/new"
              className="inline-flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b69740] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              Post a moment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {moments.length === 0 ? (
          <div
            className="bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
          >
            <Camera className="w-7 h-7 text-[#c8a84b] mx-auto mb-4" />
            <p
              className="text-[#0a1628] text-lg font-medium mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No moments yet.
            </p>
            <p className="text-[13px] text-[#8a7f70] max-w-md mx-auto mb-6">
              Be the first. Post a photo from a round, a tournament, an alumni dinner.
              The wall grows one moment at a time.
            </p>
            <Link
              href="/moments/new"
              className="inline-block bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
            >
              Post the first
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {moments.map((m) => {
              const bookId = bookIdForPerson(m.postedByPersonId)
              return (
                <article
                  key={m.id}
                  className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
                  style={{
                    boxShadow:
                      '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
                  }}
                >
                  {/* Photo */}
                  <div className="relative bg-[#faf7f2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.photoUrl}
                      alt={m.caption}
                      className="w-full max-h-[640px] object-cover"
                    />
                  </div>
                  {/* Caption + meta */}
                  <div className="px-6 sm:px-8 py-5">
                    <p className="text-[14.5px] text-[#0a1628] leading-relaxed whitespace-pre-wrap">
                      {m.caption}
                    </p>
                    <div className="mt-4 flex items-baseline justify-between gap-3 text-[12px]">
                      <p className="text-[#8a7f70]">
                        <span className="text-[#8a7f70]">Posted by </span>
                        {bookId ? (
                          <Link
                            href={`/member-book/${encodeURIComponent(bookId)}`}
                            className="text-[#0a1628] hover:underline font-medium"
                            style={{ fontFamily: 'var(--font-playfair)' }}
                          >
                            {m.postedByName}
                          </Link>
                        ) : (
                          <span
                            className="text-[#0a1628] font-medium"
                            style={{ fontFamily: 'var(--font-playfair)' }}
                          >
                            {m.postedByName}
                          </span>
                        )}
                      </p>
                      <span className="text-[#b0a898]">{timeAgo(m.createdAt)}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
