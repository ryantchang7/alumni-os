import type { Metadata } from 'next'

// /launch/page.tsx is a client component, so its metadata lives here. This is
// the URL the alumni email and texts point at — the title/description pair is
// what unfurls beside the opengraph-image card.
export const metadata: Metadata = {
  title: 'Watch the film',
  description:
    "The Penn Golf Clubhouse, a private network for everyone who carried the Penn Golf bag. Watch the 3-minute film, then claim your member card.",
}

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return children
}
