import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isCaptain } from '@/lib/captains'
import StudioClient from './StudioClient'

const TEAM_SLUG = 'penn-mens-golf'

export default async function StudioPage() {
  const session = await auth()
  if (!isCaptain(session?.user?.email, TEAM_SLUG)) {
    redirect('/login?next=/internal/studio')
  }
  return <StudioClient />
}
