import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import AddMemberForm from './AddMemberForm'

export default async function AddMemberPage() {
  await requireFounderOr404()
  return <AddMemberForm />
}
