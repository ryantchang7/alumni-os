'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signIn, signOut } from 'next-auth/react'
import { FOUNDER_EMAILS } from '@/lib/badges'
import NotificationBell from '@/components/NotificationBell'
import SuggestTrigger from '@/components/SuggestTrigger'

// Hall of Fame is intentionally not a top-level tab — lives under Clubhouse.
// Chat is intentionally not a top-level tab — you start a chat from a
// member's profile in the Member Book ("Message" button). The /chat list
// and /chat/[id] thread pages still work for ongoing conversations.
type NavLink = { label: string; href: string }
type NavEntry =
  | ({ type: 'link' } & NavLink)
  | { type: 'menu'; label: string; links: NavLink[] }

// People/directory surfaces, grouped under the "Member Book" dropdown. Spotlight
// features a member, so it sits here — not under "Team" (the current squad).
const memberBookLinks: NavLink[] = [
  { label: 'Member Book', href: '/member-book' },
  { label: 'Member Map', href: '/member-map' },
  { label: 'Spotlight', href: '/spotlight' },
]

// Current-squad surfaces. "Ask the Team" points at /meet-the-team — the roster
// page that carries the ask-a-question flow (the verb people actually want).
const teamLinks: NavLink[] = [
  { label: 'Team Room', href: '/team-room' },
  { label: 'Ask the Team', href: '/meet-the-team' },
  { label: 'Team Updates', href: '/team/updates' },
  { label: 'Team Travel', href: '/team/travel' },
]

// The top nav, in order. 'link' = direct destination; 'menu' = a dropdown
// (desktop) / labeled section (mobile) that keeps the bar from getting crowded.
const navEntries: NavEntry[] = [
  { type: 'link', label: 'Clubhouse', href: '/player' },
  { type: 'link', label: 'Invite', href: '/invite' },
  { type: 'menu', label: 'Member Book', links: memberBookLinks },
  { type: 'link', label: 'The Course', href: '/the-course' },
  { type: 'link', label: '19th Hole', href: '/19th-hole' },
  { type: 'link', label: 'Moments', href: '/moments' },
  { type: 'link', label: 'Career Room', href: '/career-room' },
  { type: 'menu', label: 'Team', links: teamLinks },
  { type: 'link', label: 'Support', href: '/support' },
]

const navItemClass = (active: boolean) =>
  `text-[13px] transition-colors px-3 py-2 rounded ${
    active ? 'text-white bg-white/[0.08]' : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
  }`

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

