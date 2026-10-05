/**
 * Authorises the browser to upload a file straight to Vercel Blob.
 *
 * The ordinary route at /api/upload/image carries the file through a
 * serverless function, and Vercel rejects a request body over about 4.5 MB
 * before that function runs. Photos are downscaled well under it, but a
 * phone video is twenty to fifty megabytes, so video could never post at
 * all: people got an opaque failure after waiting for the upload.
 *
 * Here the file never passes through us. The browser asks for a short-lived
 * token, we check the person is allowed to upload and pin what the token may
 * be used for, and the bytes go browser to Blob.
 *
 * Note: onUploadCompleted does not fire against localhost, since Blob cannot
 * call back to a machine it cannot reach. Nothing here depends on it.
 */

import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import {
  authorizeUpload,
  IMAGE_TYPES,
  VIDEO_TYPES,
  MAX_DIRECT_BYTES,
} from '@/lib/upload/authorize'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Media uploads not configured yet, paste a URL instead.' },
      { status: 503 },
    )
  }

  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const json = await handleUpload({
      body,
      request,
      // Runs before any token is issued, for every single upload. This is
      // the only gate, so it carries the same check the server route uses.
      onBeforeGenerateToken: async () => {
        const gate = await authorizeUpload()
        if (!gate.ok) throw new Error(gate.error ?? 'Not allowed')
        return {
          allowedContentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES],
          maximumSizeInBytes: MAX_DIRECT_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ accountId: gate.accountId }),
        }
      },
    })
    return NextResponse.json(json)
  } catch (e) {
    // A refused upload is a 403, not a 500: the usual cause is someone who
    // has not claimed a card yet.
    const message = e instanceof Error ? e.message : 'Upload not allowed'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
