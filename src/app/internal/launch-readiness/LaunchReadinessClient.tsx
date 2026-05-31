'use client'

/**
 * Launch Readiness — captain checklist before flipping the sign on.
 * Founder-only. Everything is read on the server and passed in;
 * client-side actions (test email, persistence test) hit founder-only
 * endpoints.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Check, AlertTriangle, X, ExternalLink } from 'lucide-react'
import type { EnvCheckResult, ProductionUrlCheck, ReadinessStatus } from '@/lib/launch/env-readiness'
import type { BackendStatus } from '@/lib/launch/persistence-check'
import type { LaunchMetrics } from '@/lib/launch/metrics'

interface Props {
  envChecks: EnvCheckResult[]
  productionUrl: ProductionUrlCheck
  emailFrom: { configured: boolean; looksValid: boolean }
  backend: BackendStatus
  metrics: LaunchMetrics
}

interface Row {
  status: ReadinessStatus
  label: string
  detail: string
  link?: { href: string; label: string }
  hint?: string
}

interface Group {
  letter: string
  title: string
  rows: Row[]
}

function statusBadge(status: ReadinessStatus) {
  const palette: Record<ReadinessStatus, { bg: string; fg: string; label: string; Icon: typeof Check }> = {
    ready: { bg: '#2d6a4f', fg: '#fff', label: 'Ready', Icon: Check },
    missing: { bg: '#990000', fg: '#fff', label: 'Missing', Icon: X },
    warning: { bg: '#b8860b', fg: '#fff', label: 'Warning', Icon: AlertTriangle },
    manual: { bg: '#0a1628', fg: '#fff', label: 'Manual', Icon: AlertTriangle },
  }
  return palette[status]
}

function ItemRow({ row }: { row: Row }) {
  const p = statusBadge(row.status)
  const Icon = p.Icon
  return (
    <li className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-5 py-4 flex items-start gap-4">
      <span
        className="flex-none inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full mt-0.5"
        style={{ backgroundColor: p.bg, color: p.fg }}
      >
        <Icon className="w-3 h-3" />
        {p.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[#0a1628] font-medium text-[14px]">{row.label}</p>
        <p className="text-[12.5px] text-[#3d4a5c] leading-relaxed mt-0.5">{row.detail}</p>
        {row.hint && (
          <p className="text-[12px] text-[#8a7f70] italic mt-1">{row.hint}</p>
        )}
        {row.link && (
          <Link
            href={row.link.href}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0a1628] hover:text-[#990000] mt-2"
          >
            {row.link.label}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </li>
  )
}

export default function LaunchReadinessClient({
  envChecks,
  productionUrl,
  emailFrom,
  backend,
  metrics,
}: Props) {
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null)
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [persistenceStatus, setPersistenceStatus] = useState<string | null>(null)
  const [persistenceLoading, setPersistenceLoading] = useState(false)

  async function runTestEmail() {
    setTestEmailLoading(true)
    setTestEmailStatus(null)
    try {
      const res = await fetch('/api/internal/launch-readiness/test-email', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) {
        setTestEmailStatus(`Sent to ${j.to}. Resend id ${j.id ?? '—'}.`)
      } else {
        setTestEmailStatus(`Failed: ${j.error ?? `HTTP ${res.status}`}`)
      }
    } finally {
      setTestEmailLoading(false)
    }
  }

  async function runPersistenceTest() {
    setPersistenceLoading(true)
    setPersistenceStatus(null)
    try {
      const res = await fetch('/api/internal/launch-readiness/persistence-test', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) {
        setPersistenceStatus(`KV roundtrip OK (${j.latencyMs}ms). Heartbeat nonce ${j.value?.nonce ?? '—'}.`)
      } else {
        setPersistenceStatus(`Failed: ${j.error ?? `HTTP ${res.status}`}`)
      }
    } finally {
      setPersistenceLoading(false)
    }
  }

  // ── Build the grouped checklist ─────────────────────────────────
  const byCat = (cat: string) => envChecks.filter(c => c.category === cat)
  const envRow = (key: string, link?: Row['link']): Row => {
    const c = envChecks.find(x => x.key === key)
    if (!c) return { status: 'missing', label: key, detail: 'Unknown check' }
    const detail = c.displayValue ? `${c.label} · ${c.displayValue}` : c.label
    return {
      status: c.status,
      label: c.label,
      detail: c.present ? 'Present in this environment.' : (c.hint ?? `Set ${c.key} on Vercel.`),
      hint: c.severity === 'required' ? undefined : `Severity: ${c.severity}`,
      link,
    }
  }

  const groups: Group[] = [
    {
      letter: 'A',
      title: 'Domain & auth',
      rows: [
        envRow('AUTH_URL', { href: 'https://vercel.com/dashboard', label: 'Vercel env vars' }),
        envRow('AUTH_SECRET'),
        envRow('NEXT_PUBLIC_BASE_URL'),
        envRow('GOOGLE_CLIENT_ID'),
        envRow('GOOGLE_CLIENT_SECRET'),
        {
          status: productionUrl.configured
            ? productionUrl.looksProduction
              ? 'ready'
              : 'warning'
            : 'missing',
          label: 'Production URL points at penngolfclubhouse.com',
          detail: productionUrl.url
            ? `Configured URL: ${productionUrl.url}`
            : 'No AUTH_URL / NEXTAUTH_URL / NEXT_PUBLIC_BASE_URL set.',
          hint: productionUrl.looksProduction
            ? undefined
            : 'Google OAuth callback must match exactly: https://penngolfclubhouse.com/api/auth/callback/google',
        },
      ],
    },
    {
      letter: 'B',
      title: 'Persistence',
      rows: [
        envRow('KV_REST_API_URL'),
        envRow('KV_REST_API_TOKEN'),
        {
          status: backend.backend === 'kv' ? 'ready' : backend.isVercel ? 'missing' : 'warning',
          label: `Store backend: ${backend.backend}`,
          detail: backend.backend === 'kv'
            ? 'Writes go to Upstash Redis. Durable across cold starts.'
            : backend.isVercel
              ? 'Filesystem fallback in /tmp on Vercel. Writes DISAPPEAR on cold start.'
              : 'Filesystem fallback in dev. Fine locally; KV required on Vercel.',
          hint: backend.warning ?? undefined,
        },
        {
          status: 'manual',
          label: 'Live KV roundtrip test',
          detail: persistenceStatus ?? 'Click "Run roundtrip" below. Writes a 60-second heartbeat and reads it back.',
        },
      ],
    },
    {
      letter: 'C',
      title: 'Email',
      rows: [
        envRow('RESEND_API_KEY'),
        envRow('EMAIL_FROM'),
        {
          status: emailFrom.configured ? (emailFrom.looksValid ? 'ready' : 'warning') : 'missing',
          label: 'EMAIL_FROM shape',
          detail: emailFrom.configured
            ? emailFrom.looksValid
              ? 'Looks like a valid sender address.'
              : 'EMAIL_FROM does not look like an email. Should be "Name <addr@domain>" or "addr@domain".'
            : 'EMAIL_FROM is not set.',
        },
        {
          status: 'manual',
          label: 'Send a real test email to yourself',
          detail: testEmailStatus ?? 'Click "Send test" below. Lands in the inbox you signed in with.',
        },
        {
          status: 'manual',
          label: 'Weekly digest preview',
          detail: 'No automatic firing. Captain can review the template via the cron route preview.',
          link: { href: '/api/cron/weekly-digest?preview=1', label: 'Open preview' },
        },
      ],
    },
    {
      letter: 'D',
      title: 'Stripe',
      rows: [
        envRow('STRIPE_SECRET_KEY'),
        envRow('STRIPE_PRICE_ID'),
        envRow('STRIPE_FOUNDING_PRICE_ID'),
        envRow('STRIPE_PARENT_PRICE_ID'),
        envRow('STRIPE_WEBHOOK_SECRET'),
        {
          status: 'ready',
          label: 'Webhook route exists',
          detail: '/api/billing/webhook is signature-verified and fails closed without STRIPE_WEBHOOK_SECRET.',
          link: { href: '/support', label: 'Open Support page' },
        },
      ],
    },
    {
      letter: 'E',
      title: 'Storage',
      rows: [
        envRow('BLOB_READ_WRITE_TOKEN'),
        {
          status: 'ready',
          label: 'Upload route exists',
          detail: '/api/upload/image is auth-gated, MIME-allowlisted, 8MB image / 4MB video cap.',
        },
      ],
    },
    {
      letter: 'F',
      title: 'Access gates',
      rows: [
        { status: 'ready', label: '/internal/* is founder-only', detail: 'Every internal page calls requireFounderOr404() and returns a 404 to non-founders.' },
        { status: 'ready', label: '/api/internal/* is founder-only', detail: 'Every internal API uses requireFounder() and returns 403/404 otherwise.' },
        { status: 'ready', label: 'Claim approval required', detail: 'Members must be approved by a captain before posting / responding / chatting.' },
        { status: 'ready', label: 'Open Requests, chat, posting, RSVP, Moments require approved access', detail: 'All mutation endpoints check session.linkedPersonId.' },
        { status: 'ready', label: 'Support is optional, not access-gating', detail: 'No surface conditions access on subscription state.' },
        { status: 'ready', label: 'Upload, network publish, roster, scrape, alumni enrichment all auth-gated', detail: 'May 2026 audit closed the unauthenticated mutation gaps.' },
      ],
    },
    {
      letter: 'G',
      title: 'Launch content',
      rows: [
        { status: 'ready', label: '/launch page exists', detail: 'Public marketing page.', link: { href: '/launch', label: 'Open' } },
        { status: 'ready', label: 'Launch Kit', detail: 'Scripts, storyboard, social copy, Shoot Day playbook.', link: { href: '/internal/launch-kit', label: 'Open' } },
        { status: 'ready', label: 'Teleprompter', detail: 'For recording the launch video.', link: { href: '/internal/launch-kit/teleprompter', label: 'Open' } },
        { status: 'ready', label: 'Privacy page exists', detail: 'Plain-language data + access summary.', link: { href: '/privacy', label: 'Open' } },
        { status: 'ready', label: 'Terms page exists', detail: 'Plain-language acceptable use for the Clubhouse.', link: { href: '/terms', label: 'Open' } },
        { status: 'manual', label: 'Support copy says optional, not required', detail: 'Re-read /support and /launch before each share.' },
        { status: 'manual', label: 'First-time claim flow is clear', detail: 'Walk through it in a fresh incognito Chrome.', link: { href: '/account/setup', label: 'Open' } },
      ],
    },
    {
      letter: 'H',
      title: 'Smoke tests (manual)',
      rows: [
        { status: 'manual', label: 'Claim flow', detail: 'Land on /member-book → claim a card → confirm captain inbox + welcome email.' },
        { status: 'manual', label: 'Open Request flow', detail: 'Post one from /requests/new → see it appear on /the-course → Respond from a second account.' },
        { status: 'manual', label: 'RSVP flow', detail: 'Pick a gathering on /19th-hole → RSVP → host receives notification.' },
        { status: 'manual', label: 'Support checkout', detail: 'Click subscribe on /support → complete in Stripe test → webhook flips subscription.status to active.' },
        { status: 'manual', label: 'Profile edit', detail: 'Visit /account/profile → change city → save → see it on /the-course.' },
        { status: 'manual', label: 'Photo upload', detail: 'Upload a 1MB JPEG on profile → see new URL.' },
        { status: 'manual', label: 'Chat', detail: 'Start a 1-1 from /chat/new → send a message → unread badge appears.' },
        { status: 'manual', label: 'Studio edit', detail: 'Change a copy slot → refresh public page → see change live.', link: { href: '/internal/studio', label: 'Open' } },
        { status: 'manual', label: 'Weekly digest preview', detail: 'Hit the preview endpoint → confirm formatting + counts.' },
      ],
    },
  ]

  return (
    <div className="min-h-[calc(100dvh-60px)] bg-[#f8f5f0] pb-24">
      {/* Header */}
      <div className="bg-[#0a1628] text-white px-5 sm:px-8 py-10 sm:py-12">
        <div className="max-w-[1180px] mx-auto">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55 mb-3">
            Captain Checklist
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Launch Readiness
          </h1>
          <p className="text-white/65 text-sm max-w-2xl mt-3">
            One page to confirm everything is wired before you share the
            Clubhouse with the Penn Golf family. Run the checks, fix
            anything red, and ship.
          </p>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-10 space-y-12">
        {backend.warning && (
          <div className="bg-[#990000]/8 border border-[#990000]/30 rounded-2xl px-6 py-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
              Persistence warning
            </p>
            <p className="text-[13.5px] text-[#0a1628]">{backend.warning}</p>
          </div>
        )}

        {/* Numbers */}
        <section>
          <h2
            className="text-[#0a1628] text-2xl sm:text-3xl font-medium mb-1"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            By the numbers
          </h2>
          <p className="text-[12.5px] text-[#8a7f70] mb-4">
            Live counts straight from the store. No third-party trackers.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              ['In Member Book', metrics.membersInBook],
              ['Memberships live', metrics.teamMembershipsLive],
              ['Approved accounts', metrics.approvedAccounts],
              ['Pending claims', metrics.pendingClaims],
              ['Approved claims', metrics.approvedClaims],
              ['Profiles with city', metrics.profilesWithCity],
              ['Profiles with photo', metrics.profilesWithPhoto],
              ['Open to rounds', metrics.profilesOpenToRounds],
              ['Open Requests live', metrics.openRequestsLive],
              ['Gatherings active', metrics.gatherings],
              ['Moments', metrics.moments],
              ['Career posts', metrics.careerPosts],
              ['Chat conversations', metrics.chatConversations],
              ['Supporters active', metrics.supportersActive],
              ['Donations recorded', metrics.donationsCount],
              ['Family / affiliate', metrics.familyAffiliateMembers],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="bg-white border border-[rgba(180,168,150,0.4)] rounded-xl px-4 py-4"
              >
                <p className="text-2xl font-semibold text-[#0a1628]">{value}</p>
                <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#8a7f70] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
              Persistence roundtrip
            </p>
            <p className="text-[#0a1628] font-medium mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
              Confirm KV writes survive.
            </p>
            <p className="text-[12.5px] text-[#8a7f70] mb-4">
              Writes a 60-second heartbeat to Upstash and reads it back. Refuses if KV env vars are missing.
            </p>
            <button
              type="button"
              onClick={runPersistenceTest}
              disabled={persistenceLoading}
              className="inline-flex items-center text-[11.5px] font-semibold uppercase tracking-[0.16em] px-4 py-2 rounded bg-[#0a1628] text-white hover:bg-[#112240] disabled:opacity-60"
            >
              {persistenceLoading ? 'Running…' : 'Run roundtrip'}
            </button>
            {persistenceStatus && (
              <p className="text-[12.5px] text-[#0a1628] mt-3">{persistenceStatus}</p>
            )}
          </div>
          <div className="bg-white border border-[rgba(180,168,150,0.4)] rounded-2xl p-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000] mb-2">
              Test email
            </p>
            <p className="text-[#0a1628] font-medium mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
              Send a real Resend message to your inbox.
            </p>
            <p className="text-[12.5px] text-[#8a7f70] mb-4">
              Sends to the email on your session only. Cannot dispatch to anyone else.
            </p>
            <button
              type="button"
              onClick={runTestEmail}
              disabled={testEmailLoading}
              className="inline-flex items-center text-[11.5px] font-semibold uppercase tracking-[0.16em] px-4 py-2 rounded bg-[#0a1628] text-white hover:bg-[#112240] disabled:opacity-60"
            >
              {testEmailLoading ? 'Sending…' : 'Send test'}
            </button>
            {testEmailStatus && (
              <p className="text-[12.5px] text-[#0a1628] mt-3">{testEmailStatus}</p>
            )}
          </div>
        </section>

        {/* Checklist groups */}
        {groups.map(group => (
          <section key={group.letter}>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#990000]">
                {group.letter}
              </span>
              <h2
                className="text-[#0a1628] text-xl sm:text-2xl font-medium"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {group.title}
              </h2>
            </div>
            <ul className="space-y-2">
              {group.rows.map((row, i) => (
                <ItemRow key={i} row={row} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
