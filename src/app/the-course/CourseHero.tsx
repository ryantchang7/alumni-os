'use client'

/**
 * The Course hero — the shared framed-emblem header, for consistency with
 * every other section. Previously a 3-stage interactive tee-sheet flow;
 * that round-picking is already available in the sections below (Tee Times
 * + Open to a Round), so the header now just leads with the emblem + the
 * two primary actions.
 */

import Link from 'next/link'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import SectionEmblemHeader from '@/components/SectionEmblemHeader'

export default function CourseHero() {
  const heroBlurb = useSiteContent(
    'the-course.hero-blurb',
    'A place for Penn Golf members to host rounds, join foursomes, share home courses, and stay connected through the game.',
  )
  const findCta = useSiteContent('the-course.stage-tee-cta', 'Find a Round')
  const hostCta = useSiteContent('the-course.stage-tee-secondary', 'Host a Round')

  return (
    <SectionEmblemHeader
      eyebrow="Penn Men's Golf · The Tee Sheet"
      title="The Course"
      subtitle={heroBlurb}
      emblemSrc="/emblems/course.png"
      emblemAlt="Penn Golf course emblem"
      maxWidth="1180px"
    >
      <div className="flex flex-wrap gap-3">
        <a
          href="#rounds-section"
          className="bg-[#2d6a4f] hover:bg-[#3a8060] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
        >
          {findCta}
        </a>
        <Link
          href="/the-course/host"
          className="bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/[0.06] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors"
        >
          {hostCta}
        </Link>
      </div>
    </SectionEmblemHeader>
  )
}
