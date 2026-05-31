/**
 * Founder-only page gate. Returns silently (the page renders) when the
 * viewer is in FOUNDER_EMAILS. Throws Next's `notFound()` otherwise,
 * so non-founders get a regular 404 — the existence of /internal/* is
 * invisible.
 *
 * Use at the top of every server-component page under /internal/*.
 *
 * If the viewer isn't signed in at all, this still throws notFound()
 * instead of redirecting to /login. We don't want unsigned visitors to
 * learn that a sign-in could unlock something at this URL.
 */

import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'

export async function requireFounderOr404(): Promise<void> {
  const session = await auth()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  if (!email || !FOUNDER_EMAILS.has(email)) {
    notFound()
  }
}
