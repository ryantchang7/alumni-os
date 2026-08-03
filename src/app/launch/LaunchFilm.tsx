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
    <section id="film" className="px-5 sm:px-8 py-16 sm:py-20 bg-[#0a1628]">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#c8a84b] mb-5 text-center">
          Watch the film · 3 minutes
        </p>
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
          className="w-full rounded-2xl border border-white/10"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}
        >
          <source src={url} type="video/mp4" />
        </video>
      </div>
    </section>
  )
}
