import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GatheringCard, { type GatheringData } from '@/components/gatherings/GatheringCard'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Single gathering detail — what you "click into" from a card on The Course
 * or the 19th Hole. Reuses GatheringCard so RSVP, Add-to-Calendar, the map,
 * and the host's Remove control all behave exactly like the list view.
 * Gracefully handles a removed/closed/unknown gathering with a friendly
 * message instead of a hard 404.
 */
export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const { getClubhouseGatheringById } = await import('@/lib/store/local-store')
  const { getApprovalState: approvalForMeta } = await import('@/lib/access/approval')
  const gathering = await getClubhouseGatheringById(id)
  // Don't put member-only event details in the tab title / link preview.
  if (!(await approvalForMeta()).approved) return { title: 'Gatherings' }
  if (!gathering) return { title: 'Gatherings' }
  const where = [gathering.venue, gathering.city].filter(Boolean).join(', ')
  return {
    title: gathering.title,
    description: [gathering.dateText, where].filter(Boolean).join(' · ') || 'A Penn Golf gathering.',
  }
}

export default async function GatheringDetailPage({ params }: Props) {
  const { id } = await params
  // Gathering details (host, venue, who's coming) are member-only — the
  // list pages that link here are gated the same way.
  const approval = await getApprovalState()
  if (!approval.approved) {
    return (
      <GatedPreview
        signedIn={approval.signedIn}
        eyebrow="Members only · Gatherings"
        headline="Gatherings are for members."
        blurb="Sign in and claim your Member Book card to see where the Penn Golf family is meeting up."
      />
    )
  }

  const { getClubhouseGatheringById, readStore } = await import('@/lib/store/local-store')
  const { isExampleGathering, isHiddenGathering, isExpiredExampleGathering } = await import('@/lib/seed-data/example-gatherings')

  const gathering = await getClubhouseGatheringById(id)
  const available =
    !!gathering &&
    gathering.status !== 'closed' &&
    !isHiddenGathering(gathering.id) &&
    !isExpiredExampleGathering({
      isExample: isExampleGathering(gathering.id, gathering.isExample),
      dateText: gathering.dateText,
    })

  if (!gathering || !available) {
    return (
      <div className="min-h-screen bg-[#fbf9f6]">
        <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-12">
          <div className="max-w-[640px] mx-auto">
            <Link
              href="/player"
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to the Clubhouse
            </Link>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Gathering not found</h1>
          </div>
        </div>
        <div className="max-w-[640px] mx-auto px-6 sm:px-8 py-12">
          <p className="text-sm text-ink-muted">
            This gathering isn&rsquo;t available anymore — it may have been removed by the host or has
            already happened. Check{' '}
            <Link href="/the-course" className="text-[#990000] hover:underline font-medium">The Course</Link>{' '}
            or{' '}
            <Link href="/19th-hole" className="text-[#990000] hover:underline font-medium">the 19th Hole</Link>{' '}
            for what&rsquo;s on now.
          </p>
        </div>
      </div>
    )
  }

  const data = {
    ...gathering,
    isExample: isExampleGathering(gathering.id, gathering.isExample),
  } as GatheringData

  const store = await readStore()
  const interestedCount = store.clubhouseGatheringRequests.filter(
    r => r.gatheringId === gathering.id && r.status !== 'declined' && r.status !== 'closed',
  ).length

  const isRound = gathering.type === 'round'
  const backHref = isRound ? '/the-course' : '/19th-hole'
  const backLabel = isRound ? 'The Course' : 'the 19th Hole'

  return (
    <div className="min-h-screen bg-[#fbf9f6]">
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-10 pb-14">
        <div className="max-w-[640px] mx-auto">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {backLabel}
          </Link>
          <p className="eyebrow text-gold mb-2">
            Penn Men&rsquo;s Golf · Gathering
          </p>
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
            {gathering.title}
          </h1>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-6 sm:px-8 -mt-7 pb-16 relative z-10">
        <GatheringCard gathering={data} interestedCount={interestedCount} />
      </div>
    </div>
  )
}
