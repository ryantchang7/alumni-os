import Link from 'next/link'

export default function NetworkLandingPage() {
  return (
    <div>
      <div className="bg-[#0a1628] px-8 pt-16 pb-20">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Penn Golf Network</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight mb-4">
            Find verified Penn Golf alumni.
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto mb-8">
            Profiles are approved by Penn Golf captains or staff before appearing here.
          </p>
          <Link
            href="/network/search?teamSlug=penn-mens-golf"
            data-testid="network-search-link"
            className="inline-block bg-[#990000] hover:bg-[#b30000] text-white font-semibold text-sm px-6 py-3 rounded-md transition-colors"
          >
            Browse Alumni
          </Link>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-[#0a1628]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0a1628] text-lg font-bold">1</span>
            </div>
            <h3 className="font-semibold text-[#0a1628] text-sm mb-2">Verified profiles</h3>
            <p className="text-xs text-[#8a7f70] leading-relaxed">
              Every profile is reviewed and approved by a Penn Golf captain or staff member before it appears here.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-[#0a1628]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0a1628] text-lg font-bold">2</span>
            </div>
            <h3 className="font-semibold text-[#0a1628] text-sm mb-2">Real connections</h3>
            <p className="text-xs text-[#8a7f70] leading-relaxed">
              Connect with alumni who played Penn Golf. Use outreach templates to reach out for career advice, a round of golf, or mentorship.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-[#0a1628]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0a1628] text-lg font-bold">3</span>
            </div>
            <h3 className="font-semibold text-[#0a1628] text-sm mb-2">Current players only</h3>
            <p className="text-xs text-[#8a7f70] leading-relaxed">
              Access is for current Penn Golf team members. Alumni data is sourced from public athletic records.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
