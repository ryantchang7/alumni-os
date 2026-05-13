'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

const TEAM_SLUG = 'penn-mens-golf'

interface BuildPerson {
  personId: string
  canonicalName: string
  classLabel: string | null
  hometown: string | null
  publishedToNetwork: boolean
  publishedAt: string | null
}

function StepRow({
  number,
  title,
  description,
  done,
  active,
}: {
  number: number
  title: string
  description: React.ReactNode
  done: boolean
  active: boolean
}) {
  return (
    <div
      className={`flex gap-4 p-5 rounded-xl border ${
        active
          ? 'border-[#0a1628] bg-white'
          : done
            ? 'border-[rgba(180,168,150,0.35)] bg-white'
            : 'border-[rgba(180,168,150,0.25)] bg-[#faf8f5]'
      }`}
      style={
        active ? { boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' } : undefined
      }
    >
      <div className="flex-shrink-0 pt-0.5">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
              active ? 'bg-[#0a1628] text-white' : 'border border-[rgba(180,168,150,0.5)] text-[#8a7f70]'
            }`}
          >
            {number}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm leading-snug mb-1 ${
            active ? 'text-[#0a1628]' : done ? 'text-[#0a1628]' : 'text-[#8a7f70]'
          }`}
        >
          {title}
        </p>
        <div className={`text-xs leading-relaxed ${active ? 'text-[#4a5568]' : 'text-[#8a7f70]'}`}>
          {description}
        </div>
      </div>
    </div>
  )
}

