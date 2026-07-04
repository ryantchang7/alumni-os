/**
 * Captain-only "Required Fields by Role" reference. Pure readonly view
 * of `ROLE_SECTIONS` in @/lib/role-requirements.ts. Linked from the
 * /internal tool grid. Use it to check what every signup type fills
 * out and where each field surfaces, without grepping the codebase.
 */

import Link from 'next/link'
import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'
import { ROLE_SECTIONS } from '@/lib/role-requirements'

export default async function RequirementsPage() {
  await requireFounderOr404()

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="bg-[#0a1628] px-8 pt-10 pb-12">
        <div className="max-w-[1080px] mx-auto">
          <Link
            href="/internal"
            className="text-xs text-gray-400 hover:text-gray-200 mb-3 inline-block"
          >
            ← Internal tools
          </Link>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Captain</p>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Required Fields by Role
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            What every signup type fills out, and where each field surfaces.
            Sourced from <code className="text-[#c8a84b]">src/lib/role-requirements.ts</code>{' '}
            — edit there to update this panel.
          </p>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-8 -mt-4 pb-16 space-y-6">
        {ROLE_SECTIONS.map(section => (
          <section
            key={section.key}
            className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl overflow-hidden"
            style={{
              boxShadow:
                '0 1px 3px rgba(10,22,40,0.05), 0 8px 24px rgba(10,22,40,0.06)',
            }}
          >
            <div className="px-7 sm:px-9 pt-8 pb-5 border-b border-[rgba(180,168,150,0.3)] bg-[#faf7f2]">
              <h2
                className="text-[#0a1628] text-2xl font-medium leading-tight font-heading"
              >
                {section.label}
              </h2>
              <p className="text-[13px] text-[#3d4a5c] mt-2 leading-relaxed max-w-2xl">
                {section.blurb}
              </p>
            </div>

            {/* Required */}
            <div className="px-7 sm:px-9 py-6 border-b border-[rgba(180,168,150,0.3)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
                Required
              </p>
              <ul className="space-y-3">
                {section.required.map(line => (
                  <li
                    key={`${section.key}-r-${line.field}`}
                    className="border-l-2 border-[#990000]/30 pl-3"
                  >
                    <p className="text-[13.5px] font-medium text-[#0a1628]">
                      {line.field}
                    </p>
                    {line.note && (
                      <p className="text-[12px] text-[#3d4a5c] mt-0.5 leading-relaxed">
                        {line.note}
                      </p>
                    )}
                    {line.appearsOn && line.appearsOn.length > 0 && (
                      <p className="text-[11px] text-ink-muted mt-1">
                        <span className="font-semibold uppercase tracking-[0.12em] mr-1.5">
                          Appears on
                        </span>
                        {line.appearsOn.join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Optional */}
            <div className="px-7 sm:px-9 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3d4a5c] mb-3">
                Optional but visible
              </p>
              <ul className="space-y-3">
                {section.optional.map(line => (
                  <li
                    key={`${section.key}-o-${line.field}`}
                    className="border-l-2 border-[rgba(180,168,150,0.5)] pl-3"
                  >
                    <p className="text-[13.5px] font-medium text-[#0a1628]">
                      {line.field}
                    </p>
                    {line.note && (
                      <p className="text-[12px] text-[#3d4a5c] mt-0.5 leading-relaxed">
                        {line.note}
                      </p>
                    )}
                    {line.appearsOn && line.appearsOn.length > 0 && (
                      <p className="text-[11px] text-ink-muted mt-1">
                        <span className="font-semibold uppercase tracking-[0.12em] mr-1.5">
                          Appears on
                        </span>
                        {line.appearsOn.join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