/** Desktop dropdown grouping a set of related nav links under one label. */
function NavMenu({
  label,
  links,
  pathname,
}: {
  label: string
  links: NavLink[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const active = links.some(l => isActive(pathname, l.href))
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-expanded={open}
        className={`flex items-center gap-1 ${navItemClass(active)}`}
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute left-0 mt-1 w-44 bg-white border border-[rgba(180,168,150,0.4)] rounded-lg shadow-lg overflow-hidden text-[#0a1628] z-50"
          onMouseDown={e => e.preventDefault()}
        >
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-4 py-2 text-[13px] hover:bg-[#fdfcf9] ${
                isActive(pathname, l.href) ? 'bg-[#fdfcf9] font-medium' : ''
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AccountAffordance() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  // Track whether the avatar URL loaded — Google Identity sometimes 403s
  // its profile image (anti-hotlinking), so we fall back to initials on
  // error rather than leaving a broken icon in the nav.
  const [imgFailed, setImgFailed] = useState(false)
  // Member-uploaded profile photo — preferred over the Google avatar.
  // Pulled from /api/me/access (which already reads the enrichment).
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') {
      setUploadedPhoto(null)
      return
    }
    fetch('/api/me/access')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setUploadedPhoto(d?.photoUrl ?? null))
      .catch(() => setUploadedPhoto(null))
  }, [status])

  if (status === 'loading') return null
  if (status !== 'authenticated' || !session) {
    return (
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/account/profile' })}
        className="text-[12px] font-medium text-white border border-white/30 hover:border-white/60 px-3 py-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-[#0a1628]/40 focus:outline-none"
      >
        Sign in
      </button>
    )
  }
  const name = session.user?.name ?? session.user?.email ?? 'Profile'
  const initial = (name?.[0] ?? '?').toUpperCase()
  // Prefer the photo the member uploaded themselves over the Google
  // avatar — uploaded photo is what they put on their card.
  const avatarSrc = uploadedPhoto ?? session.user?.image ?? null
  const showImage = !!avatarSrc && !imgFailed
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-2 text-[13px] text-gray-200 hover:text-white px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-[#0a1628]/40 focus:outline-none"
      >
        {showImage ? (
          // Plain <img> + referrerPolicy="no-referrer" — avoids both
          // Next/Image remotePatterns config AND Google's hotlinking
          // throttle that returns 403 to Vercel-origin requests.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc!}
            alt=""
            width={24}
            height={24}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-6 h-6 rounded-full object-cover"
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
            className="block px-4 py-2 text-[13px] hover:bg-[#fdfcf9]"
          >
            Your Profile
          </Link>
          <Link
            href="/chat"
            className="block px-4 py-2 text-[13px] hover:bg-[#fdfcf9]"
          >
            Messages
          </Link>
          <Link
            href="/requests/new"
            className="block px-4 py-2 text-[13px] hover:bg-[#fdfcf9]"
          >
            Post an Open Request
          </Link>
          <Link
            href="/player/requests"
            className="block px-4 py-2 text-[13px] hover:bg-[#fdfcf9]"
          >
            Your Requests
          </Link>
          <Link
            href="/member-book"
            className="block px-4 py-2 text-[13px] hover:bg-[#fdfcf9]"
          >
            Member Book
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full text-left px-4 py-2 text-[13px] text-[#990000] hover:bg-[#fdfcf9] border-t border-[rgba(180,168,150,0.25)]"
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
  const { data: session } = useSession()
  const email = (session?.user?.email ?? '').toLowerCase().trim()
  const isFounder = FOUNDER_EMAILS.has(email)

  const mobileLinkClass =
    'text-[13px] text-gray-300 hover:text-white transition-colors py-3 border-b border-white/[0.06]'

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
        <nav className="hidden xl:flex items-center gap-1">
          {navEntries.map(entry =>
            entry.type === 'menu' ? (
              <NavMenu key={entry.label} label={entry.label} links={entry.links} pathname={pathname} />
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={navItemClass(isActive(pathname, entry.href))}
              >
                {entry.label}
              </Link>
            ),
          )}
        </nav>

        {/* Right side */}
        <div className="hidden xl:flex items-center gap-3">
          <SuggestTrigger />
          <NotificationBell />
          <AccountAffordance />
          {isFounder && (
            <Link
              href="/internal"
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors px-2 py-1"
            >
              Internal
            </Link>
          )}
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="xl:hidden flex items-center gap-1 -mr-2">
          <NotificationBell />
          <button
            type="button"
            className="text-gray-300 hover:text-white p-2"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="xl:hidden bg-[#0a1628] border-t border-white/[0.08] px-6 pb-4 max-h-[calc(100dvh-60px)] overflow-y-auto"
          >
            <div className="flex flex-col gap-1 pt-3">
              {navEntries.map(entry =>
                entry.type === 'menu' ? (
                  <Fragment key={entry.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 pt-4 pb-1">
                      {entry.label}
                    </p>
                    {entry.links.map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`${mobileLinkClass} pl-3`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </Fragment>
                ) : (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={mobileLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    {entry.label}
                  </Link>
                ),
              )}

              <div className="pt-3 flex items-center justify-between">
                <AccountAffordance />
                <div className="flex items-center gap-3">
                  <SuggestTrigger />
                  {isFounder && (
                    <Link
                      href="/internal"
                      className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Internal
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
