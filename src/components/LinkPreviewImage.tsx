'use client'

import { useState } from 'react'

/**
 * Renders a remote preview image (e.g. a link's Open Graph image) and quietly
 * hides itself if the image fails to load — so a hotlink-blocked or dead URL
 * never shows a broken-image icon. Usable inside server components.
 */
export default function LinkPreviewImage({ src, className }: { src: string; className?: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
    />
  )
}
