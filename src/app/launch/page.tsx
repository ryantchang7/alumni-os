/**
 * Public launch page — the URL in the alumni email. Server component so the
 * film is in the initial HTML; the animated body stays a client component.
 */

import { getSiteContentOrDefault } from '@/lib/site-content/read'
import LaunchClient from './LaunchClient'
import LaunchFilm from './LaunchFilm'

export const revalidate = 60

export default async function LaunchPage() {
  const [url, poster] = await Promise.all([
    getSiteContentOrDefault('launch.video-url'),
    getSiteContentOrDefault('launch.video-poster'),
  ])
  return <LaunchClient film={<LaunchFilm url={url} poster={poster} />} />
}
