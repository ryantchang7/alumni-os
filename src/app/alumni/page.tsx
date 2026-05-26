// /alumni now redirects into the account flow. The old picker is gone —
// people land here when they want to manage themselves.

import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function AlumniIndexRedirect() {
  const session = await auth()
  if (!session) {
    redirect('/login?next=/account/profile')
  }
  if (!session.linkedPersonId) {
    redirect('/account/setup')
  }
  redirect('/account/profile')
}
