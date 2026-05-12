import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OutreachPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/player/outreach/${id}`)
}
