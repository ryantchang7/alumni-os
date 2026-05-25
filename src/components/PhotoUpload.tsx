'use client'

import { useRef, useState } from 'react'
import { Upload, ImageIcon } from 'lucide-react'

interface Props {
  /** Current photo URL (may be empty). */
  value: string
  onChange: (url: string) => void
  /** Display label above the upload row. */
  label?: string
  /** Aspect ratio for the preview. 'square' for profile, 'wide' for moments. */
  shape?: 'square' | 'wide'
}

/**
 * Photo upload with built-in file picker + preview + "paste a URL" fallback.
 * On mobile, the file picker pulls up the camera roll / camera directly.
 *
 * Uploads to /api/upload/image (Vercel Blob). If the backend returns 503
 * (Blob not configured), the user falls back to pasting a URL — the
 * URL field stays editable either way.
 */
export default function PhotoUpload({
  value,
  onChange,
  label = 'Photo',
  shape = 'square',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={() => setError("Couldn't load that image URL.")}
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-[#8a7f70]" />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-[200px] space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
          </button>
          <p className="text-[11px] text-[#8a7f70]">
            JPEG / PNG / HEIC, up to 8 MB. Or paste a URL below.
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
    </div>
  )
}
