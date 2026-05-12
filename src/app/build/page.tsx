import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ teamSlug?: string }>
}

const TEAM_SLUG = 'penn-mens-golf'

async function getTeamAndStatus(teamSlug: string) {
  const { getTeamBySlug, getPublishedPeopleForTeam, getPeopleForTeam } = await import(
    '@/lib/store/local-store'
  )
  const team = await getTeamBySlug(teamSlug)
  if (!team) return null
  const [people, published] = await Promise.all([
    getPeopleForTeam(team.id),
    getPublishedPeopleForTeam(team.id),
  ])
  return { team, peopleCount: people.length, publishedCount: published.length }
}

function StepRow({
  number,
  title,
  description,
  done,
  active,
  href,
  linkLabel,
}: {
  number: number
  title: string
  description: string
  done: boolean
  active: boolean
  href?: string
  linkLabel?: string
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
        active
          ? { boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }
          : undefined
      }
    >
      <div className="flex-shrink-0 pt-0.5">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
              active
                ? 'bg-[#0a1628] text-white'
                : 'border border-[rgba(180,168,150,0.5)] text-[#8a7f70]'
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
        <p className={`text-xs leading-relaxed ${active ? 'text-[#4a5568]' : 'text-[#8a7f70]'}`}>
          {description}
        </p>
        {href && linkLabel && (active || done) && (
          <Link
            href={href}
            className="inline-block mt-3 text-xs font-semibold text-[#990000] hover:underline"
          >
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function BuildPage({ searchParams }: PageProps) {
  const { teamSlug } = await searchParams
  const slug = teamSlug ?? TEAM_SLUG

  const status = await getTeamAndStatus(slug)

  if (teamSlug && !status) notFound()

  const hasPeople = (status?.peopleCount ?? 0) > 0
  const hasPublished = (status?.publishedCount ?? 0) > 0

  const step1Done = !!status
  const step2Done = hasPeople
  const step3Done = hasPublished
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4

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
            description="Give us a roster link. The agent reads the page and finds the players."
            done={step1Done}
            active={activeStep === 1}
            href={step1Done ? undefined : `/builder/agent?teamSlug=${TEAM_SLUG}`}
            linkLabel={step1Done ? undefined : 'Open agent'}
          />

          <StepRow
            number={2}
            title="Review what was found"
            description={
              hasPeople
                ? `${status!.peopleCount} ${status!.peopleCount === 1 ? 'person' : 'people'} in the network.`
                : 'The agent shows you the names it found. You approve before anything is saved.'
            }
            done={step2Done}
            active={activeStep === 2}
            href={`/builder/agent?teamSlug=${slug}`}
            linkLabel="Open agent"
          />

          <StepRow
            number={3}
            title="Approve and publish"
            description={
              hasPublished
                ? `${status!.publishedCount} ${status!.publishedCount === 1 ? 'profile' : 'profiles'} published.`
                : 'You decide who appears in the network. Nothing is visible to players until you approve it.'
            }
            done={step3Done}
            active={activeStep === 3}
            href={`/builder/captain-review?teamSlug=${slug}`}
            linkLabel="Open review"
          />

          <StepRow
            number={4}
            title="Open Player Mode"
            description="Players see a clean alumni network — names, years, hometowns, and career info when available."
            done={false}
            active={activeStep === 4}
            href={`/player?teamSlug=${slug}`}
            linkLabel="Open Player Mode"
          />

          {activeStep > 1 && (
            <div className="pt-4 flex gap-3 flex-wrap">
              <Link
                href={`/builder/agent?teamSlug=${slug}`}
                className="text-sm font-semibold bg-[#990000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-lg transition-colors"
              >
                Open agent &rarr;
              </Link>
              {hasPeople && (
                <Link
                  href={`/builder/captain-review?teamSlug=${slug}`}
                  className="text-sm font-medium text-[#0a1628] border border-[#0a1628] hover:bg-[#0a1628] hover:text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  Review &amp; publish
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
