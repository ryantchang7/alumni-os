/**
 * A subtle "example" card used on gated pages to show non-members
 * what real content looks like. Anything inside is for illustration —
 * not real data. The "EXAMPLE" badge in the corner makes that clear.
 */

interface Props {
  /** First line — big serif. */
  title: string
  /** Second line — mid grey. */
  subtitle?: string
  /** Optional category chip (e.g. "Ask", "Round", "Drinks") shown top left. */
  kind?: string
  /** Optional accent color for the chip (defaults to navy). */
  kindAccent?: string
  /** Tertiary line — small meta. */
  meta?: string
  /** Optional body / blurb. */
  body?: string
}

export default function ExampleCard({
  title,
  subtitle,
  kind,
  kindAccent = '#0a1628',
  meta,
  body,
}: Props) {
  return (
    <div
      className="relative bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4"
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)' }}
    >
      <span
        className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border bg-white text-[#8a7f70] border-[#8a7f70]/30"
        title="Example — not a real event"
      >
        Example
      </span>
      <div className="flex items-center gap-2 mb-1.5">
        {kind && (
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border"
            style={{
              color: kindAccent,
              backgroundColor: `${kindAccent}10`,
              borderColor: `${kindAccent}40`,
            }}
          >
            {kind}
          </span>
        )}
      </div>
      <p
        className="text-[#0a1628] text-[15px] font-medium leading-snug"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {title}
      </p>
      {subtitle && (
        <p className="text-[12.5px] text-[#3d4a5c] mt-0.5">{subtitle}</p>
      )}
      {body && (
        <p className="text-[12.5px] text-[#3d4a5c] mt-2 leading-relaxed">{body}</p>
      )}
      {meta && (
        <p className="text-[11px] text-[#8a7f70] mt-2 italic">{meta}</p>
      )}
    </div>
  )
}
