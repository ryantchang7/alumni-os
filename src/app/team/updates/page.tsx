import { redirect } from 'next/navigation'

// The Season hub on the Team Room absorbed this page — one living place
// for schedule + updates. Old links and notification hrefs land there.
export default function TeamUpdatesRedirect() {
  redirect('/team-room')
}
