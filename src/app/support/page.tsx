import SupportClient from './SupportClient'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function SupportPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <SupportClient status={params.status} />
}
