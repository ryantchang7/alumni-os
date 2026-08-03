/**
 * Media upload endpoint backed by Vercel Blob. Members (signed in) can
 * upload an image (profile photo, Moment photo) OR a video clip (Moment
 * video). Returns the permanent public URL of the stored blob plus the
 * resolved mediaType so the client knows what it just uploaded.
 *
 * NOTE: Vercel serverless function body size caps server-side uploads
 * around 4.5 MB on Hobby and Pro by default. That's enough for cropped
 * JPEGs and short compressed phone videos, but anything bigger needs the
 * client-side direct upload pattern (`@vercel/blob/client`'s
 * `handleUpload`). Out of scope for now — the route returns a clear 413
 * if a user hits the limit.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var. Without it the route 503s with
 * a clear message so the UI can fall back to "paste a URL."
 */

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])
const VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
])

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 // 4 MB (Vercel function body cap)

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  // Approved members only — anyone can create a Google account, and an
  // unapproved stranger has nothing legitimate to upload.
  if (!session.linkedPersonId) {
    return NextResponse.json(
      { error: 'Approved members only — claim your card first.' },
      { status: 403 },
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Media uploads not configured yet — paste a URL instead.' },
      { status: 503 },
    )
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Multipart form-data required' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file in "file" field' }, { status: 400 })
  }

  const isImage = IMAGE_TYPES.has(file.type)
  const isVideo = VIDEO_TYPES.has(file.type)
  if (!isImage && !isVideo) {
    return NextResponse.json(
      {
        error: `Unsupported file type (${file.type}). Images: JPEG/PNG/WebP/HEIC. Videos: MP4/MOV/WebM.`,
      },
      { status: 415 },
    )
  }

  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > limit) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    const max = (limit / 1024 / 1024).toFixed(0)
    return NextResponse.json(
      {
        error: isVideo
          ? `Video too big (${mb} MB). Max ${max} MB — try a shorter clip.`
          : `Image too big (${mb} MB). Max ${max} MB.`,
      },
      { status: 413 },
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg')
  const safeName = `${session.accountId}/${Date.now()}.${ext}`

  try {
    const blob = await put(safeName, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return NextResponse.json({
      url: blob.url,
      mediaType: isVideo ? 'video' : 'image',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[upload/image] put failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
