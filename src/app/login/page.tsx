'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 22,
  mass: 0.8,
}

const demoCards = [
  {
    role: 'Current player · Builder · Reviewer',
    name: 'Ryan Chang',
    description: 'Full demo access to Player, Builder, and Review modes.',
    cta: 'Continue as Ryan →',
    href: '/app',
    userKey: 'ryan',
  },
  {
    role: 'Current player',
    name: 'Penn Golf Teammate',
    description: 'Player Mode only: search alumni, draft outreach, track relationships.',
    cta: 'Continue as Teammate →',
    href: '/player',
    userKey: 'teammate',
  },
  {
    role: 'Verified alumni preview',
    name: 'Penn Golf Alum',
    description: 'Preview future alumni profile and preference controls.',
    cta: 'Continue as Alum →',
    href: '/player/alumni/alum-001',
    userKey: 'alum',
  },
  {
    role: 'Coach / admin preview',
    name: 'Coach / Admin',
    description: 'Preview team graph health, review, and activation tools.',
    cta: 'Continue as Coach →',
    href: '/builder',
    userKey: 'coach',
  },
]

export default function LoginPage() {
  const router = useRouter()

  const handleSelect = (userKey: string, href: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo-user', userKey)
    }
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col">
      {/* Navy top bar */}
      <div className="bg-[#0a1628] py-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Alumni OS</p>
          <h1 className="text-white text-3xl font-semibold tracking-tight leading-tight">
            Sign in to Alumni OS
          </h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-md mx-auto">
            Use demo access while the product is still local. Real authentication will be added before any real alumni data is saved.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demoCards.map((card, index) => (
              <motion.button
                key={card.userKey}
                onClick={() => handleSelect(card.userKey, card.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className="text-left bg-white border border-[rgba(180,168,150,0.35)] rounded-xl p-6 transition-shadow hover:shadow-md cursor-pointer w-full"
                style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)' }}
              >
                <p className="text-xs font-medium text-[#8a7f70] uppercase tracking-wider mb-2">
                  {card.role}
                </p>
                <p className="text-lg font-semibold text-[#0a1628]">{card.name}</p>
                <p className="text-sm text-[#8a7f70] mt-1 leading-relaxed">{card.description}</p>
                <p className="text-sm font-semibold text-[#990000] mt-4">{card.cta}</p>
              </motion.button>
            ))}
          </div>

          <p className="text-xs text-[#8a7f70] text-center mt-8">
            Demo only. No real accounts. No real data stored.
          </p>
        </div>
      </div>
    </div>
  )
}
