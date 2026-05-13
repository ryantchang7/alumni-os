import Link from 'next/link'

const modes = [
  {
    label: 'Build',
    tagline: 'For team operators',
    description:
      'Give us a roster link. The agent finds the players, you approve, and a verified alumni network is ready in minutes.',
    href: '/build',
    cta: 'Build the network',
    primary: true,
  },
  {
    label: 'Player Clubhouse',
    tagline: 'For current athletes',
    description:
      'Browse alumni by name, class, and hometown. See who is open to helping, and reach out through the team.',
    href: '/player',
    cta: 'Open Player Clubhouse',
    primary: false,
  },
  {
    label: 'Alumni Mode',
    tagline: 'For alumni',
    description:
      'Update your profile, choose the topics you can help with, and control when and how players can reach you.',
    href: '/alumni',
    cta: 'Open Alumni Mode',
    primary: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-8 pt-16 pb-20">
        <div className="max-w-[860px] mx-auto text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Penn Golf</p>
          <h1 className="text-white text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            The alumni network
            <br />
            built from the roster.
          </h1>
          <p className="text-gray-300 text-lg mt-5 max-w-lg mx-auto leading-relaxed">
            No spreadsheets. No cold outreach. Just verified names, years, and the alumni who
            chose to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/player"
              className="text-sm font-semibold bg-white text-[#0a1628] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Open Player Clubhouse
            </Link>
            <Link
              href="/build"
              className="text-sm font-semibold border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Build a network
            </Link>
          </div>
        </div>
      </div>

      {/* Three modes */}
      <div className="max-w-[1080px] mx-auto px-8">
        <div className="-mt-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
          {modes.map(mode => (
            <div
              key={mode.href}
              className={`bg-white rounded-xl p-6 border ${
                mode.primary
                  ? 'border-l-4 border-l-[#990000] border-[rgba(180,168,150,0.35)]'
                  : 'border-[rgba(180,168,150,0.35)]'
              }`}
              style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
            >
              <p className="text-xs font-semibold text-[#8a7f70] uppercase tracking-wider mb-1">
                {mode.tagline}
              </p>
              <p className="font-semibold text-[#0a1628] text-base mb-2">{mode.label}</p>
              <p className="text-sm text-[#4a5568] leading-relaxed mb-5">{mode.description}</p>
              <Link
                href={mode.href}
                className={`text-sm font-semibold ${
                  mode.primary
                    ? 'text-white bg-[#990000] hover:bg-[#b30000] px-4 py-2 rounded-lg transition-colors'
                    : 'text-[#990000] hover:underline'
                }`}
              >
                {mode.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
