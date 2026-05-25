import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isCaptain } from '@/lib/captains'
import AddMemberForm from './AddMemberForm'

const TEAM_SLUG = 'penn-mens-golf'

export default async function AddMemberPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login?next=/internal/add-member')
  }
  if (!isCaptain(session.user.email, TEAM_SLUG)) {
    return (
      <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-10">
          <h1
            className="text-[#0a1628] text-2xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Captains only.
          </h1>
        </div>
      </div>
    )
  }

  return <AddMemberForm />
}
