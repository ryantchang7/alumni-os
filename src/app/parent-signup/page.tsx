/**
 * Kept as an alias of /join. The family door was the only non-roster door
 * for a year, so this path is sitting in sent emails, texts and the launch
 * film's companion page. It renders the same broadened form.
 */

import type { Metadata } from 'next'
import JoinForm from '@/components/JoinForm'

export const metadata: Metadata = {
  title: 'Join the Clubhouse',
  description:
    'Penn alumni and students who play golf, plus the families and friends of the program.',
}

export default function ParentSignupPage() {
  return <JoinForm />
}
