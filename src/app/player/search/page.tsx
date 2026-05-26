import { redirect } from 'next/navigation'

// Old "Member Book" prototype — superseded by /member-book. Hard redirect.
export default function PlayerSearchRedirect() {
  redirect('/member-book')
}
