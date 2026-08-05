import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubhouse',
  description: 'The Penn Golf Clubhouse, home base for the family.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
