'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Heart, ShieldCheck, Crown } from 'lucide-react'
import { useSiteContent } from '@/lib/site-content/use-site-content'
import MemberBadges from '@/components/MemberBadges'
import type { BadgeId } from '@/lib/badges'

interface Props {
  status?: string
}

const QUICK_AMOUNTS = [25, 50, 100, 250]

type Tier = 'member' | 'founding' | 'parent'

interface TierConfig {
  id: Tier
  name: string
  /** Price in USD. Use 0 if you want the tier to appear as "Set in Stripe" — but Stripe is the source of truth for the actual charge. */
  price: number
  tagline: string
  features: string[]
  cta: string
  ctaActive: string
  accent: boolean
}

const TIER_BADGE: Record<Tier, BadgeId> = {
  member: 'member',
  founding: 'founding-member',
  parent: 'parent',
}

const TIERS: TierConfig[] = [
  {
    id: 'member',
    name: 'Supporting Member',
    price: 10,
    tagline:
      'Membership in the Clubhouse. 70% goes to Penn Men’s Golf, 30% keeps the platform running.',
    features: [
      'Direct support for the program',
      'Supporting Member status on your profile',
      'Full access to all Clubhouse features',
    ],
    cta: 'Become a Supporting Member',
    ctaActive: 'Supporting Member',
    accent: false,
  },
  {
    id: 'founding',
    name: 'Founding Member',
    price: 20,
    tagline:
      'Recognized as a Founding Member of the Clubhouse. Twice the support for the program.',
    features: [
      'Everything in Supporting Member',
      '2x the contribution to Penn Men’s Golf',
      'Founding Member badge on your profile',
      'Listed on the Clubhouse founders wall',
      'First look at new features',
    ],
    cta: 'Become a Founding Member',
    ctaActive: 'Founding Member',
    accent: true,
  },
  {
    id: 'parent',
    name: 'Family & Affiliate',
    price: 15,
    tagline:
      'For family, parents, and longtime affiliates. Support the program and stay close to the Clubhouse.',
    features: [
      'Family & Affiliate badge on your Member Book card',
      'Full access to follow rounds, events, and Moments',
      'Direct support for Penn Men’s Golf',
      'Cancel anytime',
    ],
    cta: 'Support the program',
    ctaActive: 'Family & Affiliate',
    accent: false,
  },
]

