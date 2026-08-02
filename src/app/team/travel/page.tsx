import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import type { TravelHostOffer } from '@/lib/store/types'
import AddTravelStop, { DeleteTravelStop } from '@/components/AddTravelStop'
import TravelHostOfferButton from '@/components/TravelHostOfferButton'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule & Travel',
  description: 'The full season, stop by stop — and offer to host the team.',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatOfferTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function TeamTravelPage() {
  const { getTeamBySlug, getTravelStops, getHostOffersForStop } = await import(
    '@/lib/store/local-store'
  )

  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  const signedIn = !!session?.user?.email
  const isFounder = FOUNDER_EMAILS.has(email)

  const team = await getTeamBySlug('penn-mens-golf')
  const stops = (team ? await getTravelStops(team.id) : []).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  )

  // Founder: pre-load host offers for all stops server-side
  const offersByStop: Record<string, TravelHostOffer[]> = {}
  if (isFounder && team) {
    await Promise.all(
      stops.map(async stop => {
        offersByStop[stop.id] = await getHostOffersForStop(stop.id)
      }),
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-12 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <p className="eyebrow text-gold mb-4">
            Penn Men&rsquo;s Golf
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight font-heading"
          >
            Schedule &amp; Travel
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed mt-5">
            The season, stop by stop &mdash; and offer to host the team when they&rsquo;re near you.
          </p>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#c8a84b] via-[#d4b75a] to-[#c8a84b]" />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-6">
        {/* Founder composer */}
        {isFounder && <AddTravelStop />}

        {/* Stops list */}
        {stops.length === 0 ? (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl px-6 py-16 text-center"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <p className="text-sm font-semibold text-[#0a1628]">
              {isFounder ? 'No stops yet — add the first one.' : 'The schedule hasn\'t been posted yet.'}
            </p>
            <p className="text-xs text-ink-muted mt-2 max-w-sm mx-auto">
              {isFounder
                ? 'Once you add a stop, alumni near that location can offer to host the team.'
                : 'Check back soon — every tournament will be listed here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {stops.map(stop => {
              const offers = offersByStop[stop.id] ?? []
              return (
                <div
                  key={stop.id}
                  className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
                >
                  {/* Stop header — itinerary layout */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1 flex items-start gap-4">
                        {stop.imageUrl && (
                          <span className="flex-shrink-0 w-14 h-14 rounded-lg bg-[#fdfcf9] border border-[rgba(180,168,150,0.4)] flex items-center justify-center overflow-hidden mt-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={stop.imageUrl} alt="" className="w-11 h-11 object-contain" loading="lazy" />
                          </span>
                        )}
                        <div className="min-w-0">
                        {/* Date badge */}
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-1.5">
                          {formatDate(stop.startDate)}
                          {stop.endDate ? ` – ${formatDate(stop.endDate)}` : ''}
                        </p>
                        <h2
                          className="text-[#0a1628] text-xl font-medium leading-snug font-heading"
                        >
{stop.eventName}
                        </h2>
                        <p className="text-sm text-[#3a4657] mt-1">{stop.locationText}</p>
                        {stop.resultText && (
                          <p className="text-[13px] font-semibold text-[#0a1628] mt-1.5">Final: {stop.resultText}</p>
                        )}
                        {stop.note && (
                          <p className="text-xs text-ink-muted mt-2.5 leading-relaxed max-w-xl border-l-2 border-[rgba(180,168,150,0.5)] pl-3">
                            {stop.note}
                          </p>
                        )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        {stop.linkUrl && (
                          <a
                            href={stop.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12.5px] font-semibold text-[#990000] hover:underline whitespace-nowrap"
                          >
                            View leaderboard →
                          </a>
                        )}
                        <TravelHostOfferButton
                          stopId={stop.id}
                          eventName={stop.eventName}
                          signedIn={signedIn}
                        />
                        {isFounder && <AddTravelStop stop={stop} />}
                        {isFounder && <DeleteTravelStop stopId={stop.id} />}
                      </div>
                    </div>
                  </div>

                  {/* Host offers (founder-only) */}
                  {isFounder && (
                    <div className="border-t border-[rgba(180,168,150,0.25)] bg-[#fdfcf9] px-5 sm:px-6 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted mb-3">
                        Host offers ({offers.length})
                      </p>
                      {offers.length === 0 ? (
                        <p className="text-xs text-[#b0a898] italic">No offers yet.</p>
                      ) : (
                        <ul className="space-y-3">
                          {offers.map(offer => (
                            <li key={offer.id} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0a1628]/8 flex items-center justify-center text-[10px] font-semibold text-[#0a1628] uppercase">
                                {offer.byName.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-[#0a1628]">
                                    {offer.byName}
                                  </span>
                                  {offer.byLocation && (
                                    <span className="text-[11px] text-ink-muted">
                                      &mdash; {offer.byLocation}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#b0a898] ml-auto">
                                    {formatOfferTime(offer.createdAt)}
                                  </span>
                                </div>
                                {offer.message && (
                                  <p className="text-xs text-[#3a4657] mt-0.5 leading-relaxed">
                                    {offer.message}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Contextual nudge for members */}
        {!isFounder && stops.length > 0 && (
          <div
            className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
          >
            <div>
              <p className="font-semibold text-[#0a1628] text-sm">Near one of these stops?</p>
              <p className="text-xs text-ink-muted mt-0.5 max-w-md leading-relaxed">
                Alumni hosting the team is what makes Penn Golf, Penn Golf. Tap any stop above to offer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
