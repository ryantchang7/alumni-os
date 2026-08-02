import SupportClient from './SupportClient'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Back the program — support Penn Golf.',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function SupportPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <SupportClient status={params.status} />
}
