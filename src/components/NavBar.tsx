'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signIn, signOut } from 'next-auth/react'

// Hall of Fame is intentionally not a top-level tab — lives under Clubhouse.
// Chat is intentionally not a top-level tab — you start a chat from a
// member's profile in the Member Book ("Message" button). The /chat list
// and /chat/[id] thread pages still work for ongoing conversations.
const navLinks = [
  { label: 'Clubhouse', href: '/player' },
  { label: 'Member Book', href: '/member-book' },
  { label: 'Member Map', href: '/member-map' },
  { label: 'The Course', href: '/the-course' },
  { label: '19th Hole', href: '/19th-hole' },
  { label: 'Moments', href: '/moments' },
  { label: 'Career Room', href: '/career-room' },
  { label: 'Team Room', href: '/team-room' },
  { label: 'Support', href: '/support' },
]

function AccountAffordance() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  if (status === 'loading') return null
  if (status !== 'authenticated' || !session) {
    return (
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/account/profile' })}
        className="text-[12px] font-medium text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded transition-colors"
      >
        Sign in
      </button>
    )
  }
  const name = session.user?.name ?? session.user?.email ?? 'Profile'
  const initial = (name?.[0] ?? '?').toUpperCase()
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-2 text-[13px] text-gray-200 hover:text-white px-2 py-1 rounded"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/15 text-[11px] font-semibold">
            {initial}
          </span>
        )}
        <span className="hidden lg:inline">{name?.split(' ')[0]}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-48 bg-white border border-[rgba(180,168,150,0.4)] rounded-lg shadow-lg overflow-hidden text-[#0a1628] z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Link
            href="/account/profile"
            className="block px-4 py-2 text-[13px] hover:bg-[#faf7f2]"
          >
            Your Profile
          </Link>
          <Link
            href="/chat"
            className="block px-4 py-2 text-[13px] hover:bg-[#faf7f2]"
          >
            Messages
          </Link>
          <Link
            href="/member-book"
            className="block px-4 py-2 text-[13px] hover:bg-[#faf7f2]"
          >
            Member Book
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full text-left px-4 py-2 text-[13px] text-[#990000] hover:bg-[#faf7f2] border-t border-[rgba(180,168,150,0.25)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-[#0a1628] border-b border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Wordmark — just PENN GOLF set in tracked caps */}
        <Link href="/" className="flex items-center">
          <span className="text-white text-sm font-semibold tracking-[0.18em]">
            PENN GOLF
          </span>
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
        <div className="hidden md:flex items-center gap-3">
          <AccountAffordance />
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
              <div className="pt-3 flex items-center justify-between">
                <AccountAffordance />
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