export default function SupportClient({ status }: Props) {
  const heroBlurb = useSiteContent(
    'support.hero-blurb',
    'The Penn Golf Clubhouse is the private network for the program. 70% of every membership and contribution goes directly to Penn Men’s Golf; the remaining 30% maintains the platform. Cancel anytime.',
  )
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [foundingConfigured, setFoundingConfigured] = useState(false)
  const [parentConfigured, setParentConfigured] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [currentTier, setCurrentTier] = useState<Tier | null>(null)
  const [founders, setFounders] = useState<
    Array<{ name: string; classLabel?: string; isProgramFounder: boolean; bookId: string | null }>
  >([])
  const [busyTier, setBusyTier] = useState<Tier | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)
  const [donBusy, setDonBusy] = useState(false)
  const [donAmount, setDonAmount] = useState<number>(50)
  const [donCustom, setDonCustom] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/billing/status')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return
        setConfigured(!!d.configured)
        setFoundingConfigured(!!d.foundingConfigured)
        setParentConfigured(!!d.parentConfigured)
        setSignedIn(!!d.signedIn)
        setSubscribed(!!d.subscribed)
        setCurrentTier(d.tier ?? null)
      })
      .catch(() => setConfigured(false))

    fetch('/api/founders')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.founders) setFounders(d.founders)
      })
      .catch(() => {})
  }, [])

  async function subscribe(tier: Tier) {
    if (!signedIn) {
      // Family & Affiliate has its own self-serve signup path — anyone
      // can land there and start without going through the alumni-claim
      // flow first. Member + Founding Member go through the normal sign-in.
      window.location.href =
        tier === 'parent' ? '/parent-signup' : '/login?next=/support'
      return
    }
    setBusyTier(tier)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.url) {
        throw new Error(j.error ?? `Checkout unavailable (${res.status})`)
      }
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusyTier(null)
    }
  }

  async function openPortal() {
    setPortalBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.url) {
        throw new Error(j.error ?? 'Portal unavailable')
      }
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPortalBusy(false)
    }
  }

  async function donate() {
    setDonBusy(true)
    setError(null)
    try {
      const customNum = donCustom.trim() ? Number(donCustom.trim()) : NaN
      const amountUsd = Number.isFinite(customNum) && customNum > 0 ? customNum : donAmount
      const res = await fetch('/api/billing/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.url) {
        throw new Error(j.error ?? `Donation unavailable (${res.status})`)
      }
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setDonBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero — clean navy, no radial glow, no gold underline. Matches
          the Locker Room / Member Book pattern. */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-14 pb-16">
        <div className="max-w-[920px] mx-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-4">
            Optional support
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium leading-tight tracking-tight font-heading"
          >
            Support Penn Men&rsquo;s Golf.
          </h1>
          <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-[640px] whitespace-pre-line mt-6">
            {heroBlurb}
          </p>
        </div>
      </div>

      {/* Banners */}
      {status === 'success' && (
        <div className="max-w-[920px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 rounded-xl px-5 py-4 text-[13px] text-[#2d6a4f]">
            Your membership is active. A receipt is on its way to your inbox.
          </div>
        </div>
      )}
      {status === 'thanks' && (
        <div className="max-w-[920px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#c8a84b]/15 border border-[#c8a84b]/40 rounded-xl px-5 py-4 text-[13px] text-[#0a1628]">
            Thank you for your contribution. A receipt is on its way to your inbox.
          </div>
        </div>
      )}
      {status === 'canceled' && (
        <div className="max-w-[920px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#8a7f70]/10 border border-[#8a7f70]/30 rounded-xl px-5 py-4 text-[13px] text-[#3d4a5c]">
            Checkout was canceled. You can pick this back up whenever.
          </div>
        </div>
      )}

      <div className="max-w-[920px] mx-auto px-6 sm:px-8 py-12 space-y-8">

        {configured === false && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-5 py-4 text-[13px]">
            Billing isn&rsquo;t configured yet. Check back soon.
          </div>
        )}

        {error && (
          <div className="bg-[#990000]/10 border border-[#990000]/30 rounded-xl px-5 py-4 text-[13px] text-[#990000]">
            {error}
          </div>
        )}

        {/* Active subscription summary */}
        {subscribed && (
          <div className="bg-white border border-[#2d6a4f]/30 rounded-2xl px-7 py-6 sm:px-10 sm:py-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2d6a4f]" />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2d6a4f]">
                  Active subscription
                </p>
                <p className="text-[14.5px] text-[#0a1628] mt-0.5">
                  {currentTier === 'founding'
                    ? 'Founding Member'
                    : currentTier === 'parent'
                      ? 'Family & Affiliate'
                      : 'Supporting Member'}{' '}
                  &middot; Thank you for supporting the program.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPortal}
              disabled={portalBusy}
              className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {portalBusy ? 'Opening…' : 'Manage subscription'}
            </button>
          </div>
        )}

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map(tier => {
            const isActive = subscribed && currentTier === tier.id
            const tierAvailable =
              tier.id === 'founding'
                ? foundingConfigured
                : tier.id === 'parent'
                  ? parentConfigured
                  : configured !== false
            const busy = busyTier === tier.id
            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl overflow-hidden flex flex-col ${
                  tier.accent
                    ? 'border border-[#c8a84b]/50'
                    : 'border border-[rgba(180,168,150,0.4)]'
                }`}
                style={{
                  boxShadow: tier.accent
                    ? '0 1px 3px rgba(10,22,40,0.06), 0 12px 28px rgba(200,168,75,0.12)'
                    : '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)',
                }}
              >
                {tier.accent && <div className="border-t-4 border-[#c8a84b]" />}
                <div className="px-7 py-8 sm:px-8 sm:py-9 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        tier.accent ? 'text-[#c8a84b]' : 'text-ink-muted'
                      }`}
                    >
                      {tier.name}
                    </p>
                    {tier.accent && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] bg-[#c8a84b]/15 text-[#7a6420] px-2 py-1 rounded-full">
                        Most support
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p
                      className="text-[#0a1628] text-5xl font-medium font-heading"
                    >
                      ${tier.price}
                    </p>
                    <p className="text-ink-muted text-base">/ month</p>
                  </div>
                  <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-5">
                    {tier.tagline}
                  </p>
                  <div className="mb-5 pb-5 border-b border-[rgba(180,168,150,0.4)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-2">
                      You&rsquo;ll get this badge
                    </p>
                    <MemberBadges badges={[TIER_BADGE[tier.id]]} size="md" />
                  </div>
                  <ul className="space-y-2 mb-7 flex-1">
                    {tier.features.map(item => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[14px] text-[#0a1628]"
                      >
                        <Check className="w-4 h-4 text-[#2d6a4f] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {isActive ? (
                    <span className="inline-flex items-center justify-center gap-1.5 bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 text-[#2d6a4f] text-[12px] font-semibold uppercase tracking-[0.14em] px-3 py-2.5 rounded-lg w-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {tier.ctaActive}
                    </span>
                  ) : subscribed ? (
                    <button
                      type="button"
                      onClick={openPortal}
                      disabled={portalBusy}
                      className="w-full inline-flex items-center justify-center gap-2 bg-white border border-[#0a1628]/25 text-[#0a1628] hover:bg-[#0a1628] hover:text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {portalBusy ? 'Opening…' : 'Change tier'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => subscribe(tier.id)}
                      disabled={busy || !tierAvailable}
                      className={`w-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                        tier.accent
                          ? 'bg-[#0a1628] hover:bg-[#112240] text-white'
                          : 'bg-white border border-[#0a1628]/30 text-[#0a1628] hover:bg-[#0a1628] hover:text-white'
                      }`}
                    >
                      {busy
                        ? 'Starting…'
                        : tierAvailable
                        ? tier.cta
                        : 'Coming soon'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Donation card */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-8 sm:px-10 sm:py-10"
          style={{
            boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
            One-time contribution
          </p>
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium leading-tight mb-2 font-heading"
          >
            Or contribute directly.
          </h2>
          <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-6 max-w-md">
            Prefer not to subscribe? Make a one-time contribution. Same 70/30 split
            between the program and the platform.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_AMOUNTS.map(a => {
              const active = donAmount === a && !donCustom.trim()
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setDonAmount(a)
                    setDonCustom('')
                  }}
                  className={`text-[14px] font-medium px-4 py-2.5 rounded-lg border transition-colors ${
                    active
                      ? 'bg-[#0a1628] text-white border-[#0a1628]'
                      : 'bg-white text-[#0a1628] border-[rgba(180,168,150,0.55)] hover:border-[#0a1628]'
                  }`}
                >
                  ${a}
                </button>
              )
            })}
            <div className="flex items-center gap-1 border border-[rgba(180,168,150,0.55)] rounded-lg px-3 py-2 bg-white">
              <span className="text-[14px] text-ink-muted">$</span>
              <input
                type="number"
                min={5}
                value={donCustom}
                onChange={e => setDonCustom(e.target.value)}
                placeholder="other"
                className="w-20 text-[14px] text-[#0a1628] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1628]/40"
              />
            </div>
          </div>
          <p className="text-[11px] text-ink-muted mb-6">Minimum $5.</p>

          <button
            type="button"
            onClick={donate}
            disabled={donBusy || configured === false}
            className="inline-flex items-center gap-2 bg-[#990000] hover:bg-[#b30000] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Heart className="w-4 h-4" />
            {donBusy ? 'Starting…' : 'Contribute'}
          </button>
        </div>

        {/* Founders Wall lives on /member-book now — link to it from here. */}
        {founders.length > 0 && (
          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13.5px] text-[#3d4a5c]">
              <Crown className="w-4 h-4 text-[#c8a84b]" />
              <span>
                Founding Members are listed on the{' '}
                <Link href="/member-book" className="text-[#0a1628] hover:underline font-semibold">
                  Founders Wall
                </Link>{' '}
                in the Member Book.
              </span>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center pt-2">
          <p className="text-[11.5px] text-ink-muted max-w-md mx-auto leading-relaxed">
            Payments processed by Stripe. Penn Men&rsquo;s Golf is not a registered
            501(c)(3), so contributions are not tax-deductible. The 70% transfer to
            the program is reconciled quarterly by the captain.{' '}
            <Link href="/player" className="text-[#0a1628] hover:underline">
              Back to the Clubhouse
            </Link>
            .
          </p>
          <p className="text-[11px] text-ink-muted mt-2">
            <Link href="/subscription-terms" className="hover:text-[#0a1628] hover:underline">
              Subscription &amp; Billing Terms
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
