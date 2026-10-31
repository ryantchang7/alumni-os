'use client'

/**
 * The photography layer for /scotland.
 *
 * One provider wraps the whole article so that every photograph on the
 * page, wherever it sits in the layout, opens into the same full-screen
 * viewer and arrows through the week in narrative order. There was no
 * lightbox in this codebase to reuse and no reason to add a dependency for
 * one: this is ~80 lines of it, keyboard-driven, scroll-locked, and it
 * returns focus to the photo you came from.
 *
 * Three ways to place a photo:
 *   <Plate>   natural aspect ratio, in the flow of the column
 *   <Band>    full-bleed, cropped to a fixed aspect, a pause between chapters
 *   <ContactSheet>  all nine at the foot of the page
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { fadeUp, revealViewport } from '@/lib/motion'
import { SCOTLAND_PHOTOS, photo } from '@/lib/scotland/photos'

const ViewerContext = createContext<((id: string) => void) | null>(null)

function useOpenViewer() {
  return useContext(ViewerContext)
}

/* ---------------------------------------------------------------- caption */

function Caption({ id, align = 'left' }: { id: string; align?: 'left' | 'center' }) {
  const p = photo(id)
  return (
    <figcaption
      className={`mt-3 flex gap-2.5 text-[12.5px] leading-relaxed text-ink-muted ${
        align === 'center' ? 'justify-center text-center' : ''
      }`}
    >
      <span aria-hidden className="mt-[7px] h-px w-5 shrink-0 bg-[#c8a84b]" />
      <span className="max-w-[46ch]">{p.caption}</span>
    </figcaption>
  )
}

/* ------------------------------------------------------------- placements */

export function Plate({
  id,
  sizes,
  className = '',
  caption = true,
  rounded = true,
  crop,
  objectPosition,
}: {
  id: string
  sizes: string
  className?: string
  caption?: boolean
  rounded?: boolean
  /**
   * Optional aspect ratio, e.g. "4/5". Two of these frames are more sky
   * than golf course, and at 400px in a column that reads as a grey
   * rectangle. Cropping is kinder to them than shrinking them.
   */
  crop?: string
  /** Where to hold the crop, e.g. "center 72%". Defaults to centre. */
  objectPosition?: string
}) {
  const p = photo(id)
  const open = useOpenViewer()
  const art = crop ? (
    <span className="relative block w-full" style={{ aspectRatio: crop }}>
      <Image
        src={p.src}
        alt={p.alt}
        fill
        sizes={sizes}
        placeholder="blur"
        blurDataURL={p.blurDataURL}
        style={objectPosition ? { objectPosition } : undefined}
        className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.012]"
      />
    </span>
  ) : (
    <Image
      src={p.src}
      alt={p.alt}
      width={p.width}
      height={p.height}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={p.blurDataURL}
      className="h-auto w-full transition-transform duration-[600ms] ease-out group-hover:scale-[1.012]"
    />
  )
  return (
    <motion.figure
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      className={className}
    >
      <button
        type="button"
        onClick={() => open?.(id)}
        aria-label={`View larger: ${p.caption}`}
        className={`group block w-full cursor-zoom-in overflow-hidden border border-[rgba(180,168,150,0.45)] bg-[#ede9e3] ${
          rounded ? 'rounded-xl' : ''
        }`}
      >
        {art}
      </button>
      {caption && <Caption id={id} />}
    </motion.figure>
  )
}

export function Band({
  id,
  sizes,
  aspect,
  caption = true,
}: {
  id: string
  sizes: string
  /** Tailwind aspect value, e.g. "16/7". Mobile falls back to 4/3. */
  aspect: string
  caption?: boolean
}) {
  const p = photo(id)
  const open = useOpenViewer()
  return (
    <figure>
      <button
        type="button"
        onClick={() => open?.(id)}
        aria-label={`View larger: ${p.caption}`}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-[#0a1628] sm:aspect-[var(--band-aspect)]"
        style={{ '--band-aspect': aspect } as React.CSSProperties}
      >
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={p.blurDataURL}
          className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.015]"
        />
      </button>
      {caption && (
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Caption id={id} />
        </div>
      )}
    </figure>
  )
}

export function ContactSheet() {
  const open = useOpenViewer()
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5">
      {SCOTLAND_PHOTOS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => open?.(p.id)}
            aria-label={`View larger: ${p.caption}`}
            className="group relative block aspect-[3/2] w-full cursor-zoom-in overflow-hidden rounded-lg border border-[rgba(180,168,150,0.45)] bg-[#ede9e3]"
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 1240px) 400px, (min-width: 640px) 32vw, 48vw"
              placeholder="blur"
              blurDataURL={p.blurDataURL}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1628]/85 to-transparent px-2.5 pt-7 pb-1.5 text-[9.5px] font-semibold tracking-[0.16em] text-white/90 uppercase">
              {p.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------- viewer */

export default function PhotoViewer({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const open = useCallback((id: string) => {
    const i = SCOTLAND_PHOTOS.findIndex((p) => p.id === id)
    if (i < 0) return
    returnTo.current = document.activeElement as HTMLElement | null
    setIndex(i)
  }, [])

  const close = useCallback(() => {
    setIndex(null)
    returnTo.current?.focus?.()
  }, [])

  const step = useCallback((delta: number) => {
    setIndex((i) =>
      i === null ? i : (i + delta + SCOTLAND_PHOTOS.length) % SCOTLAND_PHOTOS.length,
    )
  }, [])

  // Esc / arrows, and hold the page still behind the overlay.
  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [index, close, step])

  const current = index === null ? null : SCOTLAND_PHOTOS[index]

  return (
    <ViewerContext.Provider value={open}>
      {children}
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Scotland photographs"
          className="fixed inset-0 z-[120] flex flex-col bg-[#060e1a]/96 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8a84b] uppercase">
              {current.label} · {(index ?? 0) + 1} / {SCOTLAND_PHOTOS.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={current.id}
              src={current.src}
              alt={current.alt}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={current.blurDataURL}
              className="object-contain px-3 sm:px-14"
            />
          </div>

          <div
            className="flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="rounded-full p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="max-w-[60ch] text-center text-[12.5px] leading-relaxed text-white/70">
              {current.caption}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="rounded-full p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </ViewerContext.Provider>
  )
}