function PersonRow({
  person,
  onPublish,
  onHide,
  busy,
}: {
  person: BuildPerson
  onPublish: (id: string) => void
  onHide: (id: string) => void
  busy: string | null
}) {
  const isPublished = person.publishedToNetwork
  const isBusy = busy === person.personId

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[rgba(180,168,150,0.2)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0a1628] truncate">{person.canonicalName}</p>
        <p className="text-xs text-[#8a7f70] mt-0.5">
          {[person.classLabel, person.hometown].filter(Boolean).join(' · ') || 'Roster member'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPublished ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <Eye className="w-3 h-3" />
              Visible to players
            </span>
            <button
              onClick={() => onHide(person.personId)}
              disabled={isBusy}
              className="text-xs font-medium text-[#8a7f70] hover:text-[#0a1628] border border-[rgba(180,168,150,0.5)] hover:border-[#0a1628] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {isBusy ? '…' : 'Hide'}
            </button>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8a7f70] bg-[#f5f2ee] border border-[rgba(180,168,150,0.35)] rounded-full px-2.5 py-1">
              <EyeOff className="w-3 h-3" />
              Hidden from players
            </span>
            <button
              onClick={() => onPublish(person.personId)}
              disabled={isBusy}
              className="text-xs font-medium bg-[#0a1628] hover:bg-[#112240] text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {isBusy ? '…' : 'Publish'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function BuildPageInner() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('teamSlug') ?? TEAM_SLUG

  const [people, setPeople] = useState<BuildPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [teamExists, setTeamExists] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
    const res = await fetch(`/api/build/people?teamSlug=${slug}`)
    if (!res.ok) {
      setTeamExists(false)
      setLoading(false)
      return
    }
    const data = await res.json()
    setTeamExists(true)
    setPeople(data.people ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  const publishedCount = people.filter(p => p.publishedToNetwork).length
  const hasPeople = people.length > 0
  const hasPublished = publishedCount > 0

  const step1Done = !loading && teamExists
  const step2Done = hasPeople
  const step3Done = hasPublished
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4

  async function handlePublish(personId: string) {
    setBusy(personId)
    await fetch('/api/network/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamSlug: slug, personId, role: 'captain' }),
    })
    await fetchPeople()
    setBusy(null)
  }

  async function handleHide(personId: string) {
    setBusy(personId)
    await fetch('/api/network/unpublish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamSlug: slug, personId, role: 'captain' }),
    })
    await fetchPeople()
    setBusy(null)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-14">
        <div className="max-w-[860px] mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Build</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight">
            Build your alumni network.
          </h1>
          <p className="text-gray-300 text-base mt-2 max-w-xl leading-relaxed">
            Four steps from a roster link to a live network your team can actually use.
          </p>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-8">
        <div className="-mt-5 relative z-10 space-y-3 pb-16">
          <StepRow
            number={1}
            title="Add your team"
            description={
              step1Done ? (
                <span>Penn Men&apos;s Golf is set up.</span>
              ) : (
                <span>
                  Give us a roster link. The agent reads the page and finds the players.{' '}
                  <Link href={`/builder/agent?teamSlug=${slug}`} className="font-semibold text-[#990000] hover:underline">
                    Open agent &rarr;
                  </Link>
                </span>
              )
            }
            done={step1Done}
            active={activeStep === 1}
          />

          <StepRow
            number={2}
            title="Review what was found"
            description={
              hasPeople ? (
                <span>
                  {people.length} {people.length === 1 ? 'person' : 'people'} found in the network.
                </span>
              ) : (
                <span>
                  The agent shows you the names it found.{' '}
                  {step1Done && (
                    <Link href={`/builder/agent?teamSlug=${slug}`} className="font-semibold text-[#990000] hover:underline">
                      Open agent &rarr;
                    </Link>
                  )}
                </span>
              )
            }
            done={step2Done}
            active={activeStep === 2}
          />

          {/* Step 3 — self-contained publish panel */}
          <div
            className={`rounded-xl border ${
              activeStep === 3 || step3Done
                ? 'border-[#0a1628] bg-white'
                : 'border-[rgba(180,168,150,0.25)] bg-[#faf8f5]'
            }`}
            style={
              activeStep === 3 || step3Done
                ? { boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }
                : undefined
            }
          >
            <div className="flex gap-4 p-5">
              <div className="flex-shrink-0 pt-0.5">
                {step3Done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                      activeStep === 3
                        ? 'bg-[#0a1628] text-white'
                        : 'border border-[rgba(180,168,150,0.5)] text-[#8a7f70]'
                    }`}
                  >
                    3
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm leading-snug mb-1 ${
                    activeStep === 3 || step3Done ? 'text-[#0a1628]' : 'text-[#8a7f70]'
                  }`}
                >
                  Approve and publish
                </p>
                <p
                  className={`text-xs leading-relaxed ${
                    activeStep === 3 || step3Done ? 'text-[#4a5568]' : 'text-[#8a7f70]'
                  }`}
                >
                  {step3Done
                    ? `${publishedCount} ${publishedCount === 1 ? 'profile' : 'profiles'} visible to players.`
                    : 'You decide who appears in the network. Nothing is visible to players until you publish it.'}
                </p>
              </div>
            </div>

            {hasPeople && (
              <div className="px-5 pb-5">
                <div className="border-t border-[rgba(180,168,150,0.2)] pt-4">
                  <p className="text-xs text-[#8a7f70] mb-3">
                    Published alumni are visible to current players.
                  </p>
                  {loading ? (
                    <p className="text-sm text-[#8a7f70] py-4 text-center">Loading…</p>
                  ) : (
                    <div>
                      {people.map(person => (
                        <PersonRow
                          key={person.personId}
                          person={person}
                          onPublish={handlePublish}
                          onHide={handleHide}
                          busy={busy}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <StepRow
            number={4}
            title="Open Player Mode"
            description={
              hasPublished ? (
                <span>
                  Players can now see the alumni network.{' '}
                  <Link href={`/player?teamSlug=${slug}`} className="font-semibold text-[#990000] hover:underline">
                    Open Player Mode &rarr;
                  </Link>
                </span>
              ) : (
                'Players see a clean alumni network — names, years, hometowns, and career info when available.'
              )
            }
            done={false}
            active={activeStep === 4}
          />

          {hasPeople && (
            <div className="pt-4 flex gap-3 flex-wrap">
              {hasPublished && (
                <Link
                  href={`/player?teamSlug=${slug}`}
                  className="text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-lg transition-colors"
                >
                  Open Player Mode &rarr;
                </Link>
              )}
              <Link
                href={`/builder/agent?teamSlug=${slug}`}
                className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                Agent tools
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[#8a7f70]">Loading…</div>}>
      <BuildPageInner />
    </Suspense>
  )
}
