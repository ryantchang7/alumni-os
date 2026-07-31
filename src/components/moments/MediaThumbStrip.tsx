'use client'

/**
 * MediaThumbStrip — reorderable thumbnails for a moment's photos/videos.
 * Drag to reorder on desktop; ‹ › arrows cover touch (HTML5 DnD doesn't
 * fire on mobile). First item is the cover (photoUrl mirror + feed card).
 * Shared by the composer (/moments/new) and MomentCard's edit mode.
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  items: { url: string; type: 'image' | 'video' }[]
  onChange: (next: { url: string; type: 'image' | 'video' }[]) => void
}

export default function MediaThumbStrip({ items, onChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((m, i) => (
          <div
            key={`${m.url}-${i}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              e.preventDefault()
              setOverIdx(i)
            }}
            onDragLeave={() => setOverIdx(cur => (cur === i ? null : cur))}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIdx !== null) move(dragIdx, i)
              setDragIdx(null)
              setOverIdx(null)
            }}
            onDragEnd={() => {
              setDragIdx(null)
              setOverIdx(null)
            }}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border bg-[#fdfcf9] cursor-grab active:cursor-grabbing transition-shadow ${
              overIdx === i && dragIdx !== null && dragIdx !== i
                ? 'border-[#c8a84b] ring-2 ring-[#c8a84b]/50'
                : 'border-[rgba(180,168,150,0.5)]'
            } ${dragIdx === i ? 'opacity-40' : ''}`}
          >
            {m.type === 'video' ? (
              <video src={m.url} muted playsInline preload="metadata" className="w-full h-full object-cover pointer-events-none" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" draggable={false} className="w-full h-full object-cover" />
            )}
            {i === 0 && items.length > 1 && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#c8a84b] text-[#0a1628] text-[8.5px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full pointer-events-none">
                Cover
              </span>
            )}
            <button
              type="button"
              aria-label="Remove this photo or video"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-[#990000] text-white text-[11px] leading-none flex items-center justify-center"
            >
              &times;
            </button>
            {i > 0 && (
              <button
                type="button"
                aria-label="Move earlier"
                onClick={() => move(i, i - 1)}
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 hover:bg-[#0a1628] text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {i < items.length - 1 && (
              <button
                type="button"
                aria-label="Move later"
                onClick={() => move(i, i + 1)}
                className="absolute top-1 left-7 w-5 h-5 rounded-full bg-black/70 hover:bg-[#0a1628] text-white flex items-center justify-center"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <p className="text-[10.5px] text-ink-muted mt-1.5">
          Drag (or use the arrows) to reorder. The first one is the cover.
        </p>
      )}
    </div>
  )
}
