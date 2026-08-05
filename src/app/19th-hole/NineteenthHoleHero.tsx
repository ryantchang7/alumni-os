'use client'

import { useSiteContent } from '@/lib/site-content/use-site-content'
import SectionEmblemHeader from '@/components/SectionEmblemHeader'

/**
 * Hero for /19th-hole — uses the shared framed-emblem header so every
 * section reads the same. The 19th Hole emblem sits beside the title.
 */
export default function NineteenthHoleHero() {
  const heroBlurb = useSiteContent(
    '19th-hole.hero-blurb',
    'Coffee, dinners, and signature Penn Golf gatherings, wherever you are.',
  )

  return (
    <SectionEmblemHeader
      eyebrow="Penn Men's Golf · After the Round"
      title="The 19th Hole"
      subtitle={heroBlurb}
      emblemSrc="/emblems/19th-hole.png"
      emblemAlt="Penn Golf 19th hole emblem"
    />
  )
}
