'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Clubhouse', href: '/player' },
  { label: 'Member Book', href: '/player/search' },
  { label: 'Career Room', href: '/career-room' },
  { label: 'The Course', href: '/the-course' },
  { label: '19th Hole', href: '/19th-hole' },
  { label: 'Events', href: '/events' },
  { label: 'Member Map', href: '/member-map' },
  { label: 'Team Room', href: '/team-room' },
  { label: 'Alumni', href: '/alumni' },
]

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-[#0a1628] border-b border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center">
          <span className="text-white text-sm font-semibold tracking-[0.15em]">
            PENN GOLF
          </span>
          <span className="text-[#990000] text-sm font-bold ml-1.5">&middot;</span>
          <span className="text-gray-400 text-sm font-medium ml-1.5 tracking-wide">Clubhouse</span>
        </Link>

        {/* Center nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] transition-colors px-3 py-2 rounded ${
                  active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center">
          <Link
            href="/internal"
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors px-2 py-1"
          >
            Internal
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden text-gray-300 hover:text-white p-2 -mr-2"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="md:hidden bg-[#0a1628] border-t border-white/[0.08] px-6 pb-4"
          >
            <div className="flex flex-col gap-1 pt-3">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-gray-300 hover:text-white transition-colors py-2.5 border-b border-white/[0.06] last:border-0"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3">
                <Link
                  href="/internal"
                  className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Internal
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
