'use client'

import Link from 'next/link'

interface NetworkShellProps {
  children: React.ReactNode
}

export default function NetworkShell({ children }: NetworkShellProps) {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <header className="bg-[#0a1628] border-b border-white/[0.08] sticky top-0 z-50">
        <div className="max-w-[1320px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/network" className="flex items-center">
            <span className="text-white text-sm font-semibold tracking-[0.15em]">
              PENN&nbsp;GOLF
            </span>
            <span className="text-[#990000] text-sm font-bold ml-0.5">·</span>
            <span className="text-gray-400 text-sm ml-1.5 font-normal tracking-wide">
              Network
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/network/search"
              className="text-[13px] text-gray-300 hover:text-white transition-colors px-3 py-2 rounded hover:bg-white/[0.06]"
            >
              Find Alumni
            </Link>
          </nav>

          <div className="hidden md:flex items-center">
            <span className="bg-[#112240] border border-white/[0.08] text-gray-300 text-xs font-mono px-2.5 py-1 rounded-full">
              Verified by Penn Golf captains
            </span>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
