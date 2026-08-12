/**
 * Upload the launch film + poster to Vercel Blob and print their URLs.
 *
 * Blob is versioned by URL and never overwrites, so each upload gets a fresh
 * address. Nothing on the site changes until those URLs are pasted into the
 * launch.video-url / launch.video-poster slots, which keeps the live film up
 * while a new one is being checked.
 *
 *   BLOB_READ_WRITE_TOKEN=... node scripts/publish-film.mjs <file> <prefix>
 */

import { put } from '@vercel/blob'
import { readFileSync, statSync } from 'fs'
import { basename, extname } from 'path'

const [file, prefix] = process.argv.slice(2)
if (!file || !prefix) {
  console.error('usage: node scripts/publish-film.mjs <file> <blob-prefix>')
  process.exit(1)
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set')
  process.exit(1)
}

const ext = extname(file)
const type = ext === '.mp4' ? 'video/mp4' : ext === '.jpg' ? 'image/jpeg' : 'application/octet-stream'
const size = statSync(file).size
console.log(`uploading ${basename(file)} (${(size / 1024 / 1024).toFixed(1)} MB) as ${prefix}${ext}`)

const blob = await put(`${prefix}${ext}`, readFileSync(file), {
  access: 'public',
  contentType: type,
  addRandomSuffix: true,
  token: process.env.BLOB_READ_WRITE_TOKEN,
})
console.log(blob.url)
