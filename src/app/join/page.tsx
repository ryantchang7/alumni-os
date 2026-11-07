import type { Metadata } from 'next'
import JoinForm from '@/components/JoinForm'

export const metadata: Metadata = {
  title: 'Join the Clubhouse',
  description:
    'Penn alumni and students who play golf, plus the families and friends of the program. You do not have to have played for Penn.',
}

export default function JoinPage() {
  return <JoinForm />
}
