'use client'

import { useRef, useState } from 'react'
import { Upload, ImageIcon, Camera } from 'lucide-react'
import PhotoCropper from './PhotoCropper'

interface Props {
  /** Current photo URL (may be empty). */
  value: string
  onChange: (url: string) => void
  /** Display label above the upload row. */
  label?: string
  /** Aspect ratio for the preview + crop. 'square' for profile, 'wide' for moments. */
  shape?: 'square' | 'wide'
  /** If true, also accept video files (.mp4/.mov/.webm). Skips the cropper
   * for videos and uploads them raw. Defaults to false (image-only). */
  allowVideo?: boolean
  /** Notified when the picker resolves a media type ('image' | 'video'). */
  onMediaTypeChange?: (mediaType: 'image' | 'video') => void
  /** If true, skip the cropper entirely and upload the raw image. Useful for
   * pre-designed artwork (badges, logos) where the cropper's fixed aspect
   * ratio would distort the source. */
  skipCropper?: boolean
  /** If true, the picker accepts many files at once (and drag & drop), all
   * uploaded in parallel — onChange fires once per uploaded URL, in pick
   * order. Skips the cropper (images are auto-downscaled client-side). */
  multiple?: boolean
  /** Cap on how many files one batch may add (multiple mode). Extra picks
   * are dropped with a note. */
  maxFiles?: number
}

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i

/**
 * Photo upload with built-in file picker + crop modal + preview +
 * "paste a URL" fallback. On mobile, the file picker pulls up the
 * camera roll / camera directly.
 *
 * Flow: pick file → crop modal (drag + zoom) → upload cropped JPEG →
 * URL stored in `value`. URL paste field stays editable as a fallback.
 */
