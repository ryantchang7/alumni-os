/**
 * Image upload endpoint backed by Vercel Blob. Members (signed in) can
 * upload a profile photo or a Moment photo. Returns the permanent public
 * URL of the stored blob.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var. Without it the route 503s with
 * a clear message so the UI can fall back to "paste a URL."
 */

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accountId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Image uploads not configured yet — paste a URL instead.' },
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type (${file.type}). Try JPEG, PNG, WebP, or HEIC.` },
      { status: 415 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Too big (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 8 MB.` },
      { status: 413 },
    )
  }

  // Filename scoped per-account to avoid collisions; Vercel Blob adds a
  // random suffix anyway with addRandomSuffix=true.
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeName = `${session.accountId}/${Date.now()}.${ext}`

  try {
    const blob = await put(safeName, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[upload/image] put failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
