/**
 * Hero for /the-course. Country-club restraint: no illustrated aerial,
 * no infographic. Typography-led — a wide Playfair wordmark, a single
 * editorial pull-quote on parchment, a thin gold rule. The earlier
 * version of this hero leaned on a stylized course diagram that
 * read as AI-generated; this one trades that for type and whitespace,
 * the way a clubhouse menu would.
 */
export default function CourseHero() {
  return (
    <section className="relative bg-[#f4ecdb] border-b border-[#d9c8a8]/40 overflow-hidden">
      {/* Soft uneven wash, off-center to avoid the perfectly-symmetric look */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-12%',
          right: '-10%',
          width: '60%',
          height: '160%',
          background:
            'radial-gradient(ellipse at center, rgba(90,122,62,0.10) 0%, rgba(90,122,62,0.03) 45%, transparent 75%)',
        }}
      />

      <div className="relative max-w-[1180px] mx-auto px-6 sm:px-10 pt-14 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-x-10 gap-y-8 items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5a7a3e] mb-4">
              Penn Men&rsquo;s Golf · The Tee Sheet
            </p>
            <h1
              className="text-[#0a1628] font-medium leading-[0.95] tracking-tight"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(56px, 9vw, 112px)',
              }}
            >
              The Course
            </h1>
            <span className="block w-12 h-[2px] bg-[#5a7a3e] mt-7 mb-6" />
            <p className="text-[#3d4a5c] text-[15px] leading-[1.65] max-w-[440px]">
              Tee times, foursomes, and home courses across the Penn Golf
              network. Every round here is hosted by a member.
            </p>
            <div className="flex gap-2.5 mt-7">
              <a
                href="/the-course/host"
                className="bg-[#5a7a3e] hover:bg-[#4a6a35] text-white text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
              >
                Host a Round
              </a>
              <a
                href="#open-to-rounds"
                className="bg-transparent border border-[#0a1628]/15 hover:border-[#0a1628]/45 text-[#0a1628] text-[12px] font-semibold uppercase tracking-[0.16em] px-5 py-2.5 rounded-md transition-colors"
              >
                Find a Round
              </a>
            </div>
          </div>

          {/* Editorial right side: an italic pull-quote, set like a
              clubhouse plaque. No illustration; the type IS the artwork. */}
          <div className="hidden md:block relative pl-8 border-l border-[#d9c8a8]/70 max-w-[420px] justify-self-end">
            <p
              className="text-[#3d4a5c]/85 text-[19px] leading-[1.45] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              &ldquo;The best round of your life is always the one you
              haven&rsquo;t played yet.&rdquo;
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a7f70] mt-4">
              Posted at the first tee
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
