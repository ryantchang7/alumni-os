import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Member Book',
  description: 'Every Penn golfer, 1930 to today — the Member Book.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
