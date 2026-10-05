/**
 * Who is allowed to put media on the site.
 *
 * Shared by the two upload paths so they cannot drift: the server route at
 * /api/upload/image, which takes small images through the function, and the
 * token route at /api/upload/blob-token, which authorises the browser to
 * send a video straight to Blob. A rule that lived in only one of them would
 * be a hole in the other.
 */

import { auth } from '@/auth'
import { FOUNDER_EMAILS } from '@/lib/badges'
import { isCaptainEmailWithOverrides } from '@/lib/captains-runtime'
import { readStore } from '@/lib/store/local-store'

export interface UploadGate {
  ok: boolean
  status: number
  error?: string
  accountId?: string
}

/**
 * Approved members only. Anyone can create a Google account, and an
 * unapproved stranger has nothing legitimate to upload. Founders and
 * captains are authorised by email allowlist and may not have claimed a
 * card, so they bypass the linked check.
 */
export async function authorizeUpload(): Promise<UploadGate> {
  const session = await auth()
  if (!session?.accountId) {
    return { ok: false, status: 401, error: 'Sign in required' }
  }
  const email = (session.user?.email ?? '').toLowerCase().trim()
  const isStaff =
    FOUNDER_EMAILS.has(email) ||
    isCaptainEmailWithOverrides(email, 'penn-mens-golf', (await readStore()).accounts)
  if (!session.linkedPersonId && !isStaff) {
    return {
      ok: false,
      status: 403,
      error: 'Approved members only, claim your card first.',
    }
  }
  return { ok: true, status: 200, accountId: session.accountId }
}

/** Media types the Clubhouse will store. */
export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const

export const VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
] as const

/**
 * Ceiling for a browser-to-Blob upload. Blob itself allows far more, but a
 * phone clip worth posting is seconds long, and a cap keeps a mistake from
 * becoming a bill.
 */
export const MAX_DIRECT_BYTES = 200 * 1024 * 1024
