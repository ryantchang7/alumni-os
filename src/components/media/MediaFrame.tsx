/**
 * A media frame that never crops the subject out.
 *
 * Every photo surface on the site used to be `object-cover` inside a
 * fixed box, which is correct only while every photo is roughly the
 * shape of the box. The first real portrait proved otherwise: Lisette
 * Williamson's championship photo is 830x1792, and in the Clubhouse's
 * 4:3 tile `object-cover` showed a horizontal slice of her waist. The
 * same trap eats event flyers, which are nearly always tall posters.
 *
 * `object-contain` alone fixes the cropping and replaces it with two
 * dead bars, which reads as a mistake rather than a photo. So the whole
 * image is contained, and the leftover space is filled with a scaled,
 * blurred copy of the same image. A landscape photo fills the frame as
 * before and the backdrop never shows; a portrait or a flyer keeps all
 * of itself and sits on a wash of its own colours.
 *
 * Two shapes of frame:
 *   `aspect`    a fixed shape, for grids and cards that must line up.
 *   `maxHeight` the image sets the height, up to a cap, for a feed where
 *               one photo per row can be as tall as it likes.
 * Exactly one of them should be passed.
 */

interface Props {
  src: string
  alt: string
  /** 'video' renders a player; its backdrop is a flat dark field, since
   *  a second decoding <video> just to blur it is not worth the bytes. */
  type?: 'image' | 'video'
  /** CSS aspect-ratio for a fixed-shape frame, e.g. '4 / 3'. */
  aspect?: string
  /** Cap in px for a frame whose height comes from the image. */
  maxHeight?: number
  /** Classes for the outer frame (rounding, border, background). */
  className?: string
  /** Classes for the contained image itself, e.g. a hover transform. */
  imgClassName?: string
  /** Controls belong on a card's clip and not on a silent grid tile. */
  controls?: boolean
  loading?: 'lazy' | 'eager'
}

export default function MediaFrame({
  src,
  alt,
  type = 'image',
  aspect,
  maxHeight,
  className = '',
  imgClassName = '',
  controls = false,
  loading = 'lazy',
}: Props) {
  const frameStyle = aspect ? { aspectRatio: aspect } : undefined
  // With a fixed shape the frame owns the height and the media is pinned
  // inside it. Without one the media is in normal flow and its own
  // height, capped, is what makes the frame tall.
  const mediaLayout = aspect
    ? 'absolute inset-0 w-full h-full'
    : 'relative block w-full h-auto'
  const mediaStyle = aspect ? undefined : { maxHeight: maxHeight ? `${maxHeight}px` : undefined }

  if (type === 'video') {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`} style={frameStyle}>
        <video
          src={src}
          controls={controls}
          muted={!controls}
          playsInline
          preload="metadata"
          style={mediaStyle}
          className={`${mediaLayout} object-contain`}
        />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-[#f3efe6] ${className}`} style={frameStyle}>
      {/*
        The backdrop. Scaled past the edges because a heavy blur samples
        transparent pixels from outside the element and would otherwise
        fade the frame's own border into nothing. aria-hidden with an
        empty alt: it is the same picture as the one in front of it, so a
        screen reader announcing it twice is noise.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60 select-none pointer-events-none"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        style={mediaStyle}
        className={`${mediaLayout} object-contain ${imgClassName}`}
      />
    </div>
  )
}