export default function PhotoUpload({
  value,
  onChange,
  label = 'Photo',
  shape = 'square',
  allowVideo = false,
  onMediaTypeChange,
  skipCropper = false,
  multiple = false,
  maxFiles,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const captureRef = useRef<HTMLInputElement>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isVideoValue = !!value && VIDEO_EXT_RE.test(value)

  async function postFile(file: File): Promise<{ url: string; mediaType?: 'image' | 'video' }> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload/image', { method: 'POST', body: form })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(j.error ?? `Upload failed (${res.status})`)
    }
    return { url: j.url as string, mediaType: j.mediaType as 'image' | 'video' | undefined }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const { url, mediaType } = await postFile(file)
      onChange(url)
      if (mediaType && onMediaTypeChange) onMediaTypeChange(mediaType)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  /** Shrink a big photo client-side before uploading (max edge 2000px,
   * JPEG q0.85) — batch picks skip the cropper, and raw 8 MB phone shots
   * would make uploads AND the feed slow. Falls back to the original file
   * when the browser can't decode it (e.g. HEIC on Chrome). */
  async function downscaleImage(file: File): Promise<File> {
    try {
      const bmp = await createImageBitmap(file)
      const MAX_EDGE = 2000
      const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
      if (scale === 1 && file.type === 'image/jpeg' && file.size <= 2.5 * 1024 * 1024) {
        bmp.close()
        return file
      }
      const w = Math.max(1, Math.round(bmp.width * scale))
      const h = Math.max(1, Math.round(bmp.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return file
      ctx.drawImage(bmp, 0, 0, w, h)
      bmp.close()
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      )
      if (!blob) return file
      return new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
    } catch {
      return file
    }
  }

  async function uploadBatch(files: File[]) {
    const accepted = files.filter(
      f => f.type.startsWith('image/') || (allowVideo && f.type.startsWith('video/')),
    )
    if (accepted.length === 0) return
    const cap = maxFiles !== undefined ? Math.max(0, maxFiles) : accepted.length
    const batch = accepted.slice(0, cap)
    if (batch.length === 0) {
      setError('This moment is full, remove something first (max 8).')
      return
    }
    setError(accepted.length > batch.length ? `Only the first ${batch.length} fit (max 8 per moment).` : null)
    setUploading(true)
    setProgress({ done: 0, total: batch.length })
    try {
      const prepared = await Promise.all(
        batch.map(f => (f.type.startsWith('video/') ? Promise.resolve(f) : downscaleImage(f))),
      )
      const results = await Promise.all(
        prepared.map(async (f) => {
          try {
            const r = await postFile(f)
            setProgress(p => (p ? { ...p, done: p.done + 1 } : p))
            return { ...r, err: null as string | null }
          } catch (e) {
            setProgress(p => (p ? { ...p, done: p.done + 1 } : p))
            return { url: '', mediaType: undefined, err: e instanceof Error ? e.message : 'Upload failed' }
          }
        }),
      )
      // Hand URLs to the caller in pick order so the strip matches the picker.
      for (const r of results) {
        if (r.url) {
          onChange(r.url)
          if (r.mediaType && onMediaTypeChange) onMediaTypeChange(r.mediaType)
        }
      }
      const failed = results.filter(r => r.err)
      if (failed.length > 0) {
        setError(`${failed.length} of ${results.length} failed. ${failed[0].err}`)
      }
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  function onFilesPicked(files: File[]) {
    if (files.length === 0) return
    if (multiple) {
      void uploadBatch(files)
      clearInputs()
      return
    }
    onFilePicked(files[0])
  }

  function onFilePicked(file: File) {
    setError(null)
    if (file.type.startsWith('video/') || skipCropper) {
      // Skip the cropper — upload raw. Used for videos always, and for
      // pre-designed artwork (badges/logos) when skipCropper is set.
      void uploadFile(file)
      clearInputs()
      onMediaTypeChange?.(file.type.startsWith('video/') ? 'video' : 'image')
      return
    }
    setPickedFile(file)
  }

  function clearInputs() {
    if (fileRef.current) fileRef.current.value = ''
    if (captureRef.current) captureRef.current.value = ''
  }

  async function onCropComplete(blob: Blob) {
    // Honor the cropper's chosen MIME so transparent PNGs (badges, logos)
    // stay PNG instead of getting flattened to JPEG with a black bg.
    const isPng = blob.type === 'image/png'
    const ext = isPng ? 'png' : 'jpg'
    const mime = isPng ? 'image/png' : 'image/jpeg'
    const filename = `crop-${Date.now()}.${ext}`
    setPickedFile(null)
    const file = new File([blob], filename, { type: mime })
    await uploadFile(file)
    clearInputs()
    onMediaTypeChange?.('image')
  }

  function onCropCancel() {
    setPickedFile(null)
    clearInputs()
  }

  const previewClass =
    shape === 'wide'
      ? 'aspect-[3/2] w-full max-w-sm'
      : 'aspect-square w-32'

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#3a4657]">{label}</label>

      <div
        className="flex items-start gap-4 flex-wrap"
        onDragOver={multiple ? (e) => e.preventDefault() : undefined}
        onDrop={
          multiple
            ? (e) => {
                e.preventDefault()
                onFilesPicked(Array.from(e.dataTransfer.files))
              }
            : undefined
        }
      >
        {/* Preview (doubles as the drop target in multiple mode) */}
        <div
          className={`${previewClass} rounded-lg overflow-hidden bg-[#fdfcf9] border border-dashed border-[rgba(180,168,150,0.55)] flex items-center justify-center`}
        >
          {value ? (
            isVideoValue ? (
              <video
                src={value}
                controls
                playsInline
                className="w-full h-full object-cover bg-black"
                onError={() => setError("Couldn't load that video URL.")}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="preview"
                className="w-full h-full object-cover"
                onError={() => setError("Couldn't load that image URL.")}
              />
            )
          ) : (
            <ImageIcon className="w-8 h-8 text-ink-muted" />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-[200px] space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={allowVideo ? 'image/*,video/*' : 'image/*'}
            multiple={multiple}
            className="hidden"
            onChange={(e) => onFilesPicked(Array.from(e.target.files ?? []))}
          />
          {/* Separate input with `capture` so mobile opens the camera directly.
             On desktop `capture` is ignored and this falls back to the file
             dialog, harmless. */}
          <input
            ref={captureRef}
            type="file"
            accept={allowVideo ? 'image/*,video/*' : 'image/*'}
            capture="environment"
            className="hidden"
            onChange={(e) => onFilesPicked(Array.from(e.target.files ?? []))}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading
                ? progress
                  ? `Uploading ${progress.done}/${progress.total}…`
                  : 'Uploading…'
                : multiple
                  ? allowVideo
                    ? 'Upload photos or videos'
                    : 'Upload photos'
                  : value
                    ? allowVideo
                      ? 'Replace media'
                      : 'Replace photo'
                    : allowVideo
                      ? 'Upload photo or video'
                      : 'Upload photo'}
            </button>
            <button
              type="button"
              onClick={() => captureRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-white border border-[#0a1628]/25 hover:border-[#0a1628] text-[#0a1628] text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {allowVideo ? 'Take photo or video' : 'Take photo'}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted">
            {multiple
              ? 'Pick several at once, or drag & drop them here. Or paste a URL below.'
              : allowVideo
                ? 'Photo or short video clip from your camera roll. Or paste a URL below.'
                : 'Pick from your camera roll, crop it, done. Or paste a URL below.'}
          </p>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="w-full border border-[rgba(180,168,150,0.5)] rounded-lg px-3 py-2 text-[12.5px] text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20"
          />
          {error && (
            <p className="text-[12px] text-[#990000]">{error}</p>
          )}
        </div>
      </div>

      {pickedFile && (
        <PhotoCropper
          file={pickedFile}
          shape={shape}
          onComplete={onCropComplete}
          onCancel={onCropCancel}
        />
      )}
    </div>
  )
}
