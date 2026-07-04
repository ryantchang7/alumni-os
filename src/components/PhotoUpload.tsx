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
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const captureRef = useRef<HTMLInputElement>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVideoValue = !!value && VIDEO_EXT_RE.test(value)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/image', { method: 'POST', body: form })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j.error ?? `Upload failed (${res.status})`)
      }
      onChange(j.url as string)
      if (j.mediaType && onMediaTypeChange) {
        onMediaTypeChange(j.mediaType as 'image' | 'video')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
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
      <label className="block text-xs font-medium text-[#4a5568]">{label}</label>

      <div className="flex items-start gap-4 flex-wrap">
        {/* Preview */}
        <div
          className={`${previewClass} rounded-lg overflow-hidden bg-[#faf7f2] border border-dashed border-[rgba(180,168,150,0.55)] flex items-center justify-center`}
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
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFilePicked(f)
            }}
          />
          {/* Separate input with `capture` so mobile opens the camera directly.
             On desktop `capture` is ignored and this falls back to the file
             dialog — harmless. */}
          <input
            ref={captureRef}
            type="file"
            accept={allowVideo ? 'image/*,video/*' : 'image/*'}
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFilePicked(f)
            }}
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
                ? 'Uploading…'
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
            {allowVideo
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
