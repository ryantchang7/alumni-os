/**
 * The film section, rendered on the server. It used to live inside the
 * client page and depend on a client fetch of /api/site-content — if that
 * call hiccupped, the hook swallowed the error and the film silently
 * vanished. That film is the entire promise of the launch email, so it
 * ships in the initial HTML now.
 */

export default function LaunchFilm({
  url,
  poster,
}: {
  url: string
  poster?: string
}) {
  if (!url) return null
  return (
    <section
      id="film"
      className="relative overflow-hidden px-5 sm:px-8 py-10 sm:py-14 bg-[#07101f] border-y border-white/10"
    >
      {/* Its own darker ground and a gold rule, so the film reads as an event
          on the page rather than as one more block of navy. */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Deliberately short. Anyone who clicked "Watch the film" or landed on
            #film came to press play, and the old stack — mark, eyebrow, 60px
            heading, subtitle, rule — pushed the video most of a screen down. */}
        <div className="text-center mb-5 sm:mb-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#c8a84b] mb-2">
            The film · 5 minutes
          </p>
          <h2 className="font-heading text-white text-2xl sm:text-3xl font-medium tracking-tight">
            Every room in the Clubhouse, in Ryan&rsquo;s own words.
          </h2>
        </div>

        <video
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
          className="w-full rounded-2xl border border-white/10"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}
        >
          <source src={url} type="video/mp4" />
          Your browser cannot play this video.{' '}
          <a href={url} className="underline">
            Download it instead
          </a>
          .
        </video>
      </div>

      {/* The horizon again, very faint, tying this section to the hero. */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none" aria-hidden="true">
        <picture>
          <source srcSet="/brand/lockup-scene.webp" type="image/webp" media="(min-width: 768px)" />
          <source srcSet="/brand/lockup-scene-900.webp" type="image/webp" />
          <img
            src="/brand/lockup-scene.png"
            alt=""
            className="w-full h-auto opacity-[0.14]"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 45%, #000 85%, #000 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, transparent 45%, #000 85%, #000 100%)',
            }}
          />
        </picture>
      </div>
    </section>
  )
}
