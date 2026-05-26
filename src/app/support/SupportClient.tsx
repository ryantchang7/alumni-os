'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Heart, Flag, ShieldCheck } from 'lucide-react'

interface Props {
  status?: string
}

const QUICK_AMOUNTS = [25, 50, 100, 250]

export default function SupportClient({ status }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subBusy, setSubBusy] = useState(false)
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
        setSignedIn(!!d.signedIn)
        setSubscribed(!!d.subscribed)
      })
      .catch(() => setConfigured(false))
  }, [])

  async function subscribe() {
    if (!signedIn) {
      window.location.href = '/login?next=/support'
      return
    }
    setSubBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.url) {
        throw new Error(j.error ?? `Couldn't start checkout (${res.status})`)
      }
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSubBusy(false)
    }
  }

  async function openPortal() {
    setSubBusy(true)
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
      setSubBusy(false)
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
        throw new Error(j.error ?? `Couldn't start donation (${res.status})`)
      }
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setDonBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      {/* Hero */}
      <div className="bg-[#0a1628] px-6 sm:px-8 pt-14 pb-16 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            right: '-10%',
            width: '600px',
            height: '420px',
            transform: 'translate(0, -50%)',
            background:
              'radial-gradient(ellipse at center, rgba(200,168,75,0.16) 0%, rgba(200,168,75,0.04) 45%, transparent 75%)',
          }}
        />
        <div className="max-w-[760px] mx-auto relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-4">
            Back the Brotherhood
          </p>
          <h1
            className="text-white text-4xl sm:text-5xl font-medium leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Keep Penn Golf on the bag.
          </h1>
          <span className="block w-12 h-[2px] bg-[#c8a84b] mt-6 mb-5" />
          <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-[600px]">
            $10/month. <span className="text-[#c8a84b] font-medium">Half</span> goes
            directly to Penn Men&rsquo;s Golf. The other half keeps the Clubhouse
            running — the app you&rsquo;re reading this in.
          </p>
        </div>
      </div>

      {/* Success / canceled banners */}
      {status === 'success' && (
        <div className="max-w-[760px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 rounded-xl px-5 py-4 text-[13px] text-[#2d6a4f]">
            🎉 You&rsquo;re a Founding Member. Welcome. We&rsquo;ll send a receipt to your inbox.
          </div>
        </div>
      )}
      {status === 'thanks' && (
        <div className="max-w-[760px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#c8a84b]/15 border border-[#c8a84b]/40 rounded-xl px-5 py-4 text-[13px] text-[#0a1628]">
            🙏 Thank you. Receipt in your inbox.
          </div>
        </div>
      )}
      {status === 'canceled' && (
        <div className="max-w-[760px] mx-auto px-6 sm:px-8 mt-6">
          <div className="bg-[#8a7f70]/10 border border-[#8a7f70]/30 rounded-xl px-5 py-4 text-[13px] text-[#3d4a5c]">
            No worries — checkout was canceled. The brotherhood is still here.
          </div>
        </div>
      )}

      <div className="max-w-[760px] mx-auto px-6 sm:px-8 py-12 space-y-8">

        {configured === false && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-5 py-4 text-[13px]">
            Billing isn&rsquo;t configured yet. The captain needs to add Stripe keys on Vercel.
          </div>
        )}

        {error && (
          <div className="bg-[#990000]/10 border border-[#990000]/30 rounded-xl px-5 py-4 text-[13px] text-[#990000]">
            {error}
          </div>
        )}

        {/* Subscription card */}
        <div
          className="bg-white border border-[#c8a84b]/40 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.06), 0 12px 28px rgba(200,168,75,0.10)' }}
        >
          <div className="border-t-4 border-[#c8a84b]" />
          <div className="px-7 py-8 sm:px-10 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c8a84b] mb-3">
              Founding Member · Subscription
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <p
                className="text-[#0a1628] text-5xl font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                $10
              </p>
              <p className="text-[#8a7f70] text-base">/ month</p>
            </div>
            <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-6 max-w-md">
              Cancel anytime. 50% to Penn Men&rsquo;s Golf, 50% to the Clubhouse.
              Founding Members get a small recognition on their profile.
            </p>
            <ul className="space-y-2 mb-7">
              {[
                'Direct support for the team',
                'Keeps the Clubhouse running (no ads, ever)',
                'Founding Member badge on your profile',
                'First look at new features',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[14px] text-[#0a1628]">
                  <Check className="w-4 h-4 text-[#2d6a4f] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {subscribed ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 text-[#2d6a4f] text-[12px] font-semibold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Founding Member
                </span>
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={subBusy}
                  className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] border border-[#0a1628]/25 hover:bg-[#0a1628] hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {subBusy ? 'Opening…' : 'Manage subscription'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={subscribe}
                disabled={subBusy || configured === false}
                className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#112240] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                {subBusy ? 'Starting…' : 'Become a Founding Member'}
              </button>
            )}
          </div>
        </div>

        {/* Donation card */}
        <div
          className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl px-7 py-8 sm:px-10 sm:py-10"
          style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05), 0 4px 12px rgba(10,22,40,0.04)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-3">
            One-time gift
          </p>
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium leading-tight mb-2"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Or just drop something in the tip jar.
          </h2>
          <p className="text-[13.5px] text-[#3d4a5c] leading-relaxed mb-6 max-w-md">
            Not ready for a subscription? Make a one-time contribution — every
            dollar goes the same 50/50 split.
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
              <span className="text-[14px] text-[#8a7f70]">$</span>
              <input
                type="number"
                min={5}
                value={donCustom}
                onChange={e => setDonCustom(e.target.value)}
                placeholder="other"
                className="w-20 text-[14px] text-[#0a1628] focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#8a7f70] mb-6">Minimum $5.</p>

          <button
            type="button"
            onClick={donate}
            disabled={donBusy || configured === false}
            className="inline-flex items-center gap-2 bg-[#990000] hover:bg-[#b30000] text-white text-[13px] font-semibold uppercase tracking-[0.14em] px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Heart className="w-4 h-4" />
            {donBusy ? 'Starting…' : 'Donate'}
          </button>
        </div>

        {/* Footer note */}
        <div className="text-center pt-2">
          <p className="text-[11.5px] text-[#8a7f70] max-w-md mx-auto leading-relaxed">
            Payments processed by Stripe. Penn Men&rsquo;s Golf isn&rsquo;t a registered 501(c)(3),
            so contributions aren&rsquo;t tax-deductible. The 50% transfer to the program
            is reconciled quarterly by the captain.{' '}
            <Link href="/player" className="text-[#0a1628] hover:underline">
              Back to the Clubhouse
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
