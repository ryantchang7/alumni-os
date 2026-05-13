export default function SiteFooter() {
  return (
    <footer className="bg-[#0a1628] border-t border-white/[0.06]">
      <div className="max-w-[1320px] mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-white text-xs font-semibold tracking-[0.12em]">
              ALUMNI OS
              <span className="text-[#990000] ml-0.5">·</span>
            </span>
            <span className="bg-[#112240] border border-white/[0.08] text-gray-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              Penn Men&apos;s Golf
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-[11px] leading-relaxed max-w-3xl">
          Alumni OS uses public, permissioned, or alumni-submitted data. Verify profiles before
          outreach. Do not scrape private or login-gated profiles. Alumni can claim, edit, or opt
          out.
        </p>
      </div>
    </footer>
  )
}
