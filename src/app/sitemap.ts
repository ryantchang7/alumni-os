import type { MetadataRoute } from 'next'

const BASE = 'https://penngolfclubhouse.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '',
    '/launch',
    '/scotland',
    '/member-book',
    '/member-map',
    '/moments',
    '/team-room',
    '/team/travel',
    '/meet-the-team',
    '/hall-of-fame',
    '/the-course',
    '/19th-hole',
    '/career-room',
    '/support',
    '/spotlight',
    '/parent-signup',
    '/legal',
    '/privacy',
    '/terms',
  ]
  return pages.map(p => ({ url: BASE + p, changeFrequency: 'weekly' as const }))
}
