import { redirect } from 'next/navigation'

// /events merged into /19th-hole. Hard redirect.
export default function EventsRedirect() {
  redirect('/19th-hole')
}
