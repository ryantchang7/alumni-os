'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { X } from 'lucide-react'

interface Props {
  file: File
  /** 'square' for profile photos, 'wide' for moments (3:2). */
  shape?: 'square' | 'wide'
  /** Called when the user confirms the crop. Returns a Blob whose type
   *  matches the source (PNG stays PNG to preserve transparency). */
  onComplete: (blob: Blob) => void
  /** Called on dismiss. */
  onCancel: () => void
}

/**
 * Modal that lets the user drag + zoom to crop the picked image before
 * upload. Returns the cropped portion as a JPEG Blob.
 */
export default function PhotoCropper({ file, shape = 'square', onComplete, onCancel }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null)
  const [working, setWorking] = useState(false)

  const aspect = shape === 'wide' ? 3 / 2 : 1
  const outputW = shape === 'wide' ? 1200 : 800
  const outputH = shape === 'wide' ? 800 : 800

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => {
      setSrc(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }, [file])

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCroppedAreaPx(areaPx)
  }, [])

  // Preserve PNG so transparent badges/logos don't get a black background
  // baked in when JPEG fills empty pixels.
  const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

  async function handleConfirm() {
    if (!src || !croppedAreaPx) return
    setWorking(true)
    try {
      const blob = await cropToBlob(src, croppedAreaPx, outputW, outputH, outputMime)
      onComplete(blob)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 bg-[#0a1628]/85 flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(180,168,150,0.35)] bg-[#faf7f2]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70]">
            Crop your photo
          </p>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-[#8a7f70] hover:text-[#0a1628] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-[#0a1628]" style={{ height: 360 }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="contain"
            />
          )}
        </div>

        <div className="px-5 py-3 border-b border-[rgba(180,168,150,0.35)]">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7f70] mb-1.5">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#0a1628]"
          />
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-[12px] text-[#8a7f70] hover:text-[#0a1628] px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={working || !croppedAreaPx}
            className="bg-[#0a1628] hover:bg-[#112240] text-white text-[12.5px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {working ? 'Working…' : 'Use this crop'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Reads the source data URL into an Image, draws the cropped region
 * onto a canvas sized for the target shape, and returns a Blob in the
 * requested format (PNG preserves transparency, JPEG is smaller).
 */
function cropToBlob(
  src: string,
  area: Area,
  outW: number,
  outH: number,
  mime: 'image/png' | 'image/jpeg',
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error('Image load failed'))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        outW,
        outH,
      )
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        mime,
        mime === 'image/jpeg' ? 0.9 : undefined,
      )
    }
    img.src = src
  })
}
