import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import type {
  Person,
  TeamMembership,
  PersonEnrichment,
  CareerPost,
  CareerPostSector,
} from '@/lib/store/types'
import { getApprovalState } from '@/lib/access/approval'
import GatedPreview from '@/components/GatedPreview'
import ExampleCard from '@/components/ExampleCard'
import CareerRoomHero from './CareerRoomHero'

const SECTOR_LABEL: Record<CareerPostSector, string> = {
  finance: 'Finance',
  consulting: 'Consulting',
  'real-estate': 'Real Estate',
  law: 'Law',
  technology: 'Tech',
  startups: 'Startups',
  sports: 'Sports / Golf',
  medicine: 'Medicine',
  media: 'Media',
  'public-service': 'Public Service',
  other: 'Other',
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1mo ago'
  return `${months}mo ago`
}

function PostCard({ post }: { post: CareerPost }) {
  const isAsk = post.kind === 'ask'
  const accent = isAsk ? '#990000' : '#2d6a4f'
  const accentBg = isAsk ? 'rgba(153,0,0,0.06)' : 'rgba(45,106,79,0.06)'
  const mailto = `mailto:${post.contactEmail}?subject=${encodeURIComponent(
    `Penn Golf · ${isAsk ? 'Re your ask' : 'Re your offer'}: ${post.headline}`,
  )}`
  return (
    <div
      className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl p-5 flex flex-col gap-3"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9.5px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full border"
          style={{ color: accent, backgroundColor: accentBg, borderColor: accent + '40' }}
        >
          {isAsk ? 'Ask' : 'Offer'}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a7f70] bg-[#f8f5f0] border border-[rgba(180,168,150,0.35)] px-2 py-0.5 rounded">
          {SECTOR_LABEL[post.sector]}
        </span>
        <span className="text-[10.5px] text-[#8a7f70] ml-auto">{timeAgo(post.createdAt)}</span>
      </div>
      <p
        className="text-[#0a1628] text-[16px] font-medium leading-snug"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {post.headline}
      </p>
      {post.body && (
        <p className="text-[13px] text-[#3d4a5c] leading-relaxed whitespace-pre-line">
          {post.body}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(180,168,150,0.3)]">
        <p className="text-[12px] text-[#8a7f70]">
          <span className="text-[#0a1628] font-medium">{post.postedByName}</span>
        </p>
        <a
          href={mailto}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] hover:text-[#990000] transition-colors"
        >
          Reply privately
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

interface AlumniEntry {
  person: Person
  membership: TeamMembership
  enrichment: PersonEnrichment
}

const INDUSTRIES = [
  { label: 'Finance & Investing', slug: 'finance', initial: 'F' },
  { label: 'Consulting', slug: 'consulting', initial: 'C' },
  { label: 'Real Estate', slug: 'real-estate', initial: 'R' },
  { label: 'Law', slug: 'law', initial: 'L' },
  { label: 'Technology', slug: 'technology', initial: 'T' },
  { label: 'Startups & Founders', slug: 'startups', initial: 'S' },
  { label: 'Sports / Golf Industry', slug: 'sports', initial: 'G' },
  { label: 'Medicine', slug: 'medicine', initial: 'M' },
  { label: 'Media & Entertainment', slug: 'media', initial: 'E' },
  { label: 'Public Service', slug: 'public-service', initial: 'P' },
]

function AlumniCard({ entry }: { entry: AlumniEntry }) {
  const { person, membership, enrichment } = entry
  return (
    <Link
      href={`/player/alumni/${person.id}?teamSlug=penn-mens-golf`}
      className="block bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 hover:shadow-md transition-shadow group"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <p className="font-semibold text-[#0a1628] text-sm">{person.canonicalName}</p>
      {(enrichment.currentRole || enrichment.currentCompany) && (
        <p className="text-xs text-[#4a5568] mt-0.5">
          {enrichment.currentRole && enrichment.currentCompany
            ? `${enrichment.currentRole} at ${enrichment.currentCompany}`
            : enrichment.currentRole ?? enrichment.currentCompany}
        </p>
      )}
      {enrichment.city && (
        <p className="text-xs text-[#8a7f70] mt-0.5">{enrichment.city}</p>
      )}
      {membership.classLabel && (
        <p className="text-xs text-[#8a7f70]">{membership.classLabel}</p>
      )}
      <span className="text-xs font-medium text-[#990000] group-hover:underline mt-3 block">
        View profile &rarr;
      </span>
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 text-sm text-[#8a7f70]"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06)' }}>
      {label}
    </div>
  )
}

export default async function CareerRoomPage() {
  const approval = await getApprovalState()
  const { readStore, getTeamBySlug, getCareerPostsForTeam } = await import('@/lib/store/local-store')
  const store = await readStore()
  const team = await getTeamBySlug('penn-mens-golf')

  let alumni: AlumniEntry[] = []
  let careerPosts: CareerPost[] = []

  if (team) {
    const memberships = store.teamMemberships.filter(
      m => m.teamId === team.id && m.memberRole === 'alumni' && m.publishedToNetwork === true,
    )
    const enrichments = store.personEnrichments.filter(e => e.teamId === team.id)
    const enrichMap = new Map(enrichments.map(e => [e.personId, e]))

    alumni = memberships
      .map(m => {
        const person = store.people.find(p => p.id === m.personId)
        const enrichment = enrichMap.get(m.personId)
        if (!person || !enrichment) return null
        if (enrichment.visibleToPlayers === false) return null
        return { person, membership: m, enrichment }
      })
      .filter((x): x is AlumniEntry => x !== null)

    careerPosts = await getCareerPostsForTeam(team.id)
  }

  const openToMentorship = alumni.filter(a => a.enrichment.openToMentorship)
  const openToIntros = alumni.filter(a => a.enrichment.openToWarmIntroductions)
  const openToCoffee = alumni.filter(a => a.enrichment.openToCoffee)
  const asks = careerPosts.filter(p => p.kind === 'ask')
  const offers = careerPosts.filter(p => p.kind === 'offer')

  if (!approval.approved) {
    return (
      <div className="min-h-screen bg-[#f8f5f0]">
        <CareerRoomHero />
        <div className="max-w-[820px] mx-auto px-6 sm:px-8 pt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
            What you&rsquo;d see inside
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ExampleCard
              kind="Ask"
              kindAccent="#990000"
              title="Warm intro to PE associate in NYC"
              subtitle="Finance · Posted by an alum, '17"
              body="Targeting middle-market funds. Especially Centerview, Evercore, or boutiques with healthcare practice."
            />
            <ExampleCard
              kind="Offer"
              kindAccent="#2d6a4f"
              title="Can intro 1 alum/month to MDs at Centerview"
              subtitle="Finance · Posted by an alum, '08"
              body="If you're working through a banking recruiting cycle or thinking about a switch, I can make it happen."
            />
            <ExampleCard
              kind="Ask"
              kindAccent="#990000"
              title="Coffee with someone in PM at OpenAI"
              subtitle="Tech · Posted by an alum, '21"
              body="Considering jumping over from a similar-stage startup. 30 min call would mean a lot."
            />
            <ExampleCard
              kind="Offer"
              kindAccent="#2d6a4f"
              title="Recruiting chats for Penn '27 / '28"
              subtitle="Consulting · Posted by an alum, '19"
              body="Happy to share what BCG case prep looked like + which alumni reached out to me when I was in your shoes."
            />
          </div>
        </div>
        <GatedPreview
          signedIn={approval.signedIn}
          eyebrow="Members only · Career Room"
          headline="The floor stays inside the room."
          blurb="The Career Room is where Penn Golf alumni post real asks and real offers — warm intros, referrals, mentorship. Replies are private. Claim your card to see and post."
          stats={[
            { label: 'On the floor', value: careerPosts.length },
            { label: 'Mentors', value: openToMentorship.length },
            { label: 'Open to intros', value: openToIntros.length },
            { label: 'Open to coffee', value: openToCoffee.length },
          ]}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <CareerRoomHero />

      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* Asks & Offers — the active surface */}
        <section data-testid="asks-and-offers">
          <div className="flex items-end justify-between gap-4 mb-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-1">
                The Floor
              </p>
              <h2 className="text-base font-semibold text-[#0a1628]">Asks &amp; Offers</h2>
              <p className="text-sm text-[#8a7f70] mt-0.5">
                Concrete asks alumni are working on. Concrete offers alumni can give. Reply privately.
              </p>
            </div>
            <Link
              href="/career-room/post"
              data-testid="post-career-cta"
              className="inline-flex items-center gap-1.5 bg-[#0a1628] hover:bg-[#112240] text-white text-[12px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Post
            </Link>
          </div>

          {careerPosts.length === 0 ? (
            <div
              className="mt-5 bg-white border border-dashed border-[rgba(180,168,150,0.5)] rounded-xl p-8 text-center"
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.04)' }}
            >
              <p
                className="text-[#0a1628] text-base font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                The floor is open.
              </p>
              <p className="text-[13px] text-[#8a7f70] mt-2 max-w-md mx-auto">
                Post a specific ask (&ldquo;Warm intro to PE associate in NYC&rdquo;) or a specific
                offer (&ldquo;Can intro 1 alum/month to MDs at Centerview&rdquo;). The first post
                sets the tone.
              </p>
              <Link
                href="/career-room/post"
                className="inline-block mt-5 bg-[#0a1628] hover:bg-[#112240] text-white text-[12px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
              >
                Drop the first one
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
              {/* Asks column */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#990000]">
                    Asks
                  </p>
                  <span className="text-[10.5px] text-[#8a7f70]">
                    {asks.length} open
                  </span>
                </div>
                {asks.length === 0 ? (
                  <p className="text-[12.5px] text-[#8a7f70] italic">No open asks right now.</p>
                ) : (
                  <div className="space-y-4">
                    {asks.map(p => <PostCard key={p.id} post={p} />)}
                  </div>
                )}
              </div>

              {/* Offers column */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d6a4f]">
                    Offers
                  </p>
                  <span className="text-[10.5px] text-[#8a7f70]">
                    {offers.length} open
                  </span>
                </div>
                {offers.length === 0 ? (
                  <p className="text-[12.5px] text-[#8a7f70] italic">No open offers right now.</p>
                ) : (
                  <div className="space-y-4">
                    {offers.map(p => <PostCard key={p.id} post={p} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Explore by Industry */}
        <section>
          <h2 className="text-base font-semibold text-[#0a1628] mb-1">Explore by Industry</h2>
          <p className="text-sm text-[#8a7f70] mb-6">Browse alumni by their field.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {INDUSTRIES.map(ind => (
              <Link
                key={ind.slug}
                href={`/member-book?industry=${ind.slug}`}
                className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow group"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <span className="w-8 h-8 rounded-lg bg-[#0a1628] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {ind.initial}
                </span>
                <p className="text-xs font-medium text-[#0a1628] leading-snug">{ind.label}</p>
                <span className="text-xs text-[#990000] group-hover:underline mt-auto">Browse &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Open to Mentorship */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Mentorship</h2>
            {openToMentorship.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToMentorship.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who have offered to mentor current players.
          </p>
          {openToMentorship.length === 0 ? (
            <EmptyState label="This list grows as alumni open up their network." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToMentorship.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Open to Warm Introductions */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Warm Introductions</h2>
            {openToIntros.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToIntros.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni who can connect you with someone in their network.
          </p>
          {openToIntros.length === 0 ? (
            <EmptyState label="This list grows as alumni open up their network." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToIntros.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>

        {/* Open to Coffee */}
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-base font-semibold text-[#0a1628]">Open to Coffee</h2>
            {openToCoffee.length > 0 && (
              <span className="text-xs font-medium text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {openToCoffee.length} available
              </span>
            )}
          </div>
          <p className="text-sm text-[#8a7f70] mb-6">
            Alumni open to an informal chat over coffee.
          </p>
          {openToCoffee.length === 0 ? (
            <EmptyState label="This list grows as alumni open up their network." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openToCoffee.map(entry => (
                <AlumniCard key={entry.person.id} entry={entry} />
              ))}
            </div>
          )}
        </section>


        {/* CTA */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <div>
            <p className="font-semibold text-[#0a1628] text-sm">Looking for someone in a specific field?</p>
            <p className="text-xs text-[#8a7f70] mt-0.5">Browse the Member Book to find Penn Golf alumni by era or hometown.</p>
          </div>
          <Link
            href="/member-book"
            className="text-sm font-semibold text-[#990000] hover:underline whitespace-nowrap"
          >
            Open the Member Book &rarr;
          </Link>
        </div>

      </div>
    </div>
  )
}
