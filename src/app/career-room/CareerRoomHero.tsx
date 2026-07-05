'use client'

import { useSiteContent } from '@/lib/site-content/use-site-content'
import SectionEmblemHeader from '@/components/SectionEmblemHeader'

/**
 * Hero for /career-room — uses the shared framed-emblem header so every
 * section reads the same. The Career Room emblem sits beside the title.
 */
export default function CareerRoomHero() {
  const heroBlurb = useSiteContent(
    'career-room.hero-blurb',
    'Find Penn Golf members by industry, company, and experience. Ask questions, get thoughtful advice, and help the next player when it’s your turn.',
  )

  return (
    <SectionEmblemHeader
      eyebrow="Penn Men's Golf · Advice & Introductions"
      title="Career Room"
      subtitle={heroBlurb}
      emblemSrc="/emblems/career-room.png"
      emblemAlt="Penn Golf career room emblem"
    />
  )
}
